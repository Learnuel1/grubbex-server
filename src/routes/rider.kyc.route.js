const express = require('express'); 
const RiderKYCRouter = express.Router(); 
const shared = require("../shared"); 
const { multerFile } = require('../shared/utils/multer');
const { validateRequestData } = require('../shared/middleware/data_validator.middleware');  

RiderKYCRouter.put("/profile",  validateRequestData("ZProfileSchema"), shared.Controllers.KYCController.updateProfile).put("/document", multerFile.fields([{name: "front", maxCount:1}, {name: "back", maxCount:1}]),  shared.Controllers.KYCController.uploadDocument).put("/bank",  validateRequestData("ZBankSchema"), shared.Controllers.KYCController.bankDetails).patch("/finalize", shared.Controllers.KYCController.finalizeUpload).put("/logistics", multerFile.fields([{name:"vehicleRegistration", maxCount: 1}, {name: "insurance", maxCount: 1}]), validateRequestData("ZLogisticsSchema"), shared.Controllers.KYCController.updateLogistics).delete("/logistics", shared.Controllers.KYCController.removeLogistics).put("/bank",  validateRequestData("ZBankSchema"), shared.Controllers.KYCController.bankDetails).patch("/contact", shared.Controllers.AccController.updateUserContact).patch("/profile-image", multerFile.single ("image"), shared.Controllers.KYCController.updateProfileImage)
module.exports = {RiderKYCRouter};