const shared = require("../shared");
const { validateRequestData } = require("../shared/middleware/data_validator.middleware");

const AdminReturnOrderRouter = require("express")();

AdminReturnOrderRouter.get("/orders", shared.Controllers.ReturnedOrderController.getReturnedOrders)
.patch("/order", validateRequestData("ZOrderIdSchema"), shared.Controllers.ReturnedOrderController.returnedOrderStatusUpdate)

module.exports = {
    AdminReturnOrderRouter,
}