const { userRequired } = require("../middlewares/auth.middleware");
const { Controllers } = require("../shared");
const { validateRequestData } = require("../shared/middleware/data_validator.middleware");

const notifyRouter = require("express").Router();
const notifyRoutes = require("express").Router();
notifyRouter.post("/", userRequired, validateRequestData("ZNotificationSchema"), Controllers.NotifyController.createNotification)
.get("/all", userRequired, Controllers.NotifyController.getNotification ).patch("/read", userRequired, Controllers.NotifyController.markAsRead).delete("/", userRequired, Controllers.NotifyController.delete).patch("/read-all", userRequired, Controllers.NotifyController.markAllAsRead)

notifyRouter.use("/", userRequired, notifyRoutes)
module.exports = {
  notifyRouter
}