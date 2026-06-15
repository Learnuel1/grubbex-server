const TicketModel = require("../../models/ticket.model");
const { CONSTANTS } = require("../../config");
const AccountModel = require("../../models/account.model");

exports.open = async (details) => {
    try{
        return await TicketModel.create({...details});
    }  catch(error){
        return { error: error.message};
    }
}
exports.getTickets = async (query, user) => {
    try{
        return await TicketModel.find({...query}).populate([{
            model: "Account",
            path: "sender",
            select: "lastName firstName type picture.url -_id",
        }, {
            model: "Account",
            path: "closedBy",
            select: "firstName lastName type picture.url -_id",
        }]).select(`-_id -__v ${user !== CONSTANTS.ACCOUNT_TYPE_OBJ.admin ? "-viewed" : "" }`).sort({createdAt: 1, priority: 1});
    } catch (error) {
        return {error: error.message };
    }
}
exports.close = async (id, userinfo) => {
    try{
        const findTicket = await TicketModel.findOne({id});
        if(!findTicket) return {error: "Ticket does not exist or is "};
        if(findTicket.status === CONSTANTS.TICKET_STATUS_OBJ.closed) return {error: "Ticket is already closed"};
        if(userinfo.user.toString() === findTicket.sender.toString()) {
            findTicket.status = CONSTANTS.TICKET_STATUS_OBJ.closed;
            findTicket.closedBy = userinfo.user;
            return findTicket.save();
        }else if(userinfo.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.admin){
            findTicket.status = CONSTANTS.TICKET_STATUS_OBJ.closed;
            findTicket.closedBy = userinfo.user;
            return findTicket.save();
        }
    } catch (error ) {
        return {error: error.message};
    }
}
exports.update = async (id, details) => {
    try{
        return await TicketModel.findOneAndUpdate({id}, {...details});
    } catch (error) {
        return {error: error.message };
    }
}
exports.createChat = async (id, info) => {
    try{
    const existing = await TicketModel.findOne({id});
    if(!existing) return {error: "Ticket does not exist"};
    const sender = await AccountModel.findById(info.details.sender).select("firstName lastName type userId -_id");
    if(!sender) return {error: "Sender does not exist"};
    info.details.sender = {...sender};
    existing.chat.unshift(info.details);
     return existing.save();
    } catch (error) {
        return {error: error.message };
    }
}
exports.read = async (ticketId, chatId, userId) => {
    try{
        const regExp = new RegExp(chatId.join('|'),'i');
        const query = {
                id: ticketId,
                view:false,
                "chat.id": {$in: regExp}
        }
        // get all the chat
        const tickets = await TicketModel.findOne(query);
        if(!tickets) return {error: "No ticket found"}
        const chatsToRead = [];
         tickets.chat.forEach((item) =>{
            if(chatId.includes(item.id) && item.sender.userId !== userId && item.viewed === false) {
               item.viewed = true;
                chatsToRead.push(item);
                chatId.splice(chatId.indexOf(item.id),1);
            }
         })
         const result = tickets.chat.map(item => {
            const replacement = chatsToRead.find(replacementItem => replacementItem.id === item.id);
            return replacement ? replacement : item;
          });
          tickets.chat = result;
         return tickets.save();
    } catch (error) {
        return {error: error.message };
    }
}