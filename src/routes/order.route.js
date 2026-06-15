const OrderRouter = require("express").Router();
const routes = require("express").Router();
const AdminOrderRouter = require("./admin.order.route");
const ShopperOrderRouter = require("./shopper.order.route");
const RiderOrderRouter = require("./rider.order.route");
const BusinessOrderRouter = require("./business.order.route");
const { userRequired, checkRouteUsed } = require("../middlewares/auth.middleware");
const { allowedRoles, notAllowedRoles } = require("../shared/middleware/data_validator.middleware");
const { CONSTANTS } = require("../config");

routes.use("/rider", notAllowedRoles([CONSTANTS.ACCOUNT_TYPE_OBJ.admin, CONSTANTS.ACCOUNT_TYPE_OBJ.business, CONSTANTS.ACCOUNT_TYPE_OBJ.shopper]), RiderOrderRouter);
routes.use("/admin", allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.admin]), AdminOrderRouter);
routes.use("/store", allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.business]), BusinessOrderRouter);
routes.use("/shopper", notAllowedRoles([CONSTANTS.ACCOUNT_TYPE_OBJ.admin, CONSTANTS.ACCOUNT_TYPE_OBJ.business, CONSTANTS.ACCOUNT_TYPE_OBJ.rider]), ShopperOrderRouter);

OrderRouter.use("/", userRequired, checkRouteUsed, routes);
module.exports = {
    OrderRouter 
}