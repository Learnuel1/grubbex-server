const { CONSTANTS } = require("../config");
const logger = require("../logger");
const { updateNotificationSetting, userManagementSetting, emailTemplateSetting, payoutDuration, getNotification } = require("../services");
const { META } = require("../shared/utils/actions");
const { APIError } = require("../shared/utils/apiError");
const Notification = require("../shared/utils/Notification");

exports.updateNotification = async (req, res, next ) => {
    try{
        const {name, type } = req.body;
        if(!name) return next(APIError.badRequest("Notification name is required"));
        if(!type) return next(APIError.badRequest("Notification means is required"));
        if(!Array.from(Object.values(CONSTANTS.SETTING_FIELDS_OBJ.NOTIFICATION)).includes(name)) return next(APIError.badRequest("Invalid notification filed"));

         const info = { name, type, createdBy:req.body.createdBy, target: CONSTANTS.SETTING_FIELDS_OBJ.TYPE.notification};

         const update = await updateNotificationSetting(info);
         if(!update) return next(APIError.badRequest("Notification setting failed, try again"))
        if (update?.error) return next(APIError.badRequest(update.error));
         logger.info("Updated NotifIcation", {service: META.SETTING})
        const notice = new Notification();
        const payload = {userId:req.userId, account:req.user, title:"Settings Update", category: CONSTANTS.NOTIFICATION_TYPE_OBJ.activities, info: "Updated notification system"}
        notice.emit("notify", payload);
         res.status(200).json({status: "Success", msg: "Updated setting successfully"});
    } catch (error) {
        next (error);
    }
}
exports.userManagement = async (req, res, next ) => {
    try {
        const {accountType,  permission} = req.body;
        if(!accountType) return next(APIError.badRequest("Account type is required"));
        if(!permission) return next(APIError.badRequest("Permission is required"));
        if(permission.length === 0) return next(APIError.badRequest("Permission is required"));
        if(!Array.from(Object.values(CONSTANTS.ADMIN.ACCOUNT_TYPE_OBJ)).includes(accountType)) return next(APIError.badRequest("Invalid account type"));
        permission.forEach((cur) => {
            if(!Array.from(Object.values(CONSTANTS.ADMIN.PERMISSION_OBJ)).includes(cur)) return next(APIError.badRequest("Invalid permission type"));
        })
        const info = {accountType,permission, createdBy:req.body.createdBy, target: CONSTANTS.SETTING_FIELDS_OBJ.TYPE.userManagement};
        const update = await updateNotificationSetting(info);
        if(!update) return next(APIError.badRequest("User management setting failed, try again"))
       if (update?.error) return next(APIError.badRequest(update.error));
        logger.info("Updated User Management Setting", {service: META.SETTING})
       const notice = new Notification();
       const payload = {userId:req.userId, account:req.user, title:"Admin Role Settings Update", category: CONSTANTS.NOTIFICATION_TYPE_OBJ.activities, info: "Updated user management setting"}
       notice.emit("notify", payload);
        res.status(200).json({status: "Success", msg: "Updated admin accounts privilege successfully"});

    } catch (error) {
        next(error);
    }
}
exports.getUserManagementSetting = async (req, res, next) => {
    try {
        const setting = await userManagementSetting();
        res.status(200).json({status: "Success", data: setting});
    } catch (error) {
        next(error);
    }
}

exports.updateEmailTemplate = async (req, res, next) => {
    try {
        const {name, template} = req.body;
        if(!name) return next(APIError.badRequest("Email template name is required"));
        if(!template) return next(APIError.badRequest("Email template content is required"));
        if(!Array.from(Object.values(CONSTANTS.EMAIL_TEMPLATES_OBJ)).includes(name)) return next(APIError.badRequest("Invalid email template filed"));
        const info = {name, template, createdBy:req.body.createdBy, target: CONSTANTS.SETTING_FIELDS_OBJ.TYPE.emailTemplates};
        const update = await updateNotificationSetting(info);
        if(!update) return next(APIError.badRequest("Email template setting failed, try again"));
         if (update?.error) return next(APIError.badRequest(update.error));
        logger.info("Updated Email Template", {service: META.SETTING})
       const notice = new Notification();
       const payload = {userId:req.userId, account:req.user, title:"Settings Update", category: CONSTANTS.NOTIFICATION_TYPE_OBJ.activities, info: "Updated email template setting"}
       notice.emit("notify", payload);
        res.status(200).json({status: "Success", msg: "Updated email template setting successfully"});
    } catch (error) {
        next(error);
    }
}
exports.getEmailTemplates = async (req, res, next) => {
    try {
        const { name} = req.query;
        const query = name ? {name} : {};
        const templates = await emailTemplateSetting(query);
        if(!templates) return next(APIError.badRequest("Failed to retrieve template"));
        if(templates?.error) return next(APIError.badRequest(templates.error));
        logger.info("Retrieved email templated successfully", {service: META.SETTING})
        res.status(200).json({status: "success", msg: "Found", data:templates})
    } catch (error) {
        next(error)
    }
}
exports.updatePayoutDuration = async (req, res, next) => {
    try {
        const {name} = req.body;
        if(!name) return next(APIError.badRequest("Payout duration name is required"));
        if(!Array.from(Object.values(CONSTANTS.SETTING_FIELDS_OBJ.payoutDuration)).includes(name.toLowerCase())) return next(APIError.badRequest("Invalid payout duration name"));
        const info = {name, numberOfDays:CONSTANTS.PAYOUT_TYPE_OBJ[name.toLowerCase()].numberOfDays, createdBy:req.body.createdBy, target: CONSTANTS.SETTING_FIELDS_OBJ.TYPE.payoutDuration};
        const update = await updateNotificationSetting(info);
        if(!update) return next(APIError.badRequest("Payout duration setting failed, try again"));
         if (update?.error) return next(APIError.badRequest(update.error));
        logger.info("Updated payout duration setting", {service: META.SETTING})
       const notice = new Notification();
       const payload = {userId:req.userId, account:req.user, title:"Settings Update", category: CONSTANTS.NOTIFICATION_TYPE_OBJ.activities, info: "Updated payout duration setting"}
        notice.emit("notify", payload);
        res.status(200).json({status: "Success", msg: "Updated payout duration setting successfully"});
    } catch (error) {
        next(error);
    }
}
exports.getPayoutDuration = async (req, res, next) => {
    try {
        const { name} = req.query;
        const query =  {payoutDuration:CONSTANTS.SETTING_FIELDS_OBJ.TYPE.payoutDuration};
        const duration = await payoutDuration(query);
        if(!duration) return next(APIError.badRequest("Failed to retrieve payout duration setting"));
        if(duration?.error) return next(APIError.badRequest(duration.error));
        logger.info("Retrieved payout duration setting successfully", {service: META.SETTING})
        res.status(200).json({status: "success", msg: "Found", data:duration})
    } catch (error) {      
          next(error)
    }
}
exports.getNotificationSetting = async (req, res, next) => {
    try {
        const setting = await getNotification();
        res.status(200).json({status: "Success", data: setting});
    } catch (error) {
        next(error);
    }
}