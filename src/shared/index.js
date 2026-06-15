 
const service = require("./services/interface");
const dataValidator = require("./middleware/data_validator.middleware");

const TempController = require("./controller/temporal.controller");
const AccController = require("./controller/account.controller");
const AuthController = require("./controller/auth.controller")
const KYCController = require("./controller/kyc.controller")
const SubscriptionCon = require("./controller/subscription.controller");
const EmailController = require("./controller/email.controller");
const NotifyController = require("../shared/controller/notification.controller");
const ChatController = require("./controller/chat.controller"); 
const TicketController = require("./controller/ticket.controller")
const LikeRatingController = require("./controller/likes.rating.controller");
const PromotionController = require("../controllers/promotion.controller")
const ShippingAddressCtrl = require("./controller/shipping.address.controller");
const ProductModule = require("../api/store");
const OrderController = require("./controller/order.controller");
const WalletController = require("./controller/wallet.controller");
const PayoutController = require("./controller/payout.controller")
const LocationController = require("./controller/location.controller")
const buildRes = require("./utils/seedData")
module.exports =  {
  Controllers: {
    TempController,
    AccController,
    AuthController,
    KYCController,
    SubscriptionController:SubscriptionCon,
    EmailController,
    NotifyController,
    ChatController, 
    TicketController,
    LikeRatingController,
    PromotionController,
    ShippingAddressCtrl,
    OrderController,
    WalletController,
    PayoutController,
    LocationController
  },
  Modules: {
    ProductModule,
  }, 
  service,
  dataValidator,
  buildRes
};
