const Mailer = require("./email");
const config = require("../../config/env");

console.log(Mailer[config.EMAIL_SERVICE], "Mailer[config.EMAIL_SERVICE]")
exports.registerOTPMailHandler = async (email, otp, expires, title, message, template, grubbyDept, subject) => await Mailer[config.EMAIL_SERVICE].registrationOTPMailHandler(email, otp, expires, title, message, template, grubbyDept, subject);
exports.invitationMailerHandler = async (email, subject, uniqueString, title, message, team, template = "invitation") => await Mailer[config.EMAIL_SERVICE].invitationMailHandler(email, subject, uniqueString, title, message, team, template);
exports.passwordRecoveryMailHandler = async (email, subject, uniqueString, title, message, team, template = "password.recovery") => await Mailer[config.EMAIL_SERVICE].passwordRecoveryMailHandler(email, subject, uniqueString, title, message, grubbexDept, otp);
exports.recoveryPasswordMailHandler = async (email, uniqueString, subject, title, message, grubbexDept, otp, template = "password.recovery") => await Mailer[config.EMAIL_SERVICE].recoveryPasswordMailHandler(email, expiryTime, uniqueString, username);
exports.sendEMailHandler = async (sendTo, subject, message, attachment = null) => await Mailer[config.EMAIL_SERVICE].sendEMailHandler(sendTo, subject, message, attachment);
