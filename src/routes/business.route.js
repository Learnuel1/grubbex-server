const express = require("express");
const BusinessRoute= express.Router(); 
const KYC = require("./business.kyc.route");
const { StoreRoute } = require("./store.route");
const product = require("./product.route"); 

BusinessRoute.use("/store", StoreRoute)
BusinessRoute.use("/kyc", KYC.KYCRoute)
BusinessRoute.use("/product", product.productRoute)
BusinessRoute.use("/profile", product.productRoute)




module.exports = {
  BusinessRoute,
};