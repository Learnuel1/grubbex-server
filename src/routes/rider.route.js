const { CONSTANTS } = require("../config");
const { userRequired } = require("../middlewares/auth.middleware");
const { allowedRoles } = require("../shared/middleware/data_validator.middleware");
const { OrderRouter } = require("./order.route");
const { RiderKYCRouter } = require("./rider.kyc.route");

const RiderRoute = require("express").Router();
const routes = require("express").Router();

routes.use("/kyc", RiderKYCRouter) 

RiderRoute.use("/", userRequired, allowedRoles(CONSTANTS.ACCOUNT_TYPE_OBJ.rider), routes)
module.exports = {
    RiderRoute,
}