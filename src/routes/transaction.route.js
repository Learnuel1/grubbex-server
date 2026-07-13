const TransactionRouter = require("express").Router();
const { payStackVerifyTransaction, payStackConfirmTransaction } = require("../shared/controller/order.controller");
const { userRequired } = require("../middlewares/auth.middleware");
const { TransactionHistoryRouter } = require("./transaction.history.route");
const { WalletRouter } = require("./wallet.route");
const { transactionStatus } = require("../controllers/payment.controller");

TransactionRouter
.use("/history", userRequired,  TransactionHistoryRouter)
.use("/wallet", userRequired, WalletRouter)
.get("transaction-status", userRequired, transactionStatus)
.get("/verify", userRequired, payStackVerifyTransaction)
.post("/successful", payStackConfirmTransaction)
module.exports = {
    TransactionRouter
};