const shared = require("../shared/index");
const { userRequired } = require("../middlewares/auth.middleware");
const { validateRequestData } = require("../shared/middleware/data_validator.middleware");

const chatRouter = require("express").Router();
const chatRoute = require("express").Router();
chatRouter.post("/send", validateRequestData("ZChatSchema"), shared.Controllers.ChatController.sendChatToReceiver).get("/users",shared.Controllers.AccController.getAccountsForChat).get("/all", shared.Controllers.ChatController.getSentAndReceivedChats).get("/new", shared.Controllers.ChatController.getNewReceivedChats).put("/viewed", shared.Controllers.ChatController.updateReceivedChatStatus).delete("/", shared.Controllers.ChatController.deleteSentUserChat)


chatRoute.use("/", userRequired, chatRouter);
module.exports = {
    chatRoute,
}