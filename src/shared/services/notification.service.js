const NotificationModel = require("../../models/notification.model");
const { shortIdGen } = require("../utils/Generator");

exports.create = async (info) =>{
  try {
    if(!info.id) info.id =shortIdGen(); 
      return await NotificationModel.create({...info});
  } catch (error) {
    return {error};
  }
};
exports.notifications = async (account) => {
  try {
    return await NotificationModel.find({account}).select("-__v -account -_id");
  } catch (error) {
    return {error};
  }
}
exports.NotificationByStatus = async (account, query) => {
  try{
    return await NotificationModel.find({account, ...query}).select("-__v -account  -_id");
  }catch(error) {
    return {error};
  }
}
exports.searchNotification = async (search) => {
  try{
    return await NotificationModel.find(search).select("-__v -account -_id");
  }catch(error){
    return {error};
  }
}
exports.viewNotification = async (id, viewed = true) => {
  try {
      return await NotificationModel.findOneAndUpdate({id}, {viewed, viewedAt: Date.now()})
  } catch (error) {
    return {error};
  }
}
exports.markAllAsRead = async (account, viewed = true) => {
  try {
    const find = await NotificationModel.findOne({account, viewed: false});
       if(!find) return {error: "Notification not found"};
       if(find.account.toString() !== account.toString()) return {error: "You are not authorized to read this notification"};
      return await NotificationModel.updateMany({account, viewed: false}, {viewed, viewedAt: Date.now()})
  } catch (error) {
    return {error};
  }
}
exports.remove = async (notificationId, account) => {
  try {
       const find = await NotificationModel.findOne({id: notificationId});
       if(!find) return {error: "Notification not found"};
       if(find.account.toString() !== account.toString()) return {error: "You are not authorized to delete this notification"};
    return await NotificationModel.findOneAndDelete({id: notificationId, account});
  } catch (error) {
    return {error};
  }
}