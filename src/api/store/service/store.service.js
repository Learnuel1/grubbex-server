const { CONSTANTS } = require("../../../config");
const config = require("../../../config/env");
const { KYCModel } = require("../../../models/kyc.model");
const StoreCategoryModel = require("../../../models/store.category");
const StoreModel = require("../../../models/store.model");

exports.find = async (search ) => {
  try{
      return await StoreModel.find(search)
  }catch(error){
    throw new Error(error)
  }
}
exports.remove= async (storeId, user ) => {
  try{
      return await StoreModel.findOneAndDelete({storeId, user}).exec();
  }catch(error){
    return {error}
  }
}
exports.update = async (info, storeId ) => {
  try{
    const storeExist = await this.find({name: new RegExp(info.name, 'i')});
    if(!storeExist || storeExist.length === 0) return {error:`${info.name}`} 
  return await StoreModel.findOneAndUpdate({storeId}, {...info, $set:{categoryId: info.categoryId}}, {returnOriginal: false})
  }catch(error){
    if(error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return { error:`A store with same ${field} already exist`}}
   return {error}
  }
}
exports.add = async (info) => {
  try{ 
    let storeExist = await this.find({ user:info.user});
    if(storeExist && storeExist.length > 0) return {error:`Store had been already exist`};
      storeExist = await this.find({name: new RegExp(info.name, 'i'), user:info.user});
    if(storeExist && storeExist.length > 0) return {error:`${info.name} already exist`};
    const category = await StoreCategoryModel.find({id:{$in: info.categoryId}, status: CONSTANTS.CATEGORY_STATUS_OBJ.published}).select("id name parent description status")
    if(category.length === 0) return {error: "Category was not found"}
 
    info.category = category;
    return await StoreModel.create({...info});
  }catch (error){
    if(error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return { error:`A store with same ${field} already exist`}}
   return {error}
  }
}
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

exports.search = async (query, page = 1, limit = 10) => {
  try {
   return await StoreModel.find(query).select("-id -__v -user -category._id"); 

} catch (error) {
    throw new Error(error);
}
}
exports.findNearby = async (location, radiusKm = 15, limit = 50) => {
  try {
    const latitude = Number(location.latitude ?? location.lat);
    const longitude = Number(location.longitude ?? location.lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Invalid location coordinates");
    }

    const toRad = (v) => (v * Math.PI) / 180;
    const latDiff = radiusKm / 111.0;
    const lngDiff = radiusKm / (111.320 * Math.cos(toRad(latitude)) || 1);

    const query = {
      'location.latitude': { $gte: latitude - latDiff, $lte: latitude + latDiff },
      'location.longitude': { $gte: longitude - lngDiff, $lte: longitude + lngDiff },
     // locationStatus: CONSTANTS.LOCATION_STATUS.set,
    };

    const stores = await KYCModel.find(query).populate([{
      path: "user",
      select: "likes status rating -_id"
    }]).select("-__v -_id -store._id -category._id -locationStatus -updatedAt -likers -viewers -user -reviews -profile.logo.id -profile.banner.id -bankDetails -documents -rejection -insurance -store.category._id -logistics");
    // const stores = await StoreModel.find(query).select("-__v -_id -store._id -category._id -locationStatus -updatedAt -likers -viewers -user -reviews");
    const nearby = stores
      .map((store) => {
        const storeLatitude = Number(store.location?.latitude);
        const storeLongitude = Number(store.location?.longitude);
        if (isNaN(storeLatitude) || isNaN(storeLongitude)) return null;
        const distance = calculateDistanceKm(latitude, longitude, storeLatitude, storeLongitude);
        const storeObject = store.toObject();
        storeObject.distance = Number(distance.toFixed(2));
        return storeObject;
      })
      .filter((store) => store !== null && store.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return nearby;
  } catch (error) {
    throw new Error(error.message || error);
  }
}
exports.storeByOwner = async (query) => {
  try {
   return await StoreModel.find(query).select("-id -__v -user -category._id"); 
   
  } catch (error) {
    throw new Error(error);
  }
}
exports.updateLocation = async (storeId, info) => {
  try{
  return await StoreModel.findOneAndUpdate({storeId}, {location: info.location,locationStatus:info.locationStatus}, {returnOriginal: false})
  }catch(error){ 
   return {error}
  }
}
exports.nearByStore = async (longitude, latitude) => {
  try{
    const nearBy = await StoreModel.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates:[longitude, latitude] },
          // $maxDistance: Number(10) *1000
          $maxDistance: Number(config.RIDER_RADIUS) *1000
        }
      }
    }).select("storeId").lean();
    return nearBy;
  } catch (error ){
    return {error:error.message}
  }
}
exports.allStore = async (query ={}, limit, skip) => {
  try {
      const stores = await KYCModel.find(query).populate([{
      path: "user",
      select: "likes status rating -_id"
    }]).select("-__v -_id -store._id -category._id -locationStatus -updatedAt -likers -viewers -user -reviews -profile.logo.id -profile.banner.id -bankDetails -documents -rejection -insurance -store.category._id -logistics").skip(skip).limit(limit)
    return stores || [];
  } catch (error) {
    return {error: error.message}
  }
}