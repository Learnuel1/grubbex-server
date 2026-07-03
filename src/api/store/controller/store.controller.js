 const logger = require("../../../logger");
 const buildRes = require("../../../shared/utils/seedData");
const {  KYCUpdate } = require("../../../shared/services/interface");
const { META } = require("../../../shared/utils/actions");
const { APIError } = require("../../../shared/utils/apiError");
const { updateStore, removeStore, addNewStore, searchUserStore, getShopperFilteredProducts, findNearbyStores, getAllStore } = require("../service");
const { CONSTANTS } = require("../../../config"); 
const { getCategoryPreference, getShopperLikedProducts, getShopperLikedStore } = require("../../../services");
const { reqResponse } = require("../../../shared/utils/seedData");
exports.createStore = async (req, res, next) => {
  try{
    const create = await  addNewStore(req.body);
    if(!create) return next(APIError.badRequest("Store failed to created, try again"));
    if(create?.error) return next(APIError.badRequest(create.error))
    logger.info("Store created successfully", {service: META.STORE})
  const info = {
    kyc: CONSTANTS.KYC_TYPE_INFO.store,
    store: [ {
      storeId:create.storeId,
      name: create.name,
      category: create.category,
    }],
    userType: req.userType,
    user: req.user,
    userId: req.userId,
  } 
    const updateKYC = await KYCUpdate(info);
    if(updateKYC?.error) return next(APIError.badRequest(updateKYC.error))
    logger.info("Created KYC successfully", {service: META.KYC})
    res.status(200).json({success: true, msg: "Store created successfully"})
  } catch (error){
    next(error)
  }
}
exports.deleteStore = async (req, res, next) => {
  try{ 
    if(!req.query?.storeId) return next(APIError.badRequest("Store ID is required"));
    const remove = await removeStore(req.query.storeId, req.user);
    if(!remove) return next(APIError.notFound("Store does not exist"));
    if(remove?.error) return next(APIError.badRequest(remove.error));
    logger.info("Delete category successfully", {service: META.STORE})
 
    res.status(200).json({success: true, msg: "Store deleted successfully"});
  }catch (error) {
    next(error);
  }
}
exports.updateStore = async (req, res, next) => {
  try{
    const {storeId, categoryId}  = req.body;
    if(!storeId) return next(APIError.badRequest("Store ID is required"));
    if(!categoryId || categoryId.length === 0) return next(APIError.badRequest("Store list is required"));
    delete req.body.storeId;
 
    const info = { categoryId, user: req.user}
    const update = await updateStore(info, storeId);
 
    if(!update) return next(APIError.notFound("Store was not found"));
    if( update?.error) return next(APIError.badRequest(update.error));
    res.status(200).json({success: true, msg: "Store updated successfully"});
  }catch (error) {
    next(error);
  }
}

exports.searchStore = async (req, res, next) => {
  try{
    const search = req.body?.search;
    let query = {user: req.user};
    if(search) {
      query = {
      $or:[
        {name: new RegExp(search, 'i') },
        {storeId: new RegExp(search, 'i') }
      ],
      $and:[
        {user: req.user}
      ]
    }
    } 
    let result = await searchUserStore(query);
    if(!result || result.length === 0) return res.status(200).json({success: true, msg:"No store found"})
    if(result?.error) return next(APIError.badRequest(result.error));
  if(result && result.length > 0) result = result?.map(x => buildRes.rename_id(x.toObject()))
  logger.info("Store retrieved successfully", {service: META.STORE})
    res.status(200).json(buildRes.reqResponse("Store Info", result, "store", {count: result.length}))
  }catch (error) {
    next (error);
  }
}

exports.getProductForShopperHome = async (req, res, next) => {
  try{
    const preference = await getCategoryPreference(req.user);
    if(preference) {
      const regEx = new RegExp(preference.category.join('|'), 'i');
      let  query = { "category.name": regEx, status: CONSTANTS.CATEGORY_STATUS_OBJ.published } 
      const products =  await getShopperFilteredProducts(query);
      // check if you have liked the product
      const response = reqResponse("Found", products);
      logger.info("Preference Products retrieved successfully", {service: META.STORE})
      return res.status(200).json(response)
    } else { 
      let products =  await getShopperFilteredProducts({status: CONSTANTS.CATEGORY_STATUS_OBJ.published});
    //   const prodArr = [];
    // products.forEach((cur) => {
    //     const isLiked = cur.likers.find((like) => like?.account.toString() === req.user.toString());  
    //     const isReviewed = cur.reviews.find((review) => review.account === req.user.toString());
    //     if(isReviewed) { 
    //     }
    //     const rated = cur.raters.find((rate) => rate.account === req.user.toString()); 
    //    })
      const response =  reqResponse( products.length > 0 ? "Found": "No product", products);
      logger.info("Products retrieved successfully", {service: META.STORE})
      return res.status(200).json(response)
    }
  } catch( error ) {
    next (error)
  }
}
exports.getShopperLikedItems = async (req, res, next) => {
  try{
     const {liked} = req.params; 
      let  query = { prodId: {$ne: null}, account: req.user, status: CONSTANTS.CATEGORY_STATUS_OBJ.published}  
      let data;
      if(!liked || liked.toLowerCase() !== "products" && liked.toLowerCase() !== "stores") return next(APIError.badRequest("Provide search category"));
      if(liked.toLowerCase() === "products")
      data =  await getShopperLikedProducts(query);
    else data =  await getShopperLikedStore( { storeId: {$ne: null}, account: req.user} );
      const response = reqResponse( data.length > 0 ? "Found": "No liked item", data);
      logger.info("Preference Products retrieved successfully", {service: META.STORE})
      return res.status(200).json(response)
  } catch( error ) {
    next (error)
  }
}

exports.getNearbyStores = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) return next(APIError.badRequest("Latitude and longitude are required"));

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = radius ? parseFloat(radius) : 15;

    if (isNaN(latitude) || isNaN(longitude)) return next(APIError.badRequest("Invalid latitude or longitude"));
    if (isNaN(radiusKm) || radiusKm <= 0) return next(APIError.badRequest("Invalid radius"));

    const stores = await findNearbyStores({ latitude, longitude }, radiusKm, 100);
    if (!stores || stores.length === 0) {
      return res.status(200).json({ success: true, msg: "No stores within radius", data: [], count: 0 });
    }

    logger.info(`Found ${stores.length} nearby stores`, { service: META.STORE });
    res.status(200).json({ success: true, msg: "Stores found", data: stores, count: stores.length });
  } catch (error) {
    next(error);
  }
}
exports.getStores = async (req, res, next ) => {
  try{
    const { limit, skip, search } = req.query;
    let query;
    
    if(search) {
      query = { 
      name: new RegExp(search, 'i')
    }
  } else query = {};
  const stores = await getAllStore(query, limit, skip)
  if (!stores) return next(APIError.badRequest("Store retrieval failed, try again"));
  if(stores?.error) return next(APIError.badRequest(stores.error));
  logger.info("Stores retrieved successfully", {service: META.STORE});
  res.status(200).json({success: true, msg: "Found", data: stores})
  } catch (error) {
    next(error);
  }
}