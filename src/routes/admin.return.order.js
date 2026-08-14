const shared = require("../shared");

const AdminReturnOrderRouter = require("express")();

AdminReturnOrderRouter.get("/orders", shared.Controllers.ReturnedOrderController.getReturnedOrders)

module.exports = {
    AdminReturnOrderRouter,
}