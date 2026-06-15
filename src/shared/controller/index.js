const TempController = require("./temporal.controller");
const AccController = require("./account.controller");
const AuthController = require("./auth.controller")
const KYCController = require("./kyc.controller")
const SubscriptionCon = require("./subscription.controller");
const EmailController = require("./email.controller");
const ChatController = require("./chat.controller");
const TicketController = require("./ticket.controller");
const FAQController = require("./faq.controller");
const LikeRatingController = require("./likes.rating.controller");
const ShippingAddressCtrl = require("./shipping.address.controller");
const WalletController = require("./wallet.controller");
const PayoutController = require("./payout.controller")
const LocationController = require("./location.controller")
module.exports = {
  TempController,
  AccController,
  AuthController,
  KYCController,
  SubscriptionCon, 
  EmailController,
  ChatController,
  TicketController,
  FAQController,
  LikeRatingController,
  ShippingAddressCtrl,
  WalletController,
  PayoutController,
  LocationController,
}
