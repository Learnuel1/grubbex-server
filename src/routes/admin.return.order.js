const shared = require("../shared");

const AdminReturnOrderRouter = require("express")();

AdminReturnOrderRouter.get("/orders", shared.Controllers.ReturnedOrderController.getReturnedOrders)
.patch("/order", validateRequestData("ZOrderIdSchema"), shared.Controllers.ReturnedOrderController.returnedOrderStatusUpdate)

module.exports = {
    AdminReturnOrderRouter,
}