const { CONSTANTS } = require("../../config");
const logger = require("../../logger");
const { createNewFAQ, getAllFAQ, removeFAQ, getFAQById, updateFAQ } = require("../services/interface");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");
const buildRes = require("../utils/seedData")
exports.createFAQ = async (req, res, next ) => {
    try{
        const faq = await createNewFAQ(req.body);
        if(!faq) return next(APIError.badRequest("FAQ failed to create, try again"));
        if (faq?.error) return next(APIError.badRequest(faq.error));
        logger.info("FAQ created successfully", {service: META.FAQ});
        res.status(200).json({success: true, msg: "FAQ created successfully"})
    } catch (error) {
        next (error);
    }
}
exports. getFAQs = async (req, res, next) => {
    try{
        const {search, target} = req.query;
        let query = {};
        if(search && !target) {
            query = {
                $or: [
                    {title: new RegExp(search, 'i')},
                   { category: new RegExp(search, 'i')},
                   {description: new RegExp(search, 'i')}
                ]
            }
        } else if (target && !search) {
            query = {target: target.toLowerCase()}
        } else if (search && target) {
            query = {
                target: target.toLowerCase(),
                $or: [
                    {title: new RegExp(search, 'i')},
                   { category: new RegExp(search, 'i')},
                     {description: new RegExp(search, 'i')}
                ]
            }
        }
        const faq = await getAllFAQ(query, req.userType);
        if (faq?.error) return next(APIError.badRequest(faq.error));
        logger.info("FAQs retrieved successfully", {service: META.FAQ});
        if(faq.length === 0) return res.status(200).json({msg: "No FAQ found", faq: [], count: 0});
        const response = buildRes.reqResponse("Found", faq, "faq", {count: faq.length});
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}
exports.deleteFAQ = async (req, res, next) => {
    try{
        const {id} = req.query;
        if(!id) return next(APIError.badRequest("FAQ ID is required"));
        const remove = await removeFAQ(id);
        if(!remove || remove === null) return next(APIError.notFound("FAQ does not exist"));
        if(remove?.error) return next(APIError.badRequest(remove.error));
        logger.info("FAQs deleted successfully", {service: META.FAQ});
        res.status(200).json({success: true, msg: "FAQ deleted successfully"});
    } catch (error) {
        next (error);
    }
}
exports. getSingleFAQById = async (req, res, next) => {
    try{
        const {id} = req.params;
        if(!id) return next(APIError.badRequest("FAQ ID is required"));
        const faq = await getFAQById(id, req.userType);
        if(!faq) return next(APIError.notFound("FAQ does not exist"))
        if (faq?.error) return next(APIError.badRequest(faq.error));
        logger.info("FAQ retrieved successfully", {service: META.FAQ});
        const response = buildRes.reqResponse("Found", faq, "faq");
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}
exports.modifyFAQ = async (req, res, next ) => {
     try{
        const {id} = req.body;
        if(!id) return next(APIError.badRequest("FAQ ID is required"));
        delete req.body.id;
        delete req.body.createdBy;
        const info = {} ;
        for (let key in req.body) {
            info[key] = req.body[key]?.trim();
        }
        if(Object.entries(info).length === 0) return next(APIError.badRequest("Provide data to update"));
        if(info?.target){
            if(!Array.from(Object.values(CONSTANTS.FAQ_TARGET_OBJ)).includes(info.target)) return next(APIError.badRequest("Invalid FAQ target"))
        }
        const update = await updateFAQ(id, info); 
        if(!update) return next(APIError.notFound("FAQ update failed, try again"))
        if (update?.error) return next(APIError.badRequest(update.error));
        logger.info("FAQ updated successfully", {service: META.FAQ});
        res.status(200).json({success: true, msg: "FAQ updated successfully"})
     } catch ( error ) {
        next (error);
     }
}