const shared = require("../shared");

const AdminOrderRouter = require("express").Router();
AdminOrderRouter.get("/all", shared.Controllers.OrderController.getAllOrders)
AdminOrderRouter.get("/account-orders", shared.Controllers.OrderController.getAccountOrders)
module.exports = AdminOrderRouter;