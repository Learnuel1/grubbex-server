const EmailRoute = require("express").Router();
const shared = require("../shared"); 
const { multerFile } = require("../shared/utils/multer");

EmailRoute.post("/", multerFile.array("attachment"), shared.Controllers.EmailController.sendMail)
module.exports = {
  EmailRoute,
}