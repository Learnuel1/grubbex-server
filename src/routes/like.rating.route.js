const { CONSTANTS } = require('../config');
const { userRequired } = require('../middlewares/auth.middleware');
const shared = require('../shared');
const { allowedRoles, validateRequestData } = require('../shared/middleware/data_validator.middleware');

const LikeRatingRouter = require('express').Router();
const LikeRatingRoute = require('express').Router();

LikeRatingRoute.put("/like", validateRequestData("ZLikeRatingSchema"), shared.Controllers.LikeRatingController.like).put("/rate", validateRequestData("ZLikeRatingSchema"), shared.Controllers.LikeRatingController.rate).put("/review", validateRequestData("ZReviewSchema"), shared.Controllers.LikeRatingController.review);
LikeRatingRouter.use("/", userRequired, allowedRoles(CONSTANTS.ACCOUNT_TYPE_OBJ.shopper), LikeRatingRoute);
module.exports = {LikeRatingRouter};