const { CONSTANTS } = require("../config");
const { userRequired, checkRouteUsed, adminRequired } = require("../middlewares/auth.middleware");
const shared = require("../shared");
 
const { validateRequestData, allowedRoles } = require("../shared/middleware/data_validator.middleware");

const PayoutRouter = require("express")();

PayoutRouter.post("/create", userRequired,checkRouteUsed, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.rider, CONSTANTS.ACCOUNT_ROLE_OBJ.business]), validateRequestData("ZPayoutSchema"),  shared.Controllers.PayoutController.createPayout).get("/all", adminRequired,  checkRouteUsed, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.admin, CONSTANTS.ACCOUNT_ROLE_OBJ.service, CONSTANTS.ACCOUNT_ROLE_OBJ.super]), shared.Controllers.PayoutController.getPayouts).get("/recent", userRequired, checkRouteUsed, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.service, CONSTANTS.ACCOUNT_ROLE_OBJ.admin, CONSTANTS.ACCOUNT_ROLE_OBJ.super]), shared.Controllers.PayoutController.recentPayouts).get("/aggregate", adminRequired, checkRouteUsed, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.admin, CONSTANTS.ACCOUNT_ROLE_OBJ.service, CONSTANTS.ACCOUNT_ROLE_OBJ.super]), shared.Controllers.PayoutController.payoutsAggregate).get("/top-payouts", adminRequired, checkRouteUsed, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.admin, CONSTANTS.ACCOUNT_ROLE_OBJ.service, CONSTANTS.ACCOUNT_ROLE_OBJ.super]), shared.Controllers.PayoutController.getTopPayouts).post("/initialize-transfer", adminRequired, shared.Controllers.PayoutController.initializeTransfer)


module.exports = {
    PayoutRouter
}