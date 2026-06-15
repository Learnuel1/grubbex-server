const express = require("express");
const SubscriptionRoute = express.Router();
const shared = require("../shared");
const { validateRequestData } = require("../shared/middleware/data_validator.middleware");
const { Authentication } = require("../middlewares");

SubscriptionRoute.post("/", validateRequestData("ZSubscription"), shared.Controllers.SubscriptionController.subscription ).post("/wait_list", validateRequestData("ZSubscription"), shared.Controllers.SubscriptionController.waiting).put("/unsubscribe", validateRequestData("ZSubscription"), shared.Controllers.SubscriptionController.unSubscription).get("/", Authentication.userRequired,  Authentication.adminRequired,shared.Controllers.SubscriptionController.searchSubs).get("/wait_list", Authentication.userRequired, Authentication.adminRequired,shared.Controllers.SubscriptionController.searchWaitingList).get("/unsubscribed", Authentication.userRequired,  Authentication.adminRequired, shared.Controllers.SubscriptionController.searchUnSubscribed)
module.exports = {
  SubscriptionRoute,
}
