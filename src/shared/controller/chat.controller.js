const { CONSTANTS } = require("../../config");
const logger = require("../../logger");
const { sendChat, getSentAndReceivedChats,getNewChats, updateReceivedChat, deleteSentChat } = require("../services/interface");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");

exports.sendChatToReceiver = async (req, res, next) => {
    try{ 
        const send = await sendChat({...req.body});
        if(!send) return next(APIError.badRequest("Message failed to send, try again"));
        if(send?.error) return next(APIError.badRequest(send.error));
        logger.info("Chat sent successfully", {service: META.CHAT})
        res.status(200).json({success: true, msg: "Chat sent successfully"});
    } catch (error) {
        next(error)
    }
}
exports.getSentAndReceivedChats = async (req, res, next) => {
    try{
        const chats = await getSentAndReceivedChats(req.user);
        if(!chats) return next(APIError.notFound("Chat does not exist"));
        if(chats?.error) return next(APIError.badRequest(chats.error));
        logger.info("Chat messages list successfully", {service: META.CHAT})
        res.status(200).json({success: true, msg: "Chats retrieved successfully", data: chats})
    } catch (error) {
        next(error)
    }
}
exports.getNewReceivedChats = async (req, res, next) => {
    try{
        const newChats = await getNewChats(req.user);
        if(!newChats) return next(APIError.notFound("Chat does not exist"));
        if(newChats?.error) return next(APIError.badRequest(newChats.error));
        logger.info("New Chats retrieved successfully", {service: META.CHAT});
        res.status(200).json({success: true, msg: "Chats retrieved successfully", data: newChats, count: newChats.length})
    } catch (error) {
        next (error);
    }
}
exports.updateReceivedChatStatus = async (req, res, next) => {
     try{
        const {id} = req.body;
        if(!id) return next(APIError.badRequest("Chat ID is required"))
        const info = {
            receiver: req.user, 
            id,
            status: CONSTANTS.CHAT_STATUS_OBJ.sent,
            update: {
                status: CONSTANTS.CHAT_STATUS_OBJ.delivered,
                receiverStatus: CONSTANTS.CHAT_STATUS_OBJ.read,
                senderStatus: CONSTANTS.CHAT_STATUS_OBJ.delivered
            },
        };
        const readChat = await updateReceivedChat(info);
        if(!readChat) return next(APIError.badRequest("An Error occurred updating chat status, try again"));
        if(readChat?.error) return next(APIError.badRequest(readChat.error));
        logger.info("Chat status updated successfully" , {service: META.CHAT});
        res.status(200).json({success: true, msg: "Chat status updated successfully"});
     } catch (error) {
        next(error);
     }
}
exports.deleteSentUserChat = async (req, res, next) => {
    try{
        const { id } = req.query;
        if (!id) return next(APIError.badRequest("Chat ID is required"));
        const remove = await deleteSentChat(req.user, id);
        if(remove?.error) return next(APIError.badRequest(remove.error));
        logger.info("Chat deleted successfully", {service: META.CHAT});
        res.status(200).json({success: true, msg: "Chat deleted successfully"});
    } catch (error) {
        next (error);
    }
}