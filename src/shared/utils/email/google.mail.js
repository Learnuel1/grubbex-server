const path = require("path")
const { domainMail, mailAuth } = require("../mail.auth");
const { CONFIG, CONSTANTS } = require("../../../config");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const config = require("../../../config/env");
const { mailContentReader } = require("../../../utils/validation"); 
 
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

  // mail options

  const registrationOTPMailOptions = (sendTo, subject, otp, expires, title, message, grubbyDept="Grubbex team", template= "otp") => {
    return {
      from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
      to: sendTo,
      subject,
      template,
      context: { 
        title,
        body:message,
        otp,
        grubbyDept,
        facebook:`${config.FACEBOOK}`,
        x:`${config.X}`,
        linkedin:`${config.LINKEDIN}`,
        instagram:`${config.INSTAGRAM}`,
        unsubscribe:`${config.FRONTEND_ORIGIN_URL}/unsubscribe?email=${sendTo}`,
        home:`${config.FRONTEND_ORIGIN_URL}/home`,
        login:`${config.FRONTEND_ORIGIN_URL}/login`,
        contact:`${config.FRONTEND_ORIGIN_URL}/contact-us`,
        supportEmail:`${config.SUPPORT_EMAIL}`, 
      },
    };
  };

  exports.registrationOTPMailHandler = async (email, otp, expires, title, message, template, grubbyDept, subject = "Registration OTP") => {
    try {
      return new Promise((resolve, reject) => {
        const mail = registrationOTPMailOptions(
          email,
          subject,
          otp,
          expires,
          title,
           message,
           grubbyDept,
          template
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

  //send invitation mail
const invitationMailOptions = (sendTo, subject, uniqueString, title, message,grubbexDept, template) => {
  return {
    from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
    to: sendTo,
    subject,
    template,
    context: { 
      link: `${config.FRONTEND_ORIGIN_URL}/invite/?ref=${uniqueString}`,
      company: `${CONFIG.APP_NAME}`,
      title:  title,
      message,
      grubbexDept,
      website:`${config.FRONTEND_ORIGIN_URL}`,
      facebook:`${config.FACEBOOK}`,
      x:`${config.X}`,
      linkedin:`${config.LINKEDIN}`,
      instagram:`${config.INSTAGRAM}`
    },
  };
};
exports.invitationMailHandler = async (email, subject, uniqueString, title, message, team, template = "invitation") => {
  try {
    return new Promise((resolve, reject) => {
      const mail = invitationMailOptions(
        email,
        subject,
        uniqueString,
        title, message, team,template,
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

// password recovery
const passwordMailOptions = (sendTo, subject, uniqueString, title, message,grubbexDept, otp) => {
  return {
    from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
    to: sendTo,
    subject,
    template: "password_recovery",
    context: { 
      link: otp? " ": `${config.FRONTEND_ORIGIN_URL}/password-recovery?ref=${uniqueString}`,
      company: `${CONFIG.APP_NAME}`,
      title,
      message,
      grubbexDept,
      buttonText: otp? otp: "Reset Password",
      website:`${config.FRONTEND_ORIGIN_URL}`,
      facebook:`${config.FACEBOOK}`,
      x:`${config.X}`,
      linkedin:`${config.LINKEDIN}`,
      instagram:`${config.INSTAGRAM}`
    },
  };
};

exports.recoveryPasswordMailHandler = async (
  email, 
  subject, uniqueString, title, message,grubbexDept, otp
) => {
  return new Promise((resolve, reject) => {
    const mail = passwordMailOptions(
      email,
      subject, uniqueString, title, message,grubbexDept, otp
    );
    transporter.sendMail(mail, (err, data) => {
      if (err) { 
        return reject(err);
      }
      return resolve({ success: true });
    });
  });
};






// verification
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
// GENERAL EMAIL 
const sendEmailOptions = (sendTo, subject, message, attachment) => {
  return {
    from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
    to: sendTo,
    subject,
    // text: message,
    html: message,
    attachments:attachment,
  };
};
exports.sendEMailHandler = (sendTo, subject, message, attachment=null)=> {
  return new Promise((resolve, reject) => {
    const mail = sendEmailOptions(
      sendTo, subject, message, attachment
    );
    transporter.sendMail(mail, (err, data) => {
      if (err) { 
        return reject(err);
      }
      return resolve({ success: true });
    });
  });
}

//payment 
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
   const registrationMailOptions = (sendTo, subject, username, userType, grubbexDept, title) => {
    return {
      from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
      to: sendTo,
      subject,
      template: "registration",
      context: { 
        username, 
        title, 
        grubbexDept,
        facebook:`${config.FACEBOOK}`,
        x:`${config.X}`,
        linkedin:`${config.LINKEDIN}`,
        instagram:`${config.INSTAGRAM}`,
        unsubscribe:`${config.FRONTEND_ORIGIN_URL}/unsubscribe?email=${sendTo}`,
        home:`${config.FRONTEND_ORIGIN_URL}/home`,
        login:`${config.FRONTEND_ORIGIN_URL}/login`,
        contact:`${config.FRONTEND_ORIGIN_URL}/contact-us`,
        supportEmail:`${config.SUPPORT_EMAIL}`, 
        downloadLink: `${userType === CONSTANTS.ACCOUNT_TYPE[0] || userType === CONSTANTS.ACCOUNT_TYPE[2] ? "block" : "none"}`
      },
    };
  };
  exports.registrationMailHandler = async (email, username, userType, grubbexDept, title) => {
    try {
      return new Promise((resolve, reject) => {
        const mail = registrationMailOptions(
          email,
          "Account Registration",
          username,
          userType, grubbexDept, title
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
  



const OrderConfirmationOptions = async (to, orderData) => {
  console.log(orderData)
  return {
  from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
      to,
      subject:`Order Confirmation #${orderData.orderId}`,
      template: "order_confirmation",
      context:{ 
    logoUrl: config.GRUBBEX_LOGO,
    homeUrl:`${config.FRONTEND_ORIGIN_URL}/home`,
    customerName: orderData.customerName,
    orderId: orderData.orderId,
    orderDate: new Date(orderData.createdAt).toLocaleDateString('en-GB'),
    items: orderData.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: (item.price / 100).toFixed(2), // if stored in kobo
    })),
    totalAmount: (orderData.total / 100).toFixed(2),
    paymentReference: orderData.reference,
    paymentMethod: orderData.paymentType,
    unsubscribeUrl: `${config.FRONTEND_ORIGIN_URL}/unsubscribe?email=${to}`,
    privacyUrl: `${config.BASE_URL}/privacy`,
  }
  }
}
exports.OrderConfirmationMailer = async (to, orderData) => {
   try {
      return new Promise((resolve, reject) => {
        const mail = OrderConfirmationOptions(
          to,
          orderData
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
}
const DeleteAccountMailOptions = (to, data) => {
 return {
     from: `${CONFIG.APP_NAME} ${domainMail.mail()}`,
      to,
      subject:`Deleting of Account`,
      template: "delete_account",
      context:{ 
    logoUrl: config.GRUBBEX_LOGO || 'https://yourdomain.com/images/logo.png',
    homeUrl: config.FRONTEND_ORIGIN_URL,
    privacyUrl: `${config.BASE_URL}:${config.SERVER_PORT}/api/v1/privacy_policy`,
    userName: data.userName || 'User',
    userEmail: data.Email || to,
    deletionDate: data.deletionDate || new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    }),
    orderCount: data.orderCount || null,
      }
 }
}

exports.DeleteAccountMailHandler = async (to, data) => {
   try {
      return new Promise((resolve, reject) => {
        const mail = DeleteAccountMailOptions(
          to,
          data
          
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
}