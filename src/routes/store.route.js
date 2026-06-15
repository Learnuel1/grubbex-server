const { CONSTANTS } = require("../config");
const { userRequired } = require("../middlewares/auth.middleware");
const { allowedRoles, validateRequestData, renameZodSchema } = require("../shared/middleware/data_validator.middleware");
const Controller = require("../api/store")

const StoreRoute = require("express").Router();
const routes = require("express").Router();

routes.post("/", allowedRoles([CONSTANTS.ACCOUNT_TYPE_OBJ.business]), validateRequestData("ZStoreSchema"), Controller.StoreCtrl.createStore)
.get("/", allowedRoles([CONSTANTS.ACCOUNT_TYPE_OBJ.business]), renameZodSchema("ZStoreSchema"), Controller.StoreCtrl.searchStore)
.delete("/", allowedRoles([CONSTANTS.ACCOUNT_TYPE_OBJ.business]),  Controller.StoreCtrl.deleteStore)
.put("/", allowedRoles([CONSTANTS.ACCOUNT_TYPE_OBJ.business]),  Controller.StoreCtrl.updateStore)
.get("/store_category", Controller.StoreCategoryCtrl.getCategory)



StoreRoute.use("/", userRequired, routes);

module.exports = {
  StoreRoute
}