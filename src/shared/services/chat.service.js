const { CONSTANTS } = require("../../config")
const ChatModel = require("../../models/chat.model")

exports.send = async (info) => {
    try{
        return await ChatModel.create({...info})
    } catch(error) {
        return {error: error.message}
    }
}
exports.chatsByReceiver = async (receiver, sender) => {
    try {
        return await ChatModel.find({receiver, sender}).sort({createdAt: -1});
    } catch (error) {
        return {error: error.message};
    }
}
exports.sentAndReceivedChats = async (receiver) => {
    try{
        return await ChatModel.find({$or: [{receiver}, {sender: receiver}]}).sort({createdAt:-1}).populate([
            {
                model:"Account",
                path: "sender",
                select: "firstName lastName picture.url -_id",
            }
        ]).select("-_id -__v -sender -receiver");
    } catch (error) {
        return {error: error.message}
    }
}
exports.newChats = async (receiver) => {
    try{
        return await ChatModel.find({receiver, status: CONSTANTS.CHAT_STATUS_OBJ.sent}).select("-_id -__v -sender -receiver").exec();
    } catch (error) {
        return {error: error.message}
    }
}
exports.updateChatStatus = async (info) => {
    try{
        const fine = await ChatModel.findOneAndUpdate({receiver:info.receiver, status: info.status, id: info.id}, {...info.update}, {returnOriginal: false});
        return fine;
    } catch (error) {
        return {error: error.message };
    }
}
exports.deleteChat = async (sender, id) => {
    try{
        const remove = await ChatModel.findOneAndDelete({sender, id});
        if(!remove) return {error: "Chat not found"};
    } catch (error) {
        return {error: error.message };
    }
}