const { SettingController } = require("../controllers");
const { adminRequired, checkRouteUsed } = require("../middlewares/auth.middleware");

const SettingRouter = require("express")();
const routes = require("express")();

routes.put("/notification",  SettingController.updateNotification).put("/user-management", SettingController.userManagement).get("/user-management", SettingController.getUserManagementSetting).put("/email-templates", SettingController.updateEmailTemplate).get("/email-templates", SettingController.getEmailTemplates).put("/payout-duration", SettingController.updatePayoutDuration).get("/payout-duration", SettingController.getPayoutDuration).get("/notification", SettingController.getNotificationSetting);

SettingRouter.use("/", adminRequired, checkRouteUsed, routes)
module.exports = {
    SettingRouter,
}