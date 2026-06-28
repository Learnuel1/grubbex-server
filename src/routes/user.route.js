const express = require('express');
const { userRequired, tokenRequired, checkRouteUsed } = require('../middlewares/auth.middleware');
const shared  = require('../shared');
const Controller = require("../controllers");
const { notifyRouter } = require('./notification.route');
const { validateRequestData, allowedRoles } = require('../shared/middleware/data_validator.middleware');
const userStoreRouter = require('./user.store.route');
const { TicketRouter } = require('./ticket.route');
const { CONSTANTS } = require('../config');
const { multerImage } = require('../shared/utils/multer');
const userRoute = express.Router();

userRoute.get("/forgot-password", shared.Controllers.AccController.forgotPassword);
userRoute.post('/recovery_mail', shared.Controllers.AccController.sendRecoverMail);
userRoute.get('/verify_reset', shared.Controllers.AccController.verifyPasswordReset);
userRoute.patch('/reset_password', tokenRequired,  shared.Controllers.AccController.resetPassword); 
userRoute.get('/verify_invite', Controller.InvitationCtrl.verifyInvitation); 
userRoute.patch("/update", userRequired, allowedRoles([CONSTANTS.ACCOUNT_TYPE_OBJ.shopper]), multerImage.single("image"), shared.dataValidator.validateRequestData("ZShopperUpdateSchema"), shared.Controllers.AccController.updateUser); 
userRoute.get("/profile", userRequired, shared.Controllers.AccController.userProfile);
userRoute.patch("/update-2fa", userRequired, shared.Controllers.AccController.update_2FA_status);
userRoute.get("/country_states", shared.Controllers.AccController.countryStates)
userRoute.get("/country_states/lga", shared.Controllers.AccController.countryStatesLGA)
userRoute.get("/country_city", shared.Controllers.AccController.countryCity)
userRoute.get("/country_city/town", shared.Controllers.AccController.countryStatesCityTown)
userRoute.post("/category_preference", userRequired, validateRequestData("ZCategoryPreferenceSchema"), Controller.PreferenceCtrl.createPrefCategory);
userRoute.get("/category_preference", userRequired,   Controller.PreferenceCtrl.getUserPreference);
userRoute.use("/notification", userRequired, notifyRouter)
userRoute.use("/store", userRequired, userStoreRouter)
userRoute.use("/ticket", userRequired, TicketRouter)
userRoute.patch("/update_password", userRequired, checkRouteUsed, shared.Controllers.AccController.updatePassword); 
// userRoute.patch("/update", userRequired, checkRouteUsed, allowedRoles([CONSTANTS.ACCOUNT_TYPE_OBJ.shopper]), shared.Controllers.AccController.updateUser); 
module.exports = {
  userRoute,
  notifyRouter,
};
