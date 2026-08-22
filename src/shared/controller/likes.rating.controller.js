const { CONSTANTS } = require("../../config");
const { likeItem, rateItem, reviewItem } = require("../../services");
const { APIError } = require("../utils/apiError");

exports.like = async (req, res, next ) => {
    try {
        delete req.body.createdBy;
        req.body.type = CONSTANTS.ENDORSEMENT_TYPE_OBJ.like;
        req.body.userId = req.userId;
        req.body.like =1;
        // const like = await likeItem(req.body);
        const like = await rateItem(req.body);
        if(!like) return next(APIError.notFound("Operation failed, try again"));
        if (like?.error) return next(APIError.badRequest(like?.error));
        res.status(200).json({success: true, msg: "Operation successful"});
    } catch (error) { 
        next (error);
    }
}
exports.follow = async (req, res, next ) => {
    try {
        delete req.body.createdBy;
        req.body.type = CONSTANTS.ENDORSEMENT_TYPE_OBJ.follower;
        req.body.userId = req.userId;
        req.body.follow =1; 
        const follow = await rateItem(req.body);
        if(!follow) return next(APIError.notFound("Operation failed, try again"));
        if (follow?.error) return next(APIError.badRequest(follow?.error));
        res.status(200).json({success: true, msg: "Operation successful"});
    } catch (error) { 
        next (error);
    }
}

exports.rate = async (req, res, next ) => {
    try {
        delete req.body.createdBy;
        req.body.type = CONSTANTS.ENDORSEMENT_TYPE_OBJ.rating;
         req.body.userId = req.userId;
        const rate = await rateItem(req.body);
        if(!rate) return next(APIError.notFound("Operation failed, try again"));
        if (rate?.error) return next(APIError.badRequest(rate?.error));
        res.status(200).json({success: true, msg: "Operation successful"});
    } catch (error) { 
        next (error);
    }
}

exports.review = async (req, res, next ) => {
    try {
        delete req.body.createdBy;
        req.body.type = CONSTANTS.ENDORSEMENT_TYPE_OBJ.review;
         req.body.userId = req.userId;
        const reviewed = await reviewItem(req.body);
        if(!reviewed) return next(APIError.notFound("Operation failed, try again"));
        if (reviewed?.error) return next(APIError.badRequest(reviewed?.error));
        res.status(200).json({success: true, msg: "Review successful"});
    } catch (error) { 
        next (error);
    }
}