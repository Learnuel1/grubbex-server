const { CONSTANTS } = require("../config");
const { userRequired } = require("../middlewares/auth.middleware");
const { Controllers } = require("../shared");
const { validateRequestData, allowedRoles } = require("../shared/middleware/data_validator.middleware");
const { multerImage } = require("../shared/utils/multer");
const route = require("express").Router();
const PromotionRoute = require("express").Router();
const AdvertRoute = require("express").Router();
PromotionRoute.post("/", multerImage.single("image"), validateRequestData("ZPromotionSchema"), Controllers.PromotionController.createPromotion).get("/", Controllers.PromotionController.promotions).delete("/", Controllers.PromotionController.remove).get("/:status", Controllers.PromotionController.activePromotions) 

route.get("/advert",  Controllers.PromotionController.activePromotions)
AdvertRoute.use("/", userRequired, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.shopper]), route);
module.exports = {PromotionRoute, AdvertRoute};