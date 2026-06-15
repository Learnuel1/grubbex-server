const { CONSTANTS } = require("../../config");
const AccountModel = require("../../models/account.model");
const CityModel = require("../../models/city.model");
const { KYCModel } = require("../../models/kyc.model");  
const ProductModel = require("../../models/product.model");
const StoreModel = require("../../models/store.model");
const TownModel = require("../../models/town.model");

exports.update = async(info) => {
  try{
    let update;
    let completed = 0; 
    if(info.kyc === CONSTANTS.KYC_TYPE_INFO.tin ){
        update = await KYCModel.findOneAndUpdate({user:info.user},{...info.updateInfo}, {returnOriginal: false}).exec();
    }
    if(info.kyc === CONSTANTS.KYC_TYPE_INFO.store ){
      const KYC = await KYCModel.findOne({user:info.user}).exec();
      if(!KYC )
      update = await KYCModel.create({...info,  $set: {
         store: info?.store,  
      }
   })
      else{
        update = await KYCModel.findOneAndUpdate({user:info.user},{
          $set: { store: info?.store,
          }
          
        }, {returnOriginal: false}).exec();
      }

    }
    if(info.kyc === CONSTANTS.KYC_TYPE_INFO.profile ){
      const KYC = await KYCModel.findOne({user:info.user}).exec();
      if(!KYC )
      update = await KYCModel.create({...info,  $set: {
          profile: info.profile
      }
   })
      else{
        update = await KYCModel.findOneAndUpdate({user:info.user},{
          $set: {
            profile: info.profile
          }
          
        }, {returnOriginal: false}).exec();
      }
      await StoreModel.findOneAndUpdate({user: info.user}, {
        $set: { 
          address: info.profile.address
        }
      }).exec();
    }
    if(info.documents){
      const KYC = await KYCModel.findOne({user:info.user}).exec();
      if(!KYC){
        update = await KYCModel.create({...info,  $set: {
          documents: info.documents
        } });
  }
      else{
        update = await KYCModel.findOneAndUpdate({user:info.user},{
          $set: {
            documents: info.documents
          }
        },{returnOriginal: false}).exec();
      }
    }
    if(info.kyc === CONSTANTS.KYC_TYPE_INFO.bankDetails){
      const KYC = await KYCModel.findOne({user:info.user}).exec();
      if(!KYC)
      update = await KYCModel.create({...info, $set: {
        bankDetails: info.bankDetails,  
      } });
      else{
        update = await KYCModel.findOneAndUpdate({user:info.user},{
          $addToSet: {
            bankDetails: info.bankDetails,   
          }
        },{returnOriginal: false}).exec();
      }
    }
    if(info.kyc === CONSTANTS.KYC_TYPE_INFO.logistics){
      const KYC = await KYCModel.findOne({user:info.user}).exec();
      if(!KYC)
      update = await KYCModel.create({...info, $set: {
        logistics: info.logistics,  
      } });
      else{
        update = await KYCModel.findOneAndUpdate({user:info.user},{
          $set: {
            logistics: info.logistics,   
          }
        },{returnOriginal: false}).exec();
      }
    }
    if(info.kyc === CONSTANTS.KYC_TYPE_INFO.location){
      const KYC = await KYCModel.findOne({user:info.user}).exec();
      const locationData = {
        lat: info.location.latitude,
        lng: info.location.longitude,
        others:{ formattedAddress: info.location.formattedAddress },
      }
      if(!KYC){
      update = await KYCModel.create({...info,   location: info.location });
      }else{
        update = await KYCModel.findOneAndUpdate({user:info.user},{
            location: info.location,   
        },{returnOriginal: false}).exec();
      }
      await AccountModel.findOneAndUpdate({_id:info.user}, {locationData}, {returnOriginal: false}).exec();
    }

    const {profile, documents, bankDetails, store, logistics, location} = update;
      if(profile.length > 0 && info.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper || info.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.rider){
        profile.forEach((cur) => {
          if(cur.stateOfResidence && cur.address && cur.landMark) {
            completed++; 
          }
        })
      }
      let docCount = 0; 
      let docFound = false;
      if(logistics?.length > 0 && info.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.rider){
        logistics.forEach((cur) => {
          if(cur.vehicleType && cur.plateNumber && cur.model &&   cur.vehicleRegistration.url) {   
            docFound = true; 
            docCount++;
          }
            if(docFound === true)  completed++;  
            docFound = false;
          if(cur.insurance && cur.insurance.url) {  
            docFound = true; 
            docCount++;
          }
           if(docFound === true)  completed++;  
            docFound = false;
        })
      }
      if(profile.length > 0 && info.userType.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.business.toLowerCase()  ){
        profile.forEach((cur) => {
          if(cur.logo.id && cur.address.state && cur.address.town && cur.address.landMark) {
            completed++; 
          }
        })
      }
      
      if(documents.length > 0){
        documents.forEach((cur) => {
          if(cur.id && cur.url && cur.name && cur.docId) {
           docFound = true;
            if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.driversLicense.toLowerCase())docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.virtualNIN.toLowerCase() )docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.votersCard.toLowerCase() ) docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.passport.toLowerCase() ) docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.cac.toLowerCase() ) docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.nationalId.toLowerCase() ) docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.internationalPassport.toLowerCase() ) docCount++; 
          }
        })
        if(docFound === true)  completed++;  
        docFound = false;
      } 
      if(bankDetails.length > 0){
        bankDetails.forEach((cur) => {
          if(cur.accountNumber && cur.accountName && cur.bankName) {
            docFound = true;
          }
        })
        if(docFound === true)  completed++;  
        docFound = false;
      }
      if(store.length > 0){
        store.forEach((cur) => {
          if(cur.storeId && cur.name && cur.category[0].name) {
            completed++; 
          }
        })
      } 
      update.onBoarded = false;
      if(completed >= 4 && docCount >=1 && info.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business )  update.onBoarded = true;
     else if(completed >= 4 && docCount >=3 && info.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.rider )  update.onBoarded = true;
     if(!location || location?.latitude === 0 || location?.longitude === 0 || location?.hasOwnProperty("formattedAddress") === undefined)  update.onBoarded = false;
     const user = await AccountModel.findOneAndUpdate({userId:info.userId}, {verified:false}, {returnOriginal: false})
      update.save();
    return update
  }catch(error){
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
  }
}
exports.checkKYC = async (user) => {
  try{
    return await KYCModel.findOne({user}).select("-_id -__v -createdAt -updatedAt -user -documents.id -documents.back.id -profile.logo.id -profile.banner.id -store.category._id -rejection._id").exec();
  }catch(error) {
    return {error};
  }
}
exports.KYC = async (user) => {
  try{
    return await KYCModel.findOne({user}).select("-_id -__v -createdAt -updatedAt -user -rejection._id").exec();
  }catch(error) {
    return {error};
  }
}
exports.KYCByAccountId = async (userId) => {
  try{
    return await KYCModel.findOne({userId}).populate([{
      model: "Account",
      path: "user",
      select: "-_id -__v -createdAt -updatedAt -password -refreshToken  -balance -user.userId",
    }]).select("-_id -__v -createdAt -updatedAt -documents.id -documents.back.id -profile.logo.id -profile.banner.id -store.category._id -rejection._id").exec();
  }catch(error) {
    return {error};
  }
}
exports.KYCSearch = async (search) => {
  try{
    return await KYCModel.find(search).select("-_id -__v -user -documents.id -documents.back.id -profile.logo.id -profile.banner.id -store.category._id -logistics.vehicleRegistration.id -logistics.insurance.id -rejection._id").exec();
  }catch(error) {
    return {error};
  }
}

exports.updateStatus = async (search, info)=> {
  try{
    let completed = 0;
    let docFoundIn = "";
     let doc ;
    const findKYC = await  KYCModel.findOne(search).populate("user").select("-__v -createdAt -updatedAt ").exec(); 
    if(!findKYC) return {error: "Record does not exist"}
    doc = findKYC.documents.find(x => x.docId === info.docId);
    if(doc) docFoundIn = CONSTANTS.KYC_TYPE_INFO.documents ;
    if(!doc) {
      
      let exist = findKYC.logistics.find(x => x?.vehicleRegistration?.docId === info.docId )
      if(!exist) exist = findKYC.logistics.find(x =>x?.insurance?.docId === info.docId);
      if(!exist) return {error: "Document does not exist"}
      doc = findKYC.logistics.find(x => x?.vehicleRegistration?.docId !== info.docId || x?.insurance?.docId !== info.docId);
      if(doc) docFoundIn = CONSTANTS.KYC_TYPE_INFO.logistics ;
    }
    if(!doc) return {error: "Document does not exist"}
 
    let otherDoc =[];
    if(docFoundIn === CONSTANTS.KYC_TYPE_INFO.documents){
      if(doc.status === info.status) return {error: `Document already ${info.status}`}
     
      otherDoc = findKYC.documents.filter(x => x?.docId !== info.docId);
    doc.status = info.status;
    otherDoc.push(doc);
    }
    if(docFoundIn === CONSTANTS.KYC_TYPE_INFO.logistics ){
      if(doc?.vehicleRegistration.status === info.status && doc?.insurance.status === info.status) return {error: `"Document already ${info.status}"`}
      
      findKYC.logistics.forEach((cur) => {
        if(cur?.vehicleRegistration?.docId !== info.docId && cur?.insurance?.docId !== info.docId )  otherDoc.push(cur); 
          })

      if(doc?.vehicleRegistration.docId === info.docId) doc.vehicleRegistration.status = info.status;
      else if(doc?.insurance.docId === info.docId) doc.insurance.status = info.status;
      otherDoc.push(doc);
    }
    const {profile, documents, bankDetails, store, user, logistics, location, rejection} = findKYC;
    const existed = rejection.find(x => x.kyc === docFoundIn);
    const otherRejects = rejection.filter(x => x.kyc !== docFoundIn);
    if(existed){
      if(info.status === CONSTANTS.KYC_STATUS_OBJ.approved) rejection.pop(existed) 
    }else {
      const reject = {
        kyc: docFoundIn,
        name: doc.name,
      }
      rejection.push(reject)
  }
      if(profile.length > 0 && user.type === CONSTANTS.ACCOUNT_TYPE_OBJ.user || user.type === CONSTANTS.ACCOUNT_TYPE_OBJ.rider){
        profile.forEach((cur) => {
          if(cur.address.state && cur.address.town && cur.address.landMark) {
            completed++; 
          }
        })
      }
      if(profile.length > 0 && user.type === CONSTANTS.ACCOUNT_TYPE_OBJ.business  ){
        profile.forEach((cur) => {
          if(cur.logo.id && cur.address.state && cur.address.town && cur.address.landMark) {
            completed++; 
          }
        })
      } 
      let docCount =0; 
      let docFound = false;
      
      if(documents.length > 0){
        documents.forEach((cur) => {
          if(cur.id && cur.url && cur.name && cur.docId) {
            docFound = true;
            if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.driversLicense.toLowerCase())docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.virtualNIN.toLowerCase() )docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.votersCard.toLowerCase() ) docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.passport.toLowerCase() ) docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.cac.toLowerCase() ) docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.internationalPassport.toLowerCase() ) docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.vehicleRegistration.toLowerCase() ) docCount++; 
           else if(cur.name.toLowerCase() === CONSTANTS.KYC_TYPE_INFO.nationalId.toLowerCase() ) docCount++; 
          }
        }) 
        if(docFound === true)  completed++;  
        docFound = false;
      } 
      if(bankDetails.length > 0){
        bankDetails.forEach((cur) => {
          if(cur.accountNumber && cur.accountName && cur.bankName) {
            docFound = true;
          }
        })
        if(docFound === true)  completed++;  
        docFound = false;
      }
      if(store.length > 0){
        store.forEach((cur) => {
          if(cur.storeId && cur.name && cur.category[0].name) {
            completed++; 
          }
        })
      } 
      // check for location
      if(location && location.hasOwnProperty("latitude") && location?.latitude !== 0  && location.hasOwnProperty("formattedAddress")) completed++;
      let onBoarded = false 
     
      // verify user
      let verified = false;
      otherDoc.forEach((cur) => {
        if(docFoundIn === CONSTANTS.KYC_TYPE_INFO.logistics ){
          if(cur?.vehicleRegistration?.status.toLowerCase() === CONSTANTS.KYC_STATUS_OBJ.approved && cur?.insurance?.status.toLowerCase() === CONSTANTS.KYC_STATUS_OBJ.approved){ 
            docCount= docCount + 2; 
            docFound = true;
            verified = true 
          }else if(cur?.vehicleRegistration?.status.toLowerCase() === CONSTANTS.KYC_STATUS_OBJ.approved || cur?.insurance?.status.toLowerCase() === CONSTANTS.KYC_STATUS_OBJ.approved){ 
            docCount++;
            docFound = true;
            verified = false 
          } else verified = false; 
          if(cur?.vehicleRegistration.hasOwnProperty("url") ) { 
            docCount++;
             docFound = true;
          }
          if(cur?.insurance?.url.hasOwnProperty("url")) { 
            docCount++;
             docFound = true;
          }
          if(docFound === true)  completed++;  
            docFound = false;
          if(cur?.vehicleRegistration?.status.toLowerCase() !== CONSTANTS.KYC_STATUS_OBJ.approved && cur?.insurance?.status.toLowerCase() !== CONSTANTS.KYC_STATUS_OBJ.approved){
            docCount = docCount -2 >=0 ? docCount -2 : 0;
            verified = false;
          }  
        }else{ 
          verified = cur.status.toLowerCase() === CONSTANTS.KYC_STATUS_OBJ.approved ? true : false;
        } 
      }) 
      if(completed >= 5 && docCount >= 1 && user.type === CONSTANTS.ACCOUNT_TYPE_OBJ.business )  onBoarded = true;
     else if(completed >= 5 && docCount >= 3 && user.type === CONSTANTS.ACCOUNT_TYPE_OBJ.rider )  onBoarded = true;
     let update;

     if(docFoundIn === CONSTANTS.KYC_TYPE_INFO.documents){ 
      update =  await KYCModel.findOneAndUpdate(search, {onBoarded, $set:{
        documents: otherDoc,
        rejection:rejection
      }}, {returnOriginal: false})
    } else if(docFoundIn === CONSTANTS.KYC_TYPE_INFO.logistics){ 
      update =  await KYCModel.findOneAndUpdate(search, {onBoarded, $set:{
        logistics: otherDoc,
        rejection:rejection
      }}, {returnOriginal: false})
    }
       await AccountModel.findByIdAndUpdate(user._id, {verified}, {returnOriginal: false})
     return update
  }catch(error){
    return {error};
  }
}

exports.updateCityInfo = async (info) => {
  try{
      const cityExist = await CityModel.findOne({city: new RegExp(info.city, "i")}).exec();
      if(cityExist){
        const townExist =await TownModel.findOne({town: new RegExp(info.town, "i"), cityId: cityExist.cityId})
        if(!townExist){
           await TownModel.create({town: info.town, cityId: info.cityId, city: cityExist._id, townId: info.townId})
        }
      }else{
        const createCity = await CityModel.create({...info})
        await TownModel.create({town: info.town, city: createCity._id, cityId: info.cityId, townId: info.townId})
      }
  } catch (error){
    return {error};
  }
}
exports.cityInfo = async () => {
  try{
    return await CityModel.find({}).select("cityId city -_id").exec();
  } catch (error) {
    return {error}
  }
}
exports.townInfo = async (cityId) => {
  try{
    return await TownModel.find({cityId}).select("-_id -city -cityId -createdAt -updatedAt -__v").exec();
  } catch (error) {
    return {error}
  }
}

exports.storeAddress = async (query) => {
  try {
    if( query.hasOwnProperty("prodId")){
      const product = await ProductModel.findOne(query).select("storeId store").exec();
      if(!product) return {error: "Invalid search query"};
      return await KYCModel.findOne({storeId: product.storeId}).select("profile.address -_id");
    }else return await KYCModel.findOne(query).select("profile.address -_id");
  } catch (error ) {
    return {error: error.message};
  }
}
exports.getStoreAddress = async (storeId) => {
  try {
    const store = await StoreModel.findOne({storeId}).select("-_id -__v -createdAt -updatedAt").exec();
    if(!store) return {error: "Store not found"};
    return store;
  } catch (error) {
    return {error: error.message};
  }
}