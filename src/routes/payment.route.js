
const express = require("express");
const paymentRoute = express.Router();
const Controller = require("../controllers");
const { userRequired } = require("../middlewares/auth.middleware");
paymentRoute.post("/checkout", userRequired, Controller.PaymentController.checkout).post("/verify",Controller.PaymentController.verify).post("/payment-completed",Controller.PaymentController.paymentCompleted).get("/wallet", userRequired, Controller.PaymentController.walletBalance).get("/verify-account", userRequired, Controller.PaymentController.verifyBankInfo).get("/banks", Controller.PaymentController.getBanks)

module.exports = {
  paymentRoute,
}

