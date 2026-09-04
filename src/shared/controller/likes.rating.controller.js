const { CONSTANTS } = require("../../config");
const { likeItem, rateItem, reviewItem, searchRatings } = require("../../services");
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
exports.getLikes = async (req, res, next ) => {
    try{
        const {search, prodId, storeId, riderId} = req.query;
     const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit)) || 10);
    const skip = (page - 1) * limit;
    let searchQuery;
    req.body.type = CONSTANTS.ENDORSEMENT_TYPE_OBJ.like;

    if(prodId) {
        req.body.prodId = prodId;
            if(search) {
        searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
              $and:[
                {status: CONSTANTS.CATEGORY_STATUS_OBJ.published},
               {prodId:prodId}
    
              ]
             }
            }else {
                searchQuery = {
                status: CONSTANTS.CATEGORY_STATUS_OBJ.published,
                prodId:prodId
            } 
              
            }
            }else if(storeId) {
                req.body.storeId = storeId;
            if(search) {
            searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
              $and:[
               {storeId:storeId}
    
              ]
             }
            }else {
                searchQuery = {
                storeId:storeId
            } 
              
            }
            }
            else if(riderId) {
            if(search) {
            searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
              $and:[
               {riderId:riderId}
    
              ]
             }
            }else {
                searchQuery = {
                status: CONSTANTS.ORDER_STATUS_OBJ.completed,
                 riderId:riderId
            } 
              
            }
            } else {
                searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
            }
        }
            
            const {total, data, extraData} = await searchRatings(req.body, searchQuery, skip, limit, req.userId);
            if(!data) return next(APIError.notFound("No data found"));
            if (data?.error) return next(APIError.badRequest(data?.error));
            const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
            res.status(200).json({
                success: true, 
                msg: "Found", 
                data, 
                extraData,
                pagination :{
                    total,
                    totalPages, 
                    page, 
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1 
                }});

    } catch (error) {
        next(error);
    }
}
exports.getReview = async (req, res, next ) => {
    try{
        const {search, prodId, storeId, riderId} = req.query;
     const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit)) || 10);
    const skip = (page - 1) * limit;
    let searchQuery;
    req.body.type = CONSTANTS.ENDORSEMENT_TYPE_OBJ.review;

    if(prodId) {
        req.body.prodId = prodId;
            if(search) {
        searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
              $and:[
                {status: CONSTANTS.CATEGORY_STATUS_OBJ.published},
               {prodId:prodId}
    
              ]
             }
            }else {
                searchQuery = {
                status: CONSTANTS.CATEGORY_STATUS_OBJ.published,
                prodId:prodId
            } 
              
            }
            }else if(storeId) {
                req.body.storeId = storeId;
            if(search) {
            searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
              $and:[
               {storeId:storeId}
    
              ]
             }
            }else {
                searchQuery = {
                storeId:storeId
            } 
              
            }
            }
            else if(riderId) {
            if(search) {
            searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
              $and:[
               {riderId:riderId}
    
              ]
             }
            }else {
                searchQuery = {
                status: CONSTANTS.ORDER_STATUS_OBJ.completed,
                 riderId:riderId
            } 
              
            }
            } else {
                searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
            }
        }
            
            const {total, data, extraData} = await searchRatings(req.body, searchQuery, skip, limit, req.userId);
            if(!data) return next(APIError.notFound("No data found"));
            if (data?.error) return next(APIError.badRequest(data?.error));
            const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
            res.status(200).json({
                success: true, 
                msg: "Found", 
                data, 
                extraData,
                pagination :{
                    total,
                    totalPages, 
                    page, 
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1 
                }});

    } catch (error) {
        next(error);
    }
}
exports.getFollower = async (req, res, next ) => {
    try{
        const {search, prodId, storeId, riderId} = req.query;
     const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit)) || 10);
    const skip = (page - 1) * limit;
    let searchQuery;
    req.body.type = CONSTANTS.ENDORSEMENT_TYPE_OBJ.follower;

    if(prodId) {
        req.body.prodId = prodId;
            if(search) {
        searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
              $and:[
                {status: CONSTANTS.CATEGORY_STATUS_OBJ.published},
               {prodId:prodId}
    
              ]
             }
            }else {
                searchQuery = {
                status: CONSTANTS.CATEGORY_STATUS_OBJ.published,
                prodId:prodId
            } 
              
            }
            }else if(storeId) {
                req.body.storeId = storeId;
            if(search) {
            searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
              $and:[
               {storeId:storeId}
    
              ]
             }
            }else {
                searchQuery = {
                storeId:storeId
            } 
              
            }
            }
            else if(riderId) {
            if(search) {
            searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
              $and:[
               {riderId:riderId}
    
              ]
             }
            }else {
                searchQuery = {
                status: CONSTANTS.ORDER_STATUS_OBJ.completed,
                 riderId:riderId
            } 
              
            }
            } else {
                searchQuery = {
              $or:[ 
                {rating: new RegExp(search, 'i')},
                {followers: new RegExp(search, 'i')},
                {likes: new RegExp(search, 'i')},
                {reviews: new RegExp(search, 'i')},
              ],
            }
        }
            
            const {total, data, extraData} = await searchRatings(req.body, searchQuery, skip, limit, req.userId);
            if(!data) return next(APIError.notFound("No data found"));
            if (data?.error) return next(APIError.badRequest(data?.error));
            const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
            res.status(200).json({
                success: true, 
                msg: "Found", 
                data, 
                extraData,
                pagination :{
                    total,
                    totalPages, 
                    page, 
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1 
                }});

    } catch (error) {
        next(error);
    }
}