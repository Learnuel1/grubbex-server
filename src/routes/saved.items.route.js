const SavedItemRouter = require('express').Router();
const SavedItemRoutes = require('express').Router();
const { CONSTANTS } = require('../config');
const { userRequired } = require('../middlewares/auth.middleware');
const shared = require("../shared");
const { validateRequestData, notAllowedRoles } = require('../shared/middleware/data_validator.middleware');

SavedItemRoutes.post("/save", validateRequestData("ZSaveItemSchema"), shared.Controllers.SavedItemController.saveProduct).get("/", shared.Controllers.SavedItemController.getSavedProducts).delete("/", validateRequestData("ZSaveItemSchema"), shared.Controllers.SavedItemController.deleteSavedItem);

SavedItemRouter.use("/shopper", userRequired, notAllowedRoles([CONSTANTS.ACCOUNT_TYPE.admin, CONSTANTS.ACCOUNT_TYPE.rider]), SavedItemRoutes);
module.exports = {SavedItemRouter};