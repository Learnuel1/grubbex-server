const express = require("express");
const Router = express.Router();
const Routes = require("./");
const { phoneIsRequired, webIsRequired } = require("../middlewares/auth.middleware");
const { APIError } = require("../shared/utils/apiError");
const config = require("../config/env");
const { default: axios } = require("axios");
const path = require("path");
const fs = require("fs");
const { META } = require("../shared/utils/actions");
const logger = require("../logger");
Router.use("/", webIsRequired, Routes.Router); // require website user 
Router.use("/m", phoneIsRequired, Routes.MobileRouter) // require mobile user

Router.get("/payment/success", async (req, res, next) => {
  const { reference } = req.query;
  try {

  if (!reference) return next(APIError.badRequest('Missing transaction reference'));

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
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

module.exports = Router;