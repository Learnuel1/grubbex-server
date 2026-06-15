const express = require("express");
const KYCRoute = express.Router();
const routes = express.Router();
const Controller = require("../shared/controller")
const { userRequired, driverRequired } = require("../middlewares/auth.middleware");
const { multerFile } = require("../shared/utils/multer");
const { validateRequestData, allowedRoles, renameZodSchema, notAllowedRoles, notAllowedAccount } = require("../shared/middleware/data_validator.middleware");
const { CONSTANTS } = require("../config");
const shared = require("../shared"); 

routes.put("/profile",  multerFile.fields([{name:"logo", maxCount:1}, {name: "banner", maxCount:1}]), validateRequestData("ZStoreProfileSchema"), shared.Controllers.KYCController.updateProfile)
.put("/document",  multerFile.fields([{name: "front", maxCount:1}, {name: "back", maxCount:1}]),shared.Controllers.KYCController.uploadDocument) 
.get("/kyc", notAllowedAccount(CONSTANTS.ACCOUNT_ROLE_OBJ.admin),  shared.Controllers.KYCController.getKYC)
.get("/kyc/:userId", allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.super, CONSTANTS.ACCOUNT_ROLE_OBJ.admin, CONSTANTS.ACCOUNT_ROLE_OBJ.service]),  shared.Controllers.KYCController.getKYCByAccountId)
.get("/all", renameZodSchema("ZProfileSchema"),  shared.Controllers.KYCController.searchKYC)
.patch("/status", allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.super, CONSTANTS.ACCOUNT_ROLE_OBJ.admin]), shared.Controllers.KYCController.updateKYCStatus)
.put("/bank",  validateRequestData("ZBankSchema"), shared.Controllers.KYCController.bankDetails)
.patch("/finalize", notAllowedAccount(CONSTANTS.ACCOUNT_ROLE_OBJ.admin), shared.Controllers.KYCController.finalizeUpload).put("/location", shared.Controllers.KYCController.updateLocation)

KYCRoute.use("/", userRequired, routes);
module.exports = {
  KYCRoute, 
}