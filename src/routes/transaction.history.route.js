const TransactionHistoryRouter = require("express").Router();
const HistoryRoute = require("express").Router();
const shared = require("../shared");
HistoryRoute.get("/store", shared.Controllers.WalletController.walletHistory);
TransactionHistoryRouter.use("/",  HistoryRoute);
module.exports = {TransactionHistoryRouter};