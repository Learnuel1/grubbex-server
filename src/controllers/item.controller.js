const { Mongoose } = require("mongoose");
const {APIError} = require("../utils/apiError");
const { createItem, getItems, updateItem, getItemsByCategory, removeItem } = require("../services");
const logger = require("../logger");
const { META } = require("../utils/actions");
const buildRes = require("../utils/responseBuilder");
exports.addItem = async (req, res, next) => {
  try{
    const {name, category} = req.body;
    if(!name) return next(APIError.badRequest("Item name is required"));
    if(!category) return next(APIError.badRequest("Item category is required"));
    const create = await createItem({name, category: category.toLowerCase(), admin:req.userId});
    if(!create) return next(APIError.badRequest("Item creation failed"));
    if(create?.error) return next(APIError.badRequest(create.error));
    logger.info("Item created successfully", {service: META.ITEM})
    res.status(201).json({status: true, msg:"Item created successfully"})
  } catch (error) {
    next(error);
  }
}
exports.update = async (req, res, next) => {
  try{
    const item= {};
    if(!req.query.itemId) return next(APIError.badRequest("Item Id is required"));
    for(let key in req.body){
      item[key] = req.body[key];
    }
    if(!item) return next(APIError.badRequest("Item info is required"));
    const update = await updateItem(req.query.itemId, item);
    if(!update) return next(APIError.badRequest("Item update failed"));
    if(update?.error) return next(APIError.badRequest(update.error));
    logger.info("Item updated successfully", {service: META.ITEM})
    res.status(200).json({status: true, msg:"Item updated successfully"})
  } catch (error) {
    next(error);
  }
}
exports.items = async (req, res, next) => {
  try{
    const items = await getItems();
    if(!items || items.length === 0) return next(APIError.notFound("No item found"));
    if(items.error) return next (APIError.badRequest(items.error));
    const data = items.map((item) => {
      return buildRes.buildItem(item.toObject());
    })
    const response = buildRes.commonResponse("Found",data,"item");
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
exports.itemsByCategory = async (req, res, next) => {
  try{
    const {category} = req.query;
    if(!category) return next(APIError.badRequest("CategoryId is required"));
    const items = await getItemsByCategory(category);
    if(!items || items.length === 0) return next(APIError.notFound("No item found"));
    if(items.error) return next (APIError.badRequest(items.error));
    const data = items.map((item) => {
      return buildRes.buildItem(item.toObject());
    })
    const response = buildRes.commonResponse("Found",data,"item");
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
exports.deleteItem = async (req, res, next) => {
  try{
    const item= {};
    if(!req.body.itemId) return next(APIError.badRequest("Item Id is required"));
    const update = await removeItem(req.body.itemId);
    if(!update) return next(APIError.badRequest("Item update failed"));
    if(update?.error) return next(APIError.badRequest(update.error));
    logger.info("Item deleted successfully", {service: META.ITEM})
    res.status(200).json({status: true, msg:"Item deleted successfully"})
  } catch (error) {
    next(error);
  }
}