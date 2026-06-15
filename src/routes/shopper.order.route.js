const { isOrderOTPValid } = require("../middlewares/auth.middleware");
const shared = require("../shared");
const { validateRequestData } = require("../shared/middleware/data_validator.middleware");
const { shippingAddressRouter } = require("./shipping.address.route");
const ShopperOrderRouter = require("express").Router();

ShopperOrderRouter.use("/shipping-address", shippingAddressRouter).get("/verify-promo-code", shared.Modules.ProductModule.ProductCtrl.verifyPromoCode).post("/initialize-order", validateRequestData("ZOrderSchema"), shared.Controllers.OrderController.initializeOrderWithPayStack).post("/complete-order",  shared.Controllers.OrderController.completeOrder).get("/orders",  shared.Controllers.OrderController.getAllOrders).get("/order-qr-code/:orderId",  shared.Controllers.OrderController.getOrderQRCode).get("/delivery-info", shared.Controllers.OrderController.getOderDistance) 
module.exports = ShopperOrderRouter;