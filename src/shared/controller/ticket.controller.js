const { CONSTANTS } = require("../../config");
const logger = require("../../logger");
const { createTicket, findTicket, updateTicket, closeTicket, createNewChat, readUserChat } = require("../services/interface");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");
const buildRes = require("../utils/seedData");
exports.openNewTicket = async (req, res, next) => {
    try{
         const create = await createTicket(req.body);
         if(!create) return next(APIError.badRequest("Ticket failed to create, try again"));
         if(create?.error) return next(APIError.badRequest(create.error));
         logger.info("Ticket created successfully", {service: META.TICKET});
         res.status(200).json({success: true, msg:  "Ticket created successfully"});
    } catch (error) {
        next(error);
    }
}
exports.getTickets = async (req, res, next ) => {
    try{
        const {search} = req.query;
        let query = {
            $or: [
                {title: new RegExp(search, 'i')},
                {description: new RegExp( search, 'i')},
                {status: new RegExp(search, 'i')},
                {id: new RegExp(search, 'i')},
            ], 
    }
        const tickets = await findTicket(query, req.userType);
         if(tickets?.error) return next(APIError.badRequest(tickets.error));
         logger.info("Tickets retrieved successfully", {service: META.TICKET})
        const response = buildRes.reqResponse("Found",tickets, "tickets");
        res.status(200).json(response);
    } catch (error) {
        next (error);
    }
}

exports.getTicketsByUser = async (req, res, next) => {
    try{
        const {search} = req.query;
        let query = {
            $and: [ { sender: req.user},
                {
            $or: [
                {title: new RegExp(search, 'i')},
                {description: new RegExp( search, 'i')},
                {status: new RegExp(search, 'i')},
                {id: new RegExp(search, 'i')},
            ],
        }
        ]
    }
        const tickets = await findTicket(query, req.userType);
         if(tickets?.error) return next(APIError.badRequest(tickets.error));
         logger.info("Tickets retrieved successfully", {service: META.TICKET})
        const response = buildRes.reqResponse("Found",tickets, "tickets");
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}
exports.updateUserTicket = async (req, res, next) => {
    try{
        const {id} = req.body;
        if(!id) return next(APIError.badRequest("Ticket ID is required"));
        delete req.body.id;
        const details = {};
        for (let key in req.body ) {
            details[key] = req.body[key];
        }
        delete details.createdBy;
        if(details?.status && details.status === "close") {
            details.status = details.status.concat("d");
            if(!CONSTANTS.TICKET_STATUS.includes(details.status.toLowerCase())) return next(APIError.badRequest("Invalid Ticket Status"));
        }
        if(details?.priority){
            if(!CONSTANTS.TICKET_PRIORITY.includes(details.priority)) return next(APIError.badRequest("Invalid Ticket Priority"));
        }
        if(details.viewed) details.viewed = true;
        const update = await updateTicket(id, details);
        if(!update) return next(APIError.badRequest("Ticket update failed, try again"));
        if(update?.error) return next(APIError.badRequest(update.error));
        logger.info("Ticket details updated successfully", {service: META.TICKET});
        res.status(200).json({success: true, msg: "Ticket updated successfully"});
    } catch (error) {
        next(error);
    }
}
exports.closeOpenedTicket = async (req, res, next) => {
    try{
        const {id, status} = req.body;
        if(!id) return next(APIError.badRequest("Ticket ID is required"))
        if(!status) return next(APIError.badRequest("Ticket status is required"));
        if(CONSTANTS.TICKET_STATUS.includes(status.concat("ed"))) return next(APIError.badRequest("Invalid ticket status"));
        const info = {
            user: req.user,
            userType: req.userType,
            status: status.concat("d"),
        }
        const update = await closeTicket(id, info);
        if(!update) return next(APIError.badRequest("Ticked failed to close, try again"));
        if(update?.error) return next(APIError.badRequest(update.error));
        logger.info("Ticket closed successfully", {service: META.TICKET});
        res.status(200).json({success: true, msg: "Ticked closed successfully"});
    } catch (error) {
        next (error);
    }
}
exports.newChat = async (req, res, next ) => {
    try{
        const {ticketId } = req.body;
        delete req.body.ticketId;
        delete req.body.createdBy;
        const info = {
            details: req.body, 
        }
        const create = await createNewChat(ticketId, info);
        if(!create) return next(APIError.badRequest("Chat failed to send, try again"));
        if(create?.error) return next(APIError.badRequest(create.error));
        logger.info("Chat created successfully", {service: META.TICKET});
        res.status(200).json({success: true, msg: "Chat sent successfully"});
    } catch (error) {
        next (error)
    }
}
exports.readChats = async (req, res, next ) => {
    try{
        const {ticketId, chatId} = req.body;
        if(!ticketId) return next (APIError.badRequest("Ticket ID is required"));
        if(!chatId || chatId.length === 0) return next (APIError.badRequest("Chat ID is required"));
        const {search} = req.query;
        let query = {
              sender: req.user, 
             id: new RegExp(ticketId, 'i')
        }
        if(req.userType !== CONSTANTS.ACCOUNT_TYPE_OBJ.admin){

            const tickets = await findTicket(query, req.userType);
            if(!tickets || tickets.length === 0) return next(APIError.badRequest("Ticket not found"));
            if(tickets?.error) return next(APIError.badRequest(tickets.error));
        }

        const view = await readUserChat(ticketId, chatId, req.userId);
        if(!view) return next (APIError.badRequest("Char view failed, try again"));
        if(view?.error) return next (APIError.badRequest(view.error));
        logger.info("Chat viewed successfully", {service: META.TICKET});
        res.status(200).json({success: true, msg: "chat viewed successfully"})
    } catch (error) {
        next (error);
    }
}