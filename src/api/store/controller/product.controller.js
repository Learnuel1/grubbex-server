const { CONSTANTS } = require("../../../config");
const config = require("../../../config/env");
const logger = require("../../../logger");
const { getProfile } = require("../../../services");
const { validateRequestData } = require("../../../shared/middleware/data_validator.middleware");
const { META } = require("../../../shared/utils/actions");
const { APIError } = require("../../../shared/utils/apiError");
const { uploadFileToCloudinary, uploadSingleFileToCloudinary, uploadBase64ToCloudinary } = require("../../../shared/utils/cloudinary");
const { shortIdGen } = require("../../../shared/utils/Generator");
const { generateQRCode } = require("../../../utils/validation");
const { getStoreCategory, addNewProduct, searchUserStore, getProductsByStore, deleteProduct, updateProductStatus, getProductsByStoreId, verifyProductPromoCode, findDiscountCode } = require("../service");
exports.createProduct = async (req, res, next) => {
  try {
    const { category, subcategory } = req.body;
    let additionalInfo = req.body?.additionalInfo;
    let variation = req.body?.variation;
    delete req.body.additionalInfo;
    delete req.body.variation;
     const mainImage = {};
    if(additionalInfo)
      additionalInfo = JSON.parse(JSON.stringify(additionalInfo.trim()));
    if(variation && variation.hasOwnProperty("type")) {
      const variationObjects = [];
      variation.forEach((cur) =>{
        variationObjects.push(JSON.parse(JSON.stringify(cur.trim())))
      });
      req.body.variation = [variation];
    }
    req.body.prodId = shortIdGen(20);
    const { price, discountPrice, discountCode } = req.body;
    delete req.body.price;
    const userStatus = await getProfile(req.user);
    if (userStatus?.verified === false) req.body.status = CONSTANTS.CATEGORY_STATUS_OBJ.draft
    else req.body.status = req.body.status.toLowerCase() === "publish" ? req.body.status.concat("ed"):req.body.status;
    let discountRate
    if (discountPrice) {
      discountRate = parseFloat(((discountPrice / price) * 100).toFixed(2));
      delete req.body.discount;
      delete req.body.discountCode;
    }
    // check if discount code already exist
    if(discountCode) {
      const promoCodeExist = await findDiscountCode(discountCode);
      if(promoCodeExist?.error) return next(APIError.badRequest(promoCodeExist.error));
      if(promoCodeExist) return next(APIError.badRequest("Promo Code not available, try another"));
    } 
    req.body.pricing = {
      price: price ? parseFloat(price).toFixed(2) : parseFloat(price).toFixed(2),
      discountPrice: discountPrice ? parseFloat(discountPrice).toFixed(2) : parseFloat(discountPrice).toFixed(2),
      discountCode,
      discountRate,
    }
    req.body.vat = config?.VAT !== 0 ? (config.VAT / 100) * price: 0;
   req.body.variation = variation;
    req.body.additionalInfo = additionalInfo;
    let result = await searchUserStore({user: req.user});
    if(!result || result.length === 0) return res.status(200).json({success: true, msg:"No store found"})
    req.body.store = result[0]._id;
    req.body.storeId = result[0].storeId;
    const categoryQuery = {
      id: new RegExp(category, 'i')
    }
    let categoryInfo = await getStoreCategory(categoryQuery);
    if (!categoryInfo || categoryInfo.length === 0) return next(APIError.badRequest("Product category does not exit"));
    if (subcategory) {
      const sub = categoryInfo[0]?.subCategory.find(cat => cat.name.trim().toLowerCase() === subcategory.trim().toLowerCase())
      if (!sub) return next(APIError.badRequest("Product subcategory does not exit"));
      req.body.subcategory = sub.name
    }
    req.body.category = {
      id: categoryInfo[0].id,
      name: categoryInfo[0].name,
    }
    if(req?.files?.length === 0) return next(APIError.badRequest("Select product images to upload"));
    if (!req?.files?.mainImage && !req?.file?.mainImage) return next(APIError.badRequest("Product main image is required"));
    const mainImageUpload = await uploadFileToCloudinary(req.files.mainImage, req);
    if (mainImageUpload.error) return next(APIError.badRequest(mainImageUpload.message));
    logger.info('Product main image uploaded successfully', {
      service: META.CLOUDINARY,
    });
        
      mainImage.id = mainImageUpload.public_id;
      mainImage.url = mainImageUpload.secure_url;
     
    // other images
    otherImages = [];
    if (req?.files?.others?.length > 0) {
      const { others } = req.files;
      let info = await uploadFileToCloudinary(others, req);
      if (info?.error) return next(APIError.badRequest(info.message));
      otherImages.push({
        id: info.public_id,
        url: info.secure_url,
      })
      others.shift();
      if (others?.length > 0) {
        const info_2 = await uploadFileToCloudinary(others, req);
        if (info_2.error) return next(APIError.badRequest(info_2.message));
        otherImages.push({
          id: info_2.public_id,
          url: info_2.secure_url,
        })
      }
      others.shift();
      if (others?.length > 0) {
        const info_3 = await uploadFileToCloudinary(others, req);
        if (info_3.error) return next(APIError.badRequest(info_3.message));
        otherImages.push({
          id: info_3.public_id,
          url: info_3.secure_url,
        })
      }
      others.shift();
      if (others?.length > 0) {
        const info_4 = await uploadFileToCloudinary(others, req);
        if (info_4.error) return next(APIError.badRequest(info_4.message));
        otherImages.push({
          id: info_4.public_id,
          url: info_4.secure_url,
        })
      }

      logger.info(`Other ${otherImages?.length} images uploaded successfully'`, {
        service: META.CLOUDINARY,
      });
    }
    req.body.media = {
      mainImage: mainImage,
      others: otherImages,
    }
    if(discountCode){
      //generate barcode and
      const qrCode = await generateQRCode(`${req.body.prodId-req.body.storeId-req.body.title-req.body.pricing-req.body.description}`);
      if(qrCode?.error) return next(APIError.badRequest(qrCode.error));
      const qrCodeUpload = await uploadBase64ToCloudinary(qrCode, req);
       if (qrCodeUpload.error) return next(APIError.badRequest(qrCodeUpload.message));
      logger.info('Product barcode uploaded successfully', {service: META.PRODUCT});
      req.body.barcode = [ 
        {
        id: qrCodeUpload.public_id,
        url: qrCodeUpload.secure_url,
      }
    ]
    }
    
    const createProduct = await addNewProduct( validateRequestData("ZProductSchema", req.body), req.body);
    if (!createProduct) return next(APIError.badRequest("Product creation failed, try again"));
    if (createProduct?.error) return next(APIError.badRequest(createProduct.error));
    logger.info("Product created successfully", {service: META.PRODUCT});
    res.status(201).json({success: true, msg: "Product created successfully"})
  } catch (error) {
    next(error)
  }
}
exports.productsByStoreOwner = async (req, res, next) => {
  try{
    let result = await searchUserStore({user: req.user});
    if(!result || result.length === 0) return res.status(200).json({success: true, msg:"No store found"})
    req.body.store = result[0]._id;
    req.body.storeId = result[0].storeId;
    const storeProducts = await getProductsByStore(req.body.store);
    logger.info("Products retrieved successfully", {service: META.PRODUCT})
  res.status(200).json({success: true, message: "Found", products: storeProducts, total: storeProducts.length})
  } catch(error) {
    next (error)
  }
}
exports.deleteStoreProduct = async (req, res, next) => {
  try{
    const {prodId} = req.query;
    if(!prodId) return next (APIError.badRequest("Product ID is required"));
    let result = await searchUserStore({user: req.user});
    if(!result || result.length === 0) return res.status(200).json({success: true, msg:"No store found"})
    req.body.store = result[0]._id;
    req.body.storeId = result[0].storeId;
    const storeProduct = await deleteProduct(prodId, req.body.store);
    if(!storeProduct) return next(APIError.badRequest("Product does not exist"))
    if(storeProduct?.error) return next(APIError.badRequest(storeProduct.error))
    logger.info("Product deleted successfully", {service: META.PRODUCT})
    res.status(200).json({success: true, message:"Product deleted successfully"})
  } catch(error) {
    next (error)
  }
}
exports.updateStoreProductStatus = async (req, res, next) => {
  try{
    if(!req?.verified) return next(APIError.badRequest("You are not verified yet"));
    const {prodId, status} = req.body;
    if(!prodId) return next (APIError.badRequest("Product ID is required"));
    if(!status) return next (APIError.badRequest("Product status is required"));
    let updated = status.toLowerCase() === "publish" ? status.concat("ed") : status;
    if(!CONSTANTS.CATEGORY_STATUS.includes(updated.toLowerCase())) return next(APIError.badRequest("Invalid product status"));
    let result = await searchUserStore({user: req.user});
    if(!result || result.length === 0) return res.status(200).json({success: true, msg:"No store found"})
    req.body.store = result[0]._id;
    req.body.storeId = result[0].storeId;
    const storeProducts = await updateProductStatus({prodId, store:req.body.store, status: updated, user:req.user});
    if(!storeProducts) return next(APIError.badRequest("Product status update failed, try again."));
    if(storeProducts?.error) return next(APIError.badRequest(storeProducts.error));
    logger.info("Product status updated successfully", {service: META.PRODUCT})
    res.status(200).json({success: true, message:"Product status updated successfully"})
  } catch(error) {
    next (error)
  }
}
exports.productsByStoreId = async (req, res, next) => {
  try{ 
    const { storeId } = req.query; 
    const storeProducts = await getProductsByStoreId(storeId);
    logger.info("Products retrieved successfully", {service: META.PRODUCT})
  res.status(200).json({success: true, message: "Found", products: storeProducts, total: storeProducts.length})
  } catch(error) {
    next (error)
  }
}
exports.verifyPromoCode = async ( req, res, next ) => {
  try {
    const { code } = req.query;
    if(!code) return next(APIError.badRequest("Promo code is required"));
    const promo = await verifyProductPromoCode(code);
    if(!promo) return next(APIError.notFound("Promo code does not exist"));
    if(promo?.error) return next(APIError.badRequest(promo.error));
    logger.info("Product promo code verified successfully", {service: META.ORDER});
    res.status(200).json({success: true, msg: "Promo code verified successfully", promo});
  } catch (error ) {
    next(error);
  }
}
