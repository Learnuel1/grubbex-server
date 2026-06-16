const { BrevoClient } = require("@getbrevo/brevo");
const config = require("../../../config/env");

const path = require("path")
const { domainMail, mailAuth } = require("../mail.auth");
const { CONFIG, CONSTANTS } = require("../../../config");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const { mailContentReader } = require("../../../utils/validation"); 
 
const handlebarsOptions = {
  viewEngine: {
    extName: ".handlebars",
    partialsDir: path.resolve("../src/views"),
    defaultLayout: false,
  },
  viewPath: path.resolve("../src/views"),
  extName: ".handlebars",
};
let transporter = nodemailer.createTransport(
  {
    ...mailAuth
  });

  transporter.use("compile", hbs(handlebarsOptions));


  const brevo = new BrevoClient({
     apiKey: config.BREVO_KEY, 
     timeoutInSeconds: 30,
      maxRetries: 3,
  });
exports.registrationOTPMailHandler = async (email, otp, expires, title, message, template, grubbyDept, subject ) => {
  try {
    const content = mailContentReader(template);
    return new Promise( async (resolve, reject) => {
      const brevoMail = await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: `${CONFIG.APP_NAME}`, email: `${domainMail.mail()}` },
        to: [{ email: email }],
        subject: subject,
        htmlContent: content.replace("{{otp}}", otp).replace("{{expires}}", expires).replace("{{title}}", title).replace("{{message}}", message).replace("{{grubbyDept}}", grubbyDept).replace("{{facebook}}", `${config.FACEBOOK}`).replace("{{x}}", `${config.X}`).replace("{{linkedin}}", `${config.LINKEDIN}`).replace("{{instagram}}", `${config.INSTAGRAM}`).replace("{{unsubscribe}}", `${config.FRONTEND_ORIGIN_URL}/unsubscribe?email=${email}`).replace("{{home}}", `${config.FRONTEND_ORIGIN_URL}/home`).replace("{{login}}", `${config.FRONTEND_ORIGIN_URL}/login`).replace("{{contact}}", `${config.FRONTEND_ORIGIN_URL}/contact-us`).replace("{{supportEmail}}", `${config.SUPPORT_EMAIL}`),
      });
      if(brevoMail?.messageId) return resolve({success: true});
      return reject({error:brevoMail});

    });
  } catch (error) {
    return { error: error };
  }
}

// GOOGLE  MAIL

// mail options

exports.invitationMailHandler = async (email, subject, uniqueString, title, message, team, template = "invitation") => {
  try {
    const content = mailContentReader(template);
    return new Promise( async (resolve, reject) => {
      const brevoMail = await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: `${CONFIG.APP_NAME}`, email: `${domainMail.mail()}` },
        to: [{ email: email }],
        subject: subject,
        htmlContent: content.replace("{{link}}", `${config.FRONTEND_ORIGIN_URL}/invite/?ref=${uniqueString}`).replace("{{company}}", `${CONFIG.APP_NAME}`).replace("{{title}}", title).replace("{{message}}", message).replace("{{grubbexDept}}", team).replace("{{website}}", `${config.FRONTEND_ORIGIN_URL}`).replace("{{facebook}}", `${config.FACEBOOK}`).replace("{{x}}", `${config.X}`).replace("{{linkedin}}", `${config.LINKEDIN}`).replace("{{instagram}}", `${config.INSTAGRAM}`),
      });
      if(brevoMail?.messageId) return resolve({success: true});
      return reject({error:brevoMail});
    });
  } catch (error) {
    return { error: error };
  }
};
exports.recoveryPasswordMailHandler = async (email, subject, uniqueString, title, message,grubbexDept, otp) => {
  try {
    const content = mailContentReader("password_recovery"); 
    return new Promise( async (resolve, reject) => {
      const brevoMail = await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: `${CONFIG.APP_NAME}`, email: `${domainMail.mail()}` },
        to: [{ email: email }],
        subject: subject,
        htmlContent: content.replace("{{link}}", otp? " ": `${config.FRONTEND_ORIGIN_URL}/password-recovery?ref=${uniqueString}`).replace("{{company}}", `${CONFIG.APP_NAME}`).replace("{{title}}", title).replace("{{message}}", message).replace("{{grubbexDept}}", grubbexDept).replace("{{buttonText}}", otp? otp: "Reset Password").replace("{{website}}", `${config.FRONTEND_ORIGIN_URL}`).replace("{{facebook}}", `${config.FACEBOOK}`).replace("{{x}}", `${config.X}`).replace("{{linkedin}}", `${config.LINKEDIN}`).replace("{{instagram}}", `${config.INSTAGRAM}`),
      });
      if(brevoMail?.messageId) return resolve({success: true});
      return reject({error:brevoMail});
    });
  } catch (error) {
    return { error: error };
  }
};
exports.verificationMailHandler = async (email, subject="Account Verification", expiryTime, uniqueString, username) => {
  try {email
 
    const content = mailContentReader("verify");
    return new Promise( async (resolve, reject) => {
      const brevoMail = await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: `${CONFIG.APP_NAME}`, email: `${domainMail.mail()}` },
        to: [{ email: email }],
        subject: subject,
        htmlContent: content.replace("{{link}}", `${config.FRONTEND_ORIGIN_URL}/user/verify?id=${uniqueString}`).replace("{{company}}", `${CONFIG.APP_NAME}`).replace("{{expiryTime}}", expiryTime).replace("{{username}}", username),
      });
      if(brevoMail?.messageId) return resolve({success: true});
      return reject({error:brevoMail});
    });
  } catch (error) {
    return { error: error };
  }
};
exports.sendEMailHandler = async (sendTo, subject, message, attachment=null)=> {
  try {
    const content = mailContentReader("general");
    return new Promise( async (resolve, reject) => {
      const brevoMail = await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: `${CONFIG.APP_NAME}`, email: `${domainMail.mail()}` },
        to: [{ email: sendTo }],
        subject: subject,
        htmlContent: content.replace("{{message}}", message).replace("{{company}}", `${CONFIG.APP_NAME}`),
        attachments: attachment? [{ content: attachment.content, name: attachment.name, type: attachment.type }]: null
      });
      if(brevoMail?.messageId) return resolve({success: true});
      return reject({error:brevoMail});
    });
  } catch (error) {
    return { error: error };
  }
}