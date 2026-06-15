const config = require("../../config/env");
const sgMail = require('@sendgrid/mail'); 
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

exports.domainMail = {
  mail: () => config.MAIL_USER,
  // sgMail,
};

