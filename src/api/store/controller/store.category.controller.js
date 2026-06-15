const { CONSTANTS } = require("../../../config");
const logger = require("../../../logger");
const { META } = require("../../../shared/utils/actions");
const {  uploadSingleFileToCloudinary, deleteFileFromCloudinary } = require("../../../shared/utils/cloudinary");
const { remove_field } = require("../../../shared/utils/seedData");
const { APIError } = require("../../../utils/apiError");
const { createStoreCategory, updateStoreCategory, deleteStoreCategory, getStoreCategory, removeSubCategory, categoryExists } = require("../service");

exports.createCategory = async (req, res, next) => {
  try{
    req.body.user= req.user;
     // check if category exist first.   
     const checkCategory = await categoryExists(req.body.name);
     if(checkCategory) return next(APIError.badRequest(`${req.body.name} already exist`));
     if(req?.file){
       const imageUpload = await uploadSingleFileToCloudinary(req.file, req);
       if (imageUpload.error) return next(APIError.badRequest(imageUpload.message));
       logger.info('Category image uploaded successfully', {
         service: META.CLOUDINARY,
        });
        req.body.image = {
          id: imageUpload.public_id,
          url: imageUpload.secure_url,
        };
      }  
      req.body.createdBy = req.createdBy;
    const create = await   createStoreCategory(req.body);
    if(!create) return next(APIError.badRequest("Store category failed to create, try again"));
    if(create?.error) return next(APIError.badRequest(create.error))
    logger.info("Store category created successfully", {service: META.STORE})
    res.status(200).json({success: true, msg: "Store category created successfully"})
  } catch (error){
    next(error)
  }
}

exports.updateCategory = async (req, res, next) => {
  try {
    const {id} = req.body;
    if(!id) return next(APIError.badRequest("Store category ID is required"))
    delete req.body.id;
    const info = {};
    for (const field in req.body){
      info[field] = req.body[field];
    }
    if(info?.status){
      if(!CONSTANTS.CATEGORY_STATUS.includes(info.status.toLowerCase())) return next(APIError.badRequest("Invalid category status"));
     if(info.status.toLowerCase() === CONSTANTS.CATEGORY_STATUS[2])  info.status = info.status.concat("ed");
    } 
    // check if category exist
    const catExist = await getStoreCategory({id: new RegExp(id, 'i')});
    if(!catExist || catExist.length === 0) return next(APIError.badRequest("Category does not exist"));
    if(catExist?.error) return next(APIError.badRequest(catExist.error));
    // check for file in the request
    if(req?.file) {
      // delete existing image
      if(catExist[0].image.length > 0){
        await deleteFileFromCloudinary(catExist[0].image[0].id);
        logger.info("Existing category image deleted successfully", {service: META.CLOUDINARY});
      }
      const upload = await uploadSingleFileToCloudinary(req.file, req);
      if (upload.error) return next(APIError.badRequest(upload.message));
			logger.info('Category image uploaded successfully', {
				service: META.CLOUDINARY,
			});
			info.image = {
				id: upload.public_id,
				url: upload.secure_url,
			};
    }
   const update = await updateStoreCategory(id, info);
    if(!update) return next(APIError.badRequest("Store category does not exist"))
    if(update?.error) return next(APIError.badRequest(update.error))
    logger.info("Store category updated successfully", {service: META.STORE});
    res.status(200).json({success: true, msg: "Store category updated successfully"});
  } catch (error) {
    next(error);
  }
}
exports.deleteCategory = async (req, res, next) => {
  try {
    const {id} = req.query;
    if(!id) return next(APIError.badRequest("Store category ID is required"))
   const update = await deleteStoreCategory(id);
    if(!update) return next(APIError.badRequest("store category does not exist"))
    if(update?.error) return next(APIError.badRequest(update.error))
    logger.info("Store category deleted successfully", {service: META.STORE});
    res.status(200).json({success: true, msg: "Store category deleted successfully"});
  } catch (error) {
    next(error);
  }
}

exports.getCategory = async (req, res, next) => {
  try {
    const {search} = req.query;
    const searchQuery = {
          $or:[
            {name: new RegExp(search, 'i')},
            {status: new RegExp(search, 'i')}, 
            {id: new RegExp(search, 'i')}, 
          ]
    }
    let category = await getStoreCategory(searchQuery); 
    if(!category || category.length === 0) return res.status(200).json({success: true, msg: "No store category found", category}) 
      if (category?.error) return next(APIError.badRequest(category.error));
    const endpoint = req.baseUrl.split("/")[3]
      if(endpoint === CONSTANTS.ACCOUNT_TYPE_OBJ.business){
      category =  category.map(item =>  remove_field(item.toObject(),"createdBy"))
      }
    res.status(200).json({success: true, msg: "Found", category})
  } catch (error) {
    next (error)
  }
}

exports.delSubCategory = async (req, res, next) => {
  try{
    req.body.user= req.userId;
    const info = {};
    for (const key in req.body){
      info[key] = req.body[key];
    }
    if(!info) return next(APIError.badRequest("Subcategory info is required"));
    const create = await   removeSubCategory(info);
    if(!create) return next(APIError.badRequest("Sub category does not exist"));
    if(create?.error) return next(APIError.badRequest(create.error))
    logger.info("Store subcategory created successfully", {service: META.STORE})
    res.status(200).json({success: true, msg: "Store subcategory removed successfully"})
  } catch (error){
    next(error)
  }
}