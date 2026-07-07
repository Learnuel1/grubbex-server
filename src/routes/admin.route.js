const express = require("express")
const AdminRoutes = express.Router();
const StoreModule = require("./store.category.route");
const { adminRequired } = require("../middlewares/auth.middleware"); 
const InviteModule = require("./invitation.route");
const routes = express.Router();
const AccountModule = require("./account.route");
const KYCModule = require("./business.kyc.route");
const { EmailRoute } = require("./email.route");
const { TicketRouter } = require("./ticket.route");
const { FAQRouter } = require("./faq.route");
const { adminProductRoute } = require("./admin.product.route");
const {PromotionRoute} = require("./promotion.route");
const SettingsModule = require("./setting.route");
const { PayoutRouter } = require("./payout.route");
const AdminOrderRouter = require("./admin.order.route");
 
routes.use("/store", StoreModule.StoreCategoryRoute);
routes.use("/invitation", InviteModule.invitationRoute );
routes.use("/account", AccountModule.accountRoute);
routes.use("/kyc", KYCModule.KYCRoute );
routes.use("/email", EmailRoute);
routes.use("/ticket", TicketRouter)
routes.use("/faq", FAQRouter)
routes.use("/product", adminProductRoute)
routes.use("/promotion",PromotionRoute)
routes.use("/setting", SettingsModule.SettingRouter);
routes.use("/payout", PayoutRouter);
routes.use("/order", AdminOrderRouter);

AdminRoutes.use("/", adminRequired, routes);
module.exports = {
  AdminRoutes
}