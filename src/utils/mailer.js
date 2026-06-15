/* eslint-disable no-unused-vars */
const { domainMail, mailAuth, getOAuthMailAuth } = require("./mail.auth");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
require("dotenv").config();
const path = require("path");
const {CONFIG} = require("../config");
const config = require("../config/env");
const { mailContentReader } = require("./validation");

const handlebarsOptions = {
  viewEngine: {
    extName: ".handlebars",
    partialsDir: path.resolve("./src/views"),
    defaultLayout: false,
  },
  viewPath: path.resolve("./src/views"),
  extName: ".handlebars",
};
 
let transporter = nodemailer.createTransport(
  {
    ...mailAuth
  });
transporter.use("compile", hbs(handlebarsOptions));
//   const transporter  = (async () => {
//   const auth = await getOAuthMailAuth();
//   const t = nodemailer.createTransport(auth);
//   t.use("compile", hbs(handlebarsOptions))
//   return t;
// })();

const mailOptions = (sendTo, subject, message) => {
  return {
    from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
    to: sendTo,
    subject,
    text: message,
    html: message,
  };
};
exports.sendEMail = (sendTo, subject, message)=> {
  return new Promise((resolve, reject) => {
    const mail = mailOptions(
      sendTo, subject, message
    );
    transporter.sendMail(mail, (err, data) => {
      if (err) { 
        return reject(err);
      }
      return resolve({ success: true });
    });
  });
}
 
const registrationMailOptions = (sendTo, subject, username) => {
  return {
    from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
    to: sendTo,
    subject,
    template: "registration",
    context: { 
      loginLink: `${process.env.FRONTEND_ORIGIN_URL}/login`,
      site: `${process.env.FRONTEND_ORIGIN_URL}`,
      message: "You're most welcome",
      username,
      companyName: config.COMPANY_NAME,
    },
  };
};
//send invitation mail
const invitationMailOptions = (sendTo, subject, uniqueString, expiresIn) => {
  return {
    from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
    to: sendTo,
    subject,
    template: "invitation",
    context: { 
      link: `${process.env.FRONTEND_ORIGIN_URL}/invite/id=${uniqueString}`,
      company: `${CONFIG.APP_NAME}`, 
      expires: `Invitation expires in ${expiresIn}`,
    },
  };
};
const passwordMailOptions = (sendTo, subject, uniqueString) => {
  return {
    from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
    to: sendTo,
    subject,
    template: "resetpass",
    context: {  
      company: `${CONFIG.APP_NAME}`,
      resetLink: `${config.FRONTEND_ORIGIN_URL}/verify_password_reset?ref=${uniqueString}`,
      unsubscribe: `${config.FRONTEND_ORIGIN_URL}/unsubscribe?email=${sendTo}`
    },
  };
};
const bookAcceptanceMailOptions = (sendTo, subject, info) => {
  return {
    from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
    to: sendTo,
    subject,
    template: "booking_notify",
    context: { 
      bookId: `${info.bookId}`,
      booker: `${info.fullname}`,
      receiver: `${info.receiver}`,
      receiverPhone: `${info.receiverContact}`,
      destination: info.receiverAddress,
      Title: `${info.title}`,
      company: `${CONFIG.APP_NAME}`,
      companyUrl: `${CONFIG.APP_NAME}`,
      muvaId: `${info?.muvaId ||  " "}`,
      showMuvId: `${info?.muvaId ? "block" : "none"}`
    },
  };
};
const verificationdMailOptions = (
  sendTo,
  subject,
  expiryTime,
  uniqueString,
  username
) => {
  return {
    from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
    to: sendTo,
    subject,
    template: "verify",
    context: {
      expiryTime: `${expiryTime} `,
      link: `${config.FRONTEND_ORIGIN_URL}/user/verify?id=${uniqueString}`,
      username,
    },
  };
}; 
const paymentCompleteMailOptions = (
  sendTo,
  subject,
  plan,
  name
) => {
  return {
    from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
    to: sendTo,
    subject,
    template: "payment.completed",
    context: {
      plan,
      name,
    },
  };
};

const registrationOTPMailOptions = (sendTo, subject, otp, expires) => {
  return {
    from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
    to: sendTo,
    subject,
    template: "otp",
    context: { 
      otp,
      company: `${CONFIG.APP_NAME}`,
    },
  };
};
exports.recoveryPasswordMailHandler = async (
  email, 
  uniqueString
) => {
  return new Promise((resolve, reject) => {
    const mail = passwordMailOptions(
      email,
      "Password Reset", 
      uniqueString
    );
    transporter.sendMail(mail, (err, data) => {
      if (err) { 
        return reject(err);
      }
      return resolve({ success: true });
    });
  });
};
exports.registrationOTPMailHandler = async (email, otp, expires) => {
  try {
    return new Promise((resolve, reject) => {
      const mail = registrationOTPMailOptions(
        email,
        "Registration OTP",
        otp,
        expires
      );
      transporter.sendMail(mail, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve({ success: true });
      });
    });
  } catch (error) {
    return { error: error };
  }
};
exports.registrationMailHandler = async (email, username) => {
  try {
    return new Promise((resolve, reject) => {
      const mail = registrationMailOptions(
        email,
        "Account Registration",
        username,
      );
      transporter.sendMail(mail, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve({ success: true });
      });
    });
  } catch (error) {
    return { error: error };
  }
};

exports.invitationMailHandler = async (email, uniqueString, expiresIn) => {
  try {
    return new Promise((resolve, reject) => {
      const mail = invitationMailOptions(
        email,
        "Invitation",
        uniqueString,
        expiresIn
      );
      transporter.sendMail(mail, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve({ success: true });
      });
    });
  } catch (error) {
    return { error: error };
  }
};
exports.paymentSuccessMailHandler = async (email,plan, name) => {
  try {
    return new Promise((resolve, reject) => {
      const mail = paymentCompleteMailOptions(
        email,
        "Plan Purchase",
        plan,
        name
      );
      transporter.sendMail(mail, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve({ success: true });
      });
    });
  } catch (error) {
    return { error: error };
  }
};
exports.verificationMailHandler = async (
  email,
  expiryTime,
  uniqueString,
  username
) => {
  return new Promise((resolve, reject) => {
    const mail = verificationdMailOptions(
      email,
      "Account Verification",
      expiryTime,
      uniqueString,
      username
    );
    transporter.sendMail(mail, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve({ success: true });
    });
  });
}; 

exports.bookingNotifyMailHandler = async (email, subject, bookId, info) => {
  try {
    return new Promise((resolve, reject) => {
      const mail = bookAcceptanceMailOptions(
        email,
        subject,
        bookId,
        info
      );
      transporter.sendMail(mail, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve({ success: true });
      });
    });
  } catch (error) {
    return { error: error };
  }
};

exports.sendGridMailer = async (email, subject, message, info ={}) => {
  try{
    const msg = {
      to:[`${email}`],
      from: {
        name: `${CONFIG.APP_NAME} `,
        email: `${domainMail.mail()}`
      },
      subject,
      text: message,
      // html: message
    }
    await domainMail.sgMail.send(msg);
  } catch (error) {
    if(error?.response) return {error: error.response.body}
    return {error: error};
  }
}
