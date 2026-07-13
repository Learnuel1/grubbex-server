const shared = require("../shared");

const RiderOrderRouter = require("express").Router();
RiderOrderRouter.get("/all", shared.Controllers.OrderController.getAllOrders).post("/order-pickup", shared.Controllers.OrderController.verifyPickUpByQRCodeAndCode).patch("/accept-order", shared.Controllers.OrderController.acceptOrder).get("/accepted-order",shared.Controllers.OrderController.getAcceptedOrders).post("/order-delivery", shared.Controllers.OrderController.verifyDeliveryByQRCodeAndCode)
module.exports = RiderOrderRouter;