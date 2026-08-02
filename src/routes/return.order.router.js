const { CONSTANTS } = require("../config");
const { userRequired, checkRouteUsed } = require("../middlewares/auth.middleware");
const shared = require("../shared");
const { ReturnedOrderController } = require("../shared/controller");
const { validateRequestData, allowedRoles } = require("../shared/middleware/data_validator.middleware");
const { multerFile } = require("../shared/utils/multer");

const ReturnedOrderRouter = require("express")();
const routes = require("express")();
routes.post("/order/item", multerFile.fields([{name: "images", maxCount:4}]), allowedRoles([CONSTANTS.ACCOUNT_TYPE_OBJ.shopper]), validateRequestData("ZOrderIdSchema"),  shared.Controllers.ReturnedOrderController.returnOrderItem )
ReturnedOrderRouter.use("/", userRequired, checkRouteUsed, routes);
module.exports = { 
    ReturnedOrderRouter,
}