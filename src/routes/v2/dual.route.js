const express = require("express");
const { APIError } = require("../../shared/utils/apiError");
const logger = require("../../logger");
const config = require("../../config/env");
const { META } = require("../../shared/utils/actions");
const RouterV2 = express.Router();
const path = require("path");
const fs = require("fs");
const { webIsRequired, phoneIsRequired } = require("../../middlewares/auth.middleware");
const Routers = require("./");

RouterV2.use("/", webIsRequired, Routers.Router_v2);  
RouterV2.use("/m", phoneIsRequired, Routers.MobileRouter_v2)  

RouterV2.get("/payment/success", async (req, res, next) => {
  const { reference } = req.query;
  try {

  if (!reference) return next(APIError.badRequest('Missing transaction reference'));
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${config.PAYSTACK_SECRETE_KEY}` },
      }
    ); 
    const transaction = response.data.data;
    if (response.data.status && transaction.status === 'success') {
      logger.info("Payment verified", {service:META.PAYSTACK_SERVICE})
      res.render( path.join(__dirname, "../views",'success'), {
        reference: transaction.reference,
        orderId: transaction.metadata?.order_id || null,
        amount: (transaction.amount / 100).toLocaleString(), // format with commas
        email: transaction.customer?.email || null,
        contact: config.FRONTEND_ORIGIN_URL,
        layout: false
      });
    } else {
    return  next(APIError.badRequest('Payment verification failed.'));
    }
  } catch (error) {
    next(error)
  }
});
RouterV2.get("/privacy_policy", async (req, res, next) => {
  try {
  
      logger.info("Privacy policy retrieved", {service:META.SETTING})
      res.render( path.join(__dirname, "../views",'privacy_policy'), {
        email: config.MAIL_USER,
        phoneNumber: config.ADMIN_NUMBER,
        address: config.COMPANY_ADDRESS,
        layout: false
      });
      
  } catch (error) {
    next(error)
  }
});
RouterV2.get("/refund_policy", async (req, res, next) => {
  try {
  
      logger.info("Privacy policy retrieved", {service:META.SETTING})
      res.render( path.join(__dirname, "../views",'refund_policy'), {
        email: config.MAIL_USER,
        phoneNumber: config.ADMIN_NUMBER,
        address: config.COMPANY_ADDRESS,
        layout: false
      });
      
  } catch (error) {
    next(error)
  }
});

module.exports = RouterV2;