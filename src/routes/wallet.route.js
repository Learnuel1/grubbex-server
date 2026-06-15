const shared = require("../shared");

const WalletRouter = require("express").Router();

WalletRouter.post("/fund_wallet", shared.Controllers.WalletController.initializeWalletFundingWithPayStack).get("/balance", shared.Controllers.WalletController.getWalletBalance)
module.exports = {
    WalletRouter
};