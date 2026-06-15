const AccountController = require("./account.controller")
const InvitationCtrl = require("../api/admin/controller/invitation.controller")
const AuthController = require("./auth.controller"); 
const ItemController = require("./item.controller");
const BookController = require("./booking.controller")
const PaymentController = require("./payment.controller");
const SharedController = require("../shared/controller")
const PreferenceCtrl = require("./preference.controller");
const SettingController = require("./setting.controller");
// const KYCController = require("./kyc.controller");
module.exports = {
  AccountController,
  AuthController, 
  ItemController,
  BookController,
  PaymentController,
  SharedController,
  InvitationCtrl,
  PreferenceCtrl,
  SettingController,
};