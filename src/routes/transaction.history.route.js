const TransactionHistoryRouter = require("express").Router();
const HistoryRoute = require("express").Router();
const shared = require("../shared");
HistoryRoute
.get("/", shared.Controllers.WalletController.walletHistory)
.get("/date-range", shared.Controllers.WalletController.walletHistoryByDateRange)
TransactionHistoryRouter.use("/",  HistoryRoute);
module.exports = {
    TransactionHistoryRouter
};