const { CONSTANTS } = require('../config');
const { userRequired } = require('../middlewares/auth.middleware');
const shared = require('../shared');
const { allowedRoles, validateRequestData } = require('../shared/middleware/data_validator.middleware');

const LikeRatingRouter = require('express').Router();
const LikeRatingRoute = require('express').Router();
const LikeRatingViewerRouter = require('express').Router();

LikeRatingRoute.put("/like", validateRequestData("ZLikeRatingSchema"), shared.Controllers.LikeRatingController.like).put("/rate", validateRequestData("ZLikeRatingSchema"), shared.Controllers.LikeRatingController.rate).put("/review", validateRequestData("ZReviewSchema"), shared.Controllers.LikeRatingController.review).put("/follow", validateRequestData("ZLikeRatingSchema"), shared.Controllers.LikeRatingController.follow);

LikeRatingViewerRouter.get("/product/:productId/review", validateRequestData("ZSearchLikeRatingSchema"), shared.Controllers.LikeRatingController.getLikes);
LikeRatingViewerRouter.get("/likes", validateRequestData("ZSearchLikeRatingSchema"), shared.Controllers.LikeRatingController.getLikes).get("/reviews", validateRequestData("ZSearchLikeRatingSchema"), shared.Controllers.LikeRatingController.getReview).get("/followers", validateRequestData("ZSearchLikeRatingSchema"), shared.Controllers.LikeRatingController.getFollower);

LikeRatingRouter.use("/shopper", userRequired, allowedRoles(CONSTANTS.ACCOUNT_TYPE_OBJ.shopper), LikeRatingRoute);
 
module.exports = {
    LikeRatingRouter,
    LikeRatingViewerRouter
};