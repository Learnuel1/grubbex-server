const logger = require("../../logger");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");
const {getUserNotifications,createUserNotification, markAllAsRead, removeNotification, getUserNotificationByStatus } = require("../services/interface")
const buildRes = require("../utils/seedData");
const { viewNotification } = require("../services/notification.service");
const { CONSTANTS } = require("../../config");
exports.getNotification = async (req, res, next) => {
  try {
    const {status, category} = req.query;
    let query ={}
 
    if(status && status.toLowerCase() === "unread"){
      query = {  viewed: false}
    } else if(status && status.toLowerCase() === "read"){
      query = { viewed: true}
    }
    if(category) {
      query.category = category.charAt(0).toUpperCase() + category.slice(1);
      if(!Array.from(Object.values(CONSTANTS.NOTIFICATION_TYPE_OBJ)).includes(query.category)) return next(APIError.badRequest("Invalid notification category")); 
      query.account = req.user;
    }
    let notifications = await getUserNotificationByStatus(req.user, query)
    if(!notifications || notifications.length === 0) return res.status(200).json({notifications});
      const response = buildRes.reqResponse("Found", notifications, "notification");
      res.status(200).json(response)
  } catch (error) {
    next(error);
  }
}

exports.createNotification = async (req, res, next) => {
  try{
    const notify = await createUserNotification(req.body);
    if(notify?.error) return next(APIError.badRequest(notify.error));
    logger.info("Notification created successfully", {service: META.NOTIFY});
    // send email
    
    res.status(200).json({msg: "Notification created successfully"});
  } catch (error) {
    next(error)
  }
}
exports.markAsRead = async (req, res, next) => {
  try{
      const {id} = req.query; 
      if(!id) return next(APIError.badRequest("Notification ID is required"));
    const view = await viewNotification(id, true);
     if(view?.error) return next(APIError.badRequest(view.error));
    logger.info("Notification read successfully", {service: META.NOTIFY});
    res.status(200).json({msg: "Notification read successfully"});
  } catch (error) {
    next(error)
  }
}
exports.delete = async (req, res, next) => {
  try{
    const  {id } = req.query;
    if(!id) return next(APIError.badRequest("Notification ID is required"));
    const remove = await removeNotification(id, req.user);
     if(remove?.error) return next(APIError.badRequest(remove.error));
    logger.info("Notification removed successfully", {service: META.NOTIFY});
    res.status(200).json({msg: "Notification removed successfully"});

  } catch (error) {
    next(error)
  }
}

exports.markAllAsRead = async (req, res, next) => {
  try{
    const view = await markAllAsRead(req.user,true);
     if(view?.error) return next(APIError.badRequest(view.error));
    logger.info("Notification read successfully", {service: META.NOTIFY});
    res.status(200).json({msg: "Notifications marked as read successfully"});
  } catch (error) {
    next(error)
  }
}