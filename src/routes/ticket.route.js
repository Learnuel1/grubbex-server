const { CONSTANTS } = require("../config");
const { adminRequired } = require("../middlewares/auth.middleware");
const shared = require("../shared");
const { notAllowedAccount, validateRequestData } = require("../shared/middleware/data_validator.middleware");

const TicketRouter = require("express").Router();

TicketRouter.post("/", notAllowedAccount(CONSTANTS.ACCOUNT_TYPE_OBJ.admin), validateRequestData("ZTicketSchema"), shared.Controllers.TicketController.openNewTicket).get("/", shared.Controllers.TicketController.getTicketsByUser).get("/all", adminRequired, shared.Controllers.TicketController.getTickets).put("/update", adminRequired, shared.Controllers.TicketController.updateUserTicket).patch("/close", shared.Controllers.TicketController.closeOpenedTicket).post("/chat", validateRequestData("ZTicketChatSchema"), shared.Controllers.TicketController.newChat).patch("/chat/read", shared.Controllers.TicketController.readChats)

module.exports = {
    TicketRouter,
}