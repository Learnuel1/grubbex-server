const LocationRouter = require("express").Router();
const { userRequired, checkRouteUsed } = require("../middlewares/auth.middleware");
const { allowedRoles } = require("../shared/middleware/data_validator.middleware");
const { CONSTANTS } = require("../config");
const { getReverseGeocode, isAddressNormalized } = require("../controllers/location.controller");
const shared = require("../shared");
const routes = require("express")();
routes.post("/store", getReverseGeocode)
.post("/address", allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.shopper, CONSTANTS.ACCOUNT_ROLE_OBJ.business]), isAddressNormalized).patch("/update-availability", allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.rider, CONSTANTS.ACCOUNT_ROLE_OBJ.shopper]), shared.Controllers.LocationController.updateAVailability).get("/current-location", allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.rider, CONSTANTS.ACCOUNT_ROLE_OBJ.shopper]), shared.Controllers.LocationController.getRiderCurrentLocation).get("/order-current-location",allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.rider, CONSTANTS.ACCOUNT_ROLE_OBJ.shopper]),  shared.Controllers.LocationController.getOrderCurrentLocation)

LocationRouter.use("/", userRequired, checkRouteUsed, routes);
module.exports = {
    LocationRouter,
}