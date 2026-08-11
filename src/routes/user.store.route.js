const express = require('express');
const Controller = require("../api/store");
const { allowedRoles, validateRequestData } = require('../shared/middleware/data_validator.middleware');
const { CONSTANTS } = require('../config');
 const routes = express.Router();
const userStoreRouter = express.Router();

// Define your routes here
userStoreRouter
  .get('/', Controller.StoreCtrl.getProductForShopperHome)
  .get('/nearby', Controller.StoreCtrl.getNearbyStores)
  .get('/item/:liked', Controller.StoreCtrl.getShopperLikedItems)
  .get('/address', Controller.KYCController.getStoreAddress)
  .get("/all", Controller.StoreCtrl.getStores)
  .get("/product", validateRequestData("ZProductIDSchema"), Controller.ProductCtrl.productByID)
routes.use("/", allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.shopper, CONSTANTS.ACCOUNT_ROLE_OBJ.rider]), userStoreRouter)
module.exports = {userStoreRouter: routes};