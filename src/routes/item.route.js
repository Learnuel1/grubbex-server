const express = require("express");
const itemRoute = express.Router();
const Controller = require("../controllers");
const { adminRequired, userRequired } = require("../middlewares/auth.middleware");

itemRoute.post("/", userRequired, Controller.ItemController.addItem).get("/", Controller.ItemController.items).get("/:category", Controller.ItemController.itemsByCategory).put("/:id", userRequired, Controller.ItemController.update).delete("/", userRequired, Controller.ItemController.deleteItem)

module.exports = {
  itemRoute
};