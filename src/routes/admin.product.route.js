
const productModule = require("../api/store/"); 
const adminProductRoute = require("express").Router();
const routes = require("express").Router();

routes.get("/store", productModule.ProductCtrl.productsByStoreId).delete("/",productModule.ProductCtrl.deleteStoreProduct).patch("/status", productModule.ProductCtrl.updateStoreProductStatus)
adminProductRoute.use("/", routes)
module.exports = {
  adminProductRoute
};