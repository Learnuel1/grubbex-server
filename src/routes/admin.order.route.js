const shared = require("../shared");

const AdminOrderRouter = require("express").Router();
AdminOrderRouter.get("/all", shared.Controllers.OrderController.getAllOrders)
module.exports = AdminOrderRouter;