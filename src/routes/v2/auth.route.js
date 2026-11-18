const { CONSTANTS } = require("../../config");
const { tokenRequired, checkRouteUsed, userRequired } = require("../../middlewares/auth.middleware");
const Controller = require("../../controllers");
const shared = require("../../shared");
const { accountType, validateRequestData } = require("../../shared/middleware/data_validator.middleware");

const authRoute = require("express")();

authRoute.post('/register', tokenRequired, accountType(CONSTANTS.ACCOUNT_TYPE_OBJ.business, CONSTANTS.ACCOUNT_ROLE_OBJ.admin),validateRequestData("ZAccountSchema"), shared.Controllers.AccController.registerUser);
authRoute.post('/register_user', tokenRequired, accountType(),validateRequestData("ZAccountSchema"), shared.Controllers.AccController.registerMobileUser);
authRoute.post('/create', tokenRequired, Controller.AccountController.registerAdminV2);
authRoute.post('/login',validateRequestData("ZLoginSchemaV2"), shared.Controllers.AuthController.login);
authRoute.post('/verify-2fa', tokenRequired , checkRouteUsed, shared.Controllers.AuthController.m2FA_login); 
authRoute.post('/logout', userRequired, checkRouteUsed, shared.Controllers.AuthController.logout);
authRoute.post('/refreshtoken', shared.Controllers.AuthController.handleRefreshToken);
authRoute.post('/logout/all', shared.Controllers.AuthController.logoutAllV2);
authRoute.patch('/reset-password', userRequired, checkRouteUsed, shared.Controllers.AuthController.resetLogin);
authRoute.delete('/account', userRequired, checkRouteUsed, shared.Controllers.AccController.deleteAccount);

authRoute.post('/check', userRequired, shared.Controllers.AuthController.checkUser);
authRoute.post('/confirm_password', userRequired, shared.Controllers.AuthController.confirmPassword);
authRoute.post('/email-otp', shared.Controllers.TempController.createTemporalAccountV2);
authRoute.post('/renew-otp',tokenRequired, shared.Controllers.TempController.renewOTPV2);
authRoute.post('/verify-otp',tokenRequired, shared.Controllers.TempController.verifyOTP);
authRoute.post("/user/profile", userRequired, Controller.AccountController.profileUpdate);

module.exports = {
    authRoute,
};