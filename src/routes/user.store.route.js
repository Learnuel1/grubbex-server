const express = require('express');
const Controller = require("../api/store")

const userStoreRouter = express.Router();

// Define your routes here
userStoreRouter
  .get('/', Controller.StoreCtrl.getProductForShopperHome)
  .get('/nearby', Controller.StoreCtrl.getNearbyStores)
  .get('/item/:liked', Controller.StoreCtrl.getShopperLikedItems)
  .get('/address', Controller.KYCController.getStoreAddress)
  .get("/all", Controller.StoreCtrl.getStores)

module.exports = userStoreRouter;