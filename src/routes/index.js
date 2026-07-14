const express = require("express");
const Router = express.Router();
const MobileRouter = express.Router();
const AuthModule = require("./auth.route");
const UserModule = require("./user.route"); 
const ItemModule = require("./item.route"); 
const PaymentModule = require("./payment.route");
const KYCModule = require("./business.kyc.route");
const BusinessModule = require("./business.route");
const StoreModule = require("./store.category.route");
const SubscriptionModule = require("./subscription.route");
const AdminModule = require("./admin.route");  
const ChatModule = require("./chat.route");
const RiderModule = require("./rider.route");
const { FAQController } = require("../shared/controller");
const { LikeRatingRouter } = require("./like.rating.route");
const { AdvertRoute } = require("./promotion.route");
const OrderModule = require("./order.route");
const { TransactionRouter } = require("./transaction.route");
const Location = require("./location.route");
const PayoutModule = require("./payout.route"); 
const { ReturnedOrderRouter } = require("./return.order.router");

Router.use("/user", UserModule.userRoute);
Router.use("/auth", AuthModule.authRoute); 
Router.use("/item", ItemModule.itemRoute); 
Router.use("/payment", PaymentModule.paymentRoute); 
Router.use("/business", BusinessModule.BusinessRoute);
Router.use("/admin", AdminModule.AdminRoutes);
Router.use("/subscribe", SubscriptionModule.SubscriptionRoute);
Router.use("/chat", ChatModule.chatRoute);
Router.get("/faq", FAQController.getFAQs);
Router.use("/order", OrderModule.OrderRouter);
Router.use("/transaction", TransactionRouter);
Router.use("/location", Location.LocationRouter);
Router.use("/payout", PayoutModule.PayoutRouter);
Router.use("/return", ReturnedOrderRouter)


MobileRouter.use("/user", UserModule.userRoute);
MobileRouter.use("/auth", AuthModule.authRoute); 
MobileRouter.use("/item", ItemModule.itemRoute); 
MobileRouter.use("/payment", PaymentModule.paymentRoute)
MobileRouter.use("/rider", RiderModule.RiderRoute);
MobileRouter.use("/business", BusinessModule.BusinessRoute)
MobileRouter.use("/store", StoreModule.StoreCategoryRoute);
MobileRouter.use("/subscribe", SubscriptionModule.SubscriptionRoute);
MobileRouter.use("/chat", ChatModule.chatRoute);
MobileRouter.get("/faq", FAQController.getFAQs);
MobileRouter.use("/endorse", LikeRatingRouter);
MobileRouter.use("/promotion", AdvertRoute);
MobileRouter.use("/order", OrderModule.OrderRouter);
MobileRouter.use("/transaction", TransactionRouter);
MobileRouter.use("/location", Location.LocationRouter);
MobileRouter.use("/payout", PayoutModule.PayoutRouter);
MobileRouter.use("/return", ReturnedOrderRouter)
module.exports = {
  Router,
  MobileRouter,
};
