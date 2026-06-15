const invitationRoute = require("express").Router();
const invitationModule = require("../api/admin");
const { CONSTANTS } = require("../config"); 
const { passwordRequired } = require("../middlewares/auth.middleware");
const { allowedRoles, validateRequestData } = require("../shared/middleware/data_validator.middleware");

invitationRoute.post("/", allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.super]), validateRequestData("ZInvitationSchema"), passwordRequired, invitationModule.invitationCtrl.sendInvitation).get("/",allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.super]), invitationModule.invitationCtrl.getInvitations).delete("/", allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.super]), invitationModule.invitationCtrl.removeInvitation)


module.exports = {
  invitationRoute
}