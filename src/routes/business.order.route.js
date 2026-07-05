const shared = require("../shared");

const BusinessOrderRouter = require("express").Router();
BusinessOrderRouter.get("/all", shared.Controllers.OrderController.getAllOrders).patch("/update/:orderId", shared.Controllers.OrderController.orderStatusUpdate).get("/order-pickup/:orderId", shared.Controllers.OrderController.generateOrderPickUpCode).get("/track-order/:orderId", shared.Controllers.OrderController.trackOrder);

module.exports = BusinessOrderRouter;