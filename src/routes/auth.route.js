const express = require('express'); 
const Controller = require('../controllers'); 
const { adminRequired, userRequired, tokenRequired, checkRouteUsed } = require('../middlewares/auth.middleware');
const shared = require ("../shared");
const { accountType, validateRequestData } = require('../shared/middleware/data_validator.middleware');
const { CONSTANTS } = require('../config');
const adminModule = require("../../src/api/admin")
const authRoute = express.Router();
 
authRoute.post('/register', tokenRequired, accountType(CONSTANTS.ACCOUNT_TYPE_OBJ.business, CONSTANTS.ACCOUNT_ROLE_OBJ.admin),validateRequestData("ZAccountSchema"), shared.Controllers.AccController.registerUser);
authRoute.post('/register_user', tokenRequired, accountType(),validateRequestData("ZAccountSchema"), shared.Controllers.AccController.registerMobileUser);
authRoute.post('/create', tokenRequired, Controller.AccountController.registerAdmin);
authRoute.post('/login',validateRequestData("ZLoginSchema"), shared.Controllers.AuthController.login);
authRoute.post('/verify-2fa', tokenRequired , checkRouteUsed, shared.Controllers.AuthController.m2FA_login);
// authRoute.post('/default', accountType(CONSTANTS.ACCOUNT_TYPE_OBJ.admin, CONSTANTS.ACCOUNT_ROLE_OBJ.super), adminModule.accountCtrl.defaultAdminAccount);
authRoute.post('/logout', userRequired, checkRouteUsed, shared.Controllers.AuthController.logout);
authRoute.post('/refreshtoken', shared.Controllers.AuthController.handleRefreshToken);
authRoute.post('/logout/all', shared.Controllers.AuthController.logoutAll);
authRoute.patch('/reset-password', userRequired, checkRouteUsed, shared.Controllers.AuthController.resetLogin);
authRoute.delete('/account', userRequired, checkRouteUsed, shared.Controllers.AccController.deleteAccount);

authRoute.post('/check', userRequired, shared.Controllers.AuthController.checkUser);
authRoute.post('/confirm_password', userRequired, shared.Controllers.AuthController.confirmPassword);
authRoute.post('/email-otp', shared.Controllers.TempController.createTemporalAccount);
authRoute.post('/renew-otp',tokenRequired, shared.Controllers.TempController.renewOTP);
authRoute.post('/verify-otp',tokenRequired, shared.Controllers.TempController.verifyOTP);
authRoute.post("/user/profile", userRequired, Controller.AccountController.profileUpdate);

module.exports = {
  authRoute,
};
