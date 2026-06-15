const config = require("../../config/env");
const sgMail = require('@sendgrid/mail'); 
const { BrevoClient } = require("@getbrevo/brevo");
require("dotenv").config();
// sgMail.setApiKey(config.SENDGRID_API_KEY)
exports. mailAuth = {
  service: `gmail`,
  auth: {
    user: config.MAIL_USER,
    pass: config.MAIL_PASS,
  },
};
// sendgrid SMTP
// exports.mailAuth = {
//   host: 'smtp.sendgrid.net',
//   port: 587,
//   auth: {
//     user: 'apikey',
//     pass: config.SENDGRID_API_KEY,
//   },
// };

// exports.domainMail = {
//   mail: () => config.SUPPORT_EMAIL || config.MAIL_USER,
//   sgMail,
// };
const brevo = new BrevoClient({
  apiKey: config.BREVO_KEY,
  timeoutInSeconds: 30,
  maxRetries: 3,
});

exports.domainMail = {
  mail: () => config.MAIL_USER, 
   brevo:()=> brevo,
};

