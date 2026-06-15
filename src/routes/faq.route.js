const { adminRequired } = require("../middlewares/auth.middleware");
const { FAQController } = require("../shared/controller");
const { validateRequestData } = require("../shared/middleware/data_validator.middleware");
const FAQRouter = require("express").Router(); 

FAQRouter.post("/", validateRequestData("ZFaqSchema"), FAQController.createFAQ).get("/", FAQController.getFAQs).delete("/", FAQController.deleteFAQ).get("/:id", FAQController.getSingleFAQById).put("/", FAQController.modifyFAQ)

 
module.exports = {
    FAQRouter
}