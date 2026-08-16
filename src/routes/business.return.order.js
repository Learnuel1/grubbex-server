const shared = require("../shared");

const StoreReturnOrderRouter = require("express")();

StoreReturnOrderRouter.get("/orders", shared.Controllers.ReturnedOrderController.getReturnedOrders )
module.exports = {
    StoreReturnOrderRouter
}