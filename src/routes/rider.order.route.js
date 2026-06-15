const shared = require("../shared");

const RiderOrderRouter = require("express").Router();
RiderOrderRouter.get("/all", shared.Controllers.OrderController.getAllOrders).post("/order-pickup", shared.Controllers.OrderController.verifyPickUpByQRCode)
module.exports = RiderOrderRouter;