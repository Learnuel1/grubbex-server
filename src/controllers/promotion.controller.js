const { CONSTANTS } = require("../config");
const logger = require("../logger");
const { deletePromotion, newPromotion, getPromotions, findPromotionById, getInActivePromotions, getActivePromotions } = require("../services");

const { META } = require("../shared/utils/actions");
const { uploadSingleFileToCloudinary, deleteFileFromCloudinary } = require("../shared/utils/cloudinary");
const { APIError } = require("../utils/apiError");

exports.createPromotion = async (req, res, next) => {
    try     { 
        req.body.endDate = new Date(req.body.startDate.getTime() +  parseInt(req.body?.duration )* 24 * 60 * 60 * 1000).toISOString(); 
        if(new Date(req.body.startDate).toISOString().slice(0,10) < new Date().toISOString().slice(0,10)) 
            return next(APIError.badRequest("Start date cannot be in the past"));
        if( !req.file || req?.file?.length === 0) return next(APIError.badRequest("Promotion image is required"));
        const upload = await uploadSingleFileToCloudinary(req.file, req);
			if (upload?.error) return next(APIError.badRequest(upload.message));
			logger.info('Promotion image uploaded successfully', {
				service: META.CLOUDINARY,
			});
			req.body.image ={
				id: upload.public_id,
				url: upload.secure_url,
			}
            const promotion = await newPromotion(req.body);
            if(!promotion) return next(APIError.badRequest("Promotion failed to create, try again"));
            if(promotion?.error) return next(APIError.badRequest(promotion.error));
            logger.info("Promotion created successfulLy", {service:META.PROMOTION})
        res.status(200).json({ success:true, message: 'Promotion created successfully'});
    } catch ( error ){
        next (error)
    }
}
exports.remove = async (req, res, next ) => {
    try{
        const {id } = req.query;
        if(!id) return next (APIError.badRequest("Promotion ID is required"));
        const exist = await findPromotionById(id);
        if(!exist) return next(APIError.notFound("Promotion not found"));
        if(exist?.error) return next(APIError.badRequest(exist.error));
        if(exist.image?.id){
         const imageRemove =   await deleteFileFromCloudinary(exist.image.id);
         if(imageRemove?.error) return next(APIError.badRequest(imageRemove.error));
         logger.info("Promotion image deleted successfully", {service: META.CLOUDINARY});
        }
        const remove  = await deletePromotion(id);
        if(remove?.error) return next(APIError.badRequest(remove.error));
        logger.info("Promotion deleted successfully", {service: META.PROMOTION});
        res.status(200).json({success: true, msg: "Promotion deleted successfully"})
    } catch (error ){
        next (error );
    }
}
exports.promotions = async (req, res, next ) => {
    try{
        const {search} = req.query;
        const query = search ? { $or: [{name: {$regex: search, $options: "i"}}, {id:search},{status:search}]} : {};
        const promotions = await getPromotions(query);
        if(promotions?.error) return next(APIError.badRequesT(promotions.error));
        logger.info("Retrieved promotions successfully", {service: META.PROMOTION})
        res.status(200).json({msg: "Found", data: promotions})
    } catch (error ) {
        next (error);
    }
}
exports.activePromotions = async (req, res, next ) => {
    try{
         let {status} = req.params;
         if(!status) status =req.query?.status;
         if(!status) return next(APIError.badRequest("Status is required"));
         if(!CONSTANTS.PROMOTION_STATUS.includes(status)) return next(APIError.badRequest("Invalid status"));
         const promotions = status === CONSTANTS.PROMOTION_STATUS_OBJ.active ? await getActivePromotions() : await getInActivePromotions(); 
         if(promotions?.error) return next(APIError.badRequest(promotions.error));
        logger.info("Retrieved promotions successfully", {service: META.PROMOTION})
        res.status(200).json({msg: "Found", data: promotions, count: promotions.length})
    } catch (error ) {
        next (error);
    }
}
promotionCodeVerification = async (req, res, next ) => {
    try{
        const {code} = req.query;
        if(!code) return next(APIError.badRequest("Promotion code is required"));
        const promotion = await findPromotionById(code);
        if(!promotion) return next(APIError.notFound("Promotion not found"));
        if(promotion?.error) return next(APIError.badRequest(promotion.error));
        if(promotion.status !== CONSTANTS.PROMOTION_STATUS_OBJ.inactive) return next(APIError.badRequest("Promotion is invalid or inactive"));
        logger.info("Promotion code verified successfully", {service: META.PROMOTION})
        res.status(200).json({msg: "Promotion code verified successfully", data: promotion})
    } catch (error ) {
        next (error);
    }
}