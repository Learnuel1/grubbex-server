const StoreCategoryRoute = require("express").Router();
const StoreRoute = require("express").Router();
const storeModule = require("../api/store");
const { CONSTANTS } = require("../config");
const { adminRequired, userRequired, passwordRequired } = require("../middlewares/auth.middleware");
const { validateRequestData, renameZodSchema, allowedRoles, notAllowedRoles } = require("../shared/middleware/data_validator.middleware");
const { multerFile } = require("../shared/utils/multer");

StoreCategoryRoute.post("/store_category", adminRequired, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.super, CONSTANTS.ACCOUNT_ROLE_OBJ.dev]),  multerFile.single("image"), 
validateRequestData("ZStoreCategorySchema"), storeModule.StoreCategoryCtrl.createCategory).put("/store_category", adminRequired, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.super,CONSTANTS.ACCOUNT_ROLE_OBJ.dev]), multerFile.single("image"), storeModule.StoreCategoryCtrl.updateCategory).delete("/store_category", passwordRequired, adminRequired, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.super, CONSTANTS.ACCOUNT_ROLE_OBJ.dev]), storeModule.StoreCategoryCtrl.deleteCategory).get("/store_category", userRequired, notAllowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.driver, CONSTANTS.ACCOUNT_ROLE_OBJ.user]), renameZodSchema("ZStoreCategorySchema"), storeModule.StoreCategoryCtrl.getCategory).patch("/store_category", adminRequired, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.super, CONSTANTS.ACCOUNT_ROLE_OBJ.dev]), storeModule.StoreCategoryCtrl.delSubCategory)


module.exports = {
  StoreCategoryRoute,
}