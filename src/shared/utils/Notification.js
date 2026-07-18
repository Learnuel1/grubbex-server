const { CONSTANTS } = require("../../config");
const config = require("../../config/env");
const logger = require("../../logger");
const { META } = require("../../utils/actions");
const { createUserNotification, adminAccounts, userExistByMail } = require("../services/interface");
const { shortIdGen } = require("./Generator");
const {EventEmitter} = require("events"); 
const { getNotificationSetting, emailTemplateSetting } = require("../../services");
const { sendEMailHandler, DeleteAccountMailHandler } = require("./interface");
const { OrderConfirmationMailer } = require("./email/google.mail");

class Notification extends EventEmitter {
  constructor() {
    super(); 
    this.on("notify", async(payload) => {
      try {
       const category = payload?.category ? CONSTANTS.NOTIFICATION_TYPE_OBJ.activities: payload.category;
      if (Array.from(Object.values(CONSTANTS.NOTIFICATION_TYPE_OBJ)).includes(category) === false)
        throw new Error("Invalid notification category");

      const notification = {
        category ,
        id: shortIdGen(10),
        account:payload.account,
        title:payload.title, 
        info:payload.info,
        userId:payload.userId,
      };

      const sendNotification = await createUserNotification(notification);
      if (sendNotification.error) throw new Error(sendNotification.error);
      logger.info("Notification sent successfully", { service: META.NOTIFY });
    } catch (error) {
      logger.error("Failed to send notification", { service: META.NOTIFY, error: error.message });
    }
    })

    this.on("systemLoaded", async() => {
      try {

        let admin = await userExistByMail(config.ADMIN_MAIL);
        const notification = {
          category : CONSTANTS.NOTIFICATION_TYPE_OBJ.system,
          id: shortIdGen(10),
          account:admin._id,
          title:"System Loaded",
          category:CONSTANTS.NOTIFICATION_TYPE_OBJ.system,
          info:"The system has loaded successfully",
          userId:admin.userId,
        };
        const sendNotification = await createUserNotification(notification);
        if (sendNotification?.error) throw new Error(sendNotification.error);
        logger.info("System up notification sent successfully", { service: META.NOTIFY });
        this.emit("systemNotify", {type: CONSTANTS.NOTIFICATION_TYPE_OBJ.system})
      } catch (error) {
        logger.error( error.message, { service: META.NOTIFY});
      }
    })

    this.on("systemNotify", async(event) => {
      try {
        let subject, message, attach = [];
        const email = config.MAIL_USER;
        switch(event.type){
          case CONSTANTS.SETTING_FIELDS_OBJ.NOTIFICATION.onNewOrder:
              subject = "New Order Received";
              message = "New Order has be placed and is awaiting processing.";
            break;
          case CONSTANTS.SETTING_FIELDS_OBJ.NOTIFICATION.onOrderRequest:
              subject = "Order Request Received";
              message = "New order request received.";
            break;
          case CONSTANTS.SETTING_FIELDS_OBJ.NOTIFICATION.onOrderUpdate:
              subject = "Order Update";
              message = "An order has been updated.";
            break;
          case CONSTANTS.SETTING_FIELDS_OBJ.NOTIFICATION.onCriticalSystemError:
              subject = "System Failure Alert";
              message = "Grubbex server has encountered a critical failure. Immediate attention is required.";
            break;
            case CONSTANTS.SETTING_FIELDS_OBJ.NOTIFICATION.onNewUserRegistration:
              subject = "New User Registration";
              message = "A new user has registered.";
            break;
            case CONSTANTS.NOTIFICATION_TYPE_OBJ.system:
              subject = "System Notification";
              message = "Grubbex server is up and running";
        } 
        // get notification setting
        const notificationSetting = await getNotificationSetting()
        const setting = notificationSetting.find(x => x.name === event.type); 
        if(setting && setting?.type === CONSTANTS.NOTIFICATION_CHANNELS.email){
          // send email
           const result = await sendEMailHandler(
              email,
             subject, 
              message
            );
         if (result.error) return logger.error('Email failed to send, try again.', { service: META.MAIL});
            logger.info('Email sent successfully', { service: META.MAIL});
            
        } else if (setting && setting?.type === CONSTANTS.NOTIFICATION_CHANNELS.push){
           let admin = await userExistByMail(config.ADMIN_MAIL);
        const notification = {
          category : CONSTANTS.NOTIFICATION_TYPE_OBJ.system,
          id: shortIdGen(10),
          account:admin._id,
          title:"System Loaded",
          category:CONSTANTS.NOTIFICATION_TYPE_OBJ.system,
          info:"The system has loaded successfully",
          userId:admin.userId,
        };
        const sendNotification = await createUserNotification(notification);
        if (sendNotification?.error) throw new Error(sendNotification.error);
        logger.info("System up notification sent successfully", { service: META.NOTIFY });
        } 
        else if (setting && setting?.type === CONSTANTS.NOTIFICATION_CHANNELS.sms){
         return logger.error("SMS notification is not implemented", { service: META.NOTIFY});

        }else if(event.type === CONSTANTS.NOTIFICATION_TYPE_OBJ.system){
            const result = await sendEMailHandler(
              email,
             subject, 
              message
            );
         if (result.error) return logger.error('Email notification failed to send, try again.', { service: META.MAIL});
            logger.info('Email sent successfully', { service: META.MAIL});
        }
       
      } catch (error) {
        logger.error( error.message, { service: META.NOTIFY});
      }
    })
  this.on("emailer", async(payload) => {
      try {
        const {to, subject, name, event} = payload;
        const temp = await emailTemplateSetting({name: event}); 
          if(!temp || temp.length === 0) return logger.info(`Email template for event '${event}' not found.`, { service: META.MAIL});
           let message = temp.template
           message = message.replace("{CustomerName}", name);
            const send = await sendEMailHandler(
              to,
              subject,
              message
            );
            if (send.error) return logger.error(`'${event} Email notification failed to send, try again.'`, { service: META.MAIL});
            logger.info(`'${event} Email sent successfully'`, { service: META.MAIL});

  } catch (error) {
      logger.error( error.message, { service: META.MAIL});
  }
    })
    this.on("deleteAccount", async(payload) => {
      try {
        const {email, event, ...data} = payload; 
            const send = await DeleteAccountMailHandler(
              email, 
              data
            );
            if (send.error) return logger.error(`'${event} Email notification failed to send, try again.'`, { service: META.MAIL});
            logger.info(`'${event} Email sent successfully'`, { service: META.MAIL});

  } catch (error) {
      logger.error( error.message, { service: META.MAIL});
  }
    })
    this.on("orderPayment", async(payload) => {
      try {
        const {email, event, customerName, ...data} = payload;
        data.order.customerName = customerName;
            const send = await OrderConfirmationMailer(
              email, 
              data.order
            );
            if (send?.error) return logger.error(`'${event} Email notification failed to send, try again.'`, { service: META.MAIL});
            logger.info(`'${event} Email sent successfully'`, { service: META.MAIL});

  } catch (error) {
      logger.error( error.message, { service: META.MAIL});
  }
    })
  }
  
}

module.exports = Notification;