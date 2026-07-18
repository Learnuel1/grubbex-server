const { CONSTANTS } = require("../config");
const { userRequired, isVerified } = require("../middlewares/auth.middleware");
const { notAllowedAccount, allowedRoles } = require("../shared/middleware/data_validator.middleware");
const productModule = require("../api/store/");
const { multerFile } = require("../shared/utils/multer");
const shared = require("../shared");
const productRoute = require("express").Router();
const routes = require("express").Router();

routes.post("/new", multerFile.fields([{name:"mainImage", maxCount:1}, {name: "others", maxCount:4}]),  productModule.ProductCtrl.createProduct
).get("/store", productModule.ProductCtrl.productsByStoreOwner).delete("/",productModule.ProductCtrl.deleteStoreProduct).patch("/status", productModule.ProductCtrl.updateStoreProductStatus).patch("/contact", shared.Controllers.AccController.updateUserContact).get("/store/id",  productModule.ProductCtrl.productsByStoreOwnerByID)

productRoute.use("/", userRequired , isVerified, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.business]), notAllowedAccount(CONSTANTS.ACCOUNT_TYPE_OBJ.admin), routes)

module.exports = {
  productRoute
};