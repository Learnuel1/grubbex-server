const { CONSTANTS } = require("../config");
const { userRequired, checkRouteUsed, adminRequired } = require("../middlewares/auth.middleware");
const shared = require("../shared");
const { ReturnedOrderController } = require("../shared/controller");
const { validateRequestData, allowedRoles } = require("../shared/middleware/data_validator.middleware");
const { multerFile, multerVideo } = require("../shared/utils/multer");
const { AdminReturnOrderRouter } = require("./admin.return.order");

const ReturnedOrderRouter = require("express")();
const routes = require("express")();
routes.post("/order/item",   multerVideo.fields([{name:"images", maxCount:4}, {name: "video", maxCount:1}]), allowedRoles([CONSTANTS.ACCOUNT_TYPE_OBJ.shopper]), validateRequestData("ZReturnOrderSchema"),  shared.Controllers.ReturnedOrderController.returnOrderItem ).get("/order-qr-code/:orderId", validateRequestData("ZOrderIdSchema"), allowedRoles([CONSTANTS.ACCOUNT_TYPE_OBJ.shopper, CONSTANTS.ACCOUNT_TYPE_OBJ.business]), shared.Controllers.ReturnedOrderController.getOrderQRCode).get("/orders", shared.Controllers.ReturnedOrderController.getReturnedOrders)
routes.use("/admin", adminRequired, AdminReturnOrderRouter)
ReturnedOrderRouter.use("/", userRequired, checkRouteUsed, routes);
module.exports = { 
    ReturnedOrderRouter,
}