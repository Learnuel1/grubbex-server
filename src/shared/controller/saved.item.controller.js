const { findStore, getProductForSaveItemByProId } = require("../../api/store/service");
const { saveItem, getSavedProducts, removeSavedItem } = require("../services/interface");
const { getSavedStoreItems } = require("../services/saved.item.service");
const { APIError } = require("../utils/apiError");

exports.saveProduct = async (req, res, next ) => {
    try{
        const {prodId, storeId} = req.body;
        if(!prodId && !storeId) return next(APIError.badRequest("Store or Product ID is required"));
        
        const info = {prodId, storeId, shopperId: req.userId, shopper: req.user};
        if(storeId) {
            const store = await findStore({storeId});
            if(!store) return next(APIError.badRequest("Store does not exist"));
            if(store?.error) return next(APIError.badRequest(store.error));
            info.store = store[0]._id;
        }
        if(prodId) {
            const product =await getProductForSaveItemByProId(prodId);
            if(!product) return next(APIError.badRequest("Product does not exist"));
            if(product?.error) return next(APIError.badRequest(product.error));
            info.product = product._id;
        }
        const result = await saveItem(info);
        if(!result) return next(APIError.badRequest("Failed to save item"));
        if(result?.error) return next(APIError.badRequest(result.error));
        return res.status(200).json({msg: "Item saved successfully"});
    } catch (error) {
        next(error);
    }
}
exports.getSavedProducts = async (req, res, next) => {
    try{
        const { section} = req.query?.toLowerCase();
         const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        if(!section || section.toLowerCase() !== "products" && section.toLowerCase() !== "store") return next(APIError.badRequest("Invalid section"));
        const skip = (page - 1) * limit;
        const query = {shopperId: req.userId, shopper: req.user};
        if(section.toLowerCase() === "store") {
            query.storeId = {$exists: true};
            const {savedItems, totalCount} = await getSavedStoreItems(query, skip, limit);
        if(!savedItems) return next(APIError.badRequest("Failed to fetch saved products"));
        if(savedItems?.error) return next(APIError.badRequest(savedItems.error));
        const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);
        
        return res.status(200).json({msg: "Found", data: {savedItems, total:totalCount, pagination: {
             page,
            limit,
            totalPages: totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        }}});
        } else if (section.toLowerCase() === "products") {
            query.prodId = {$exists: true};
        const {savedItems, totalCount} = await getSavedProducts(query, skip, limit);
        if(!savedItems) return next(APIError.badRequest("Failed to fetch saved products"));
        if(savedItems?.error) return next(APIError.badRequest(savedItems.error));
        const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);
        
        return res.status(200).json({msg: "Found", data: {savedItems, total:totalCount, pagination: {
             page,
            limit,
            totalPages: totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        }}});
    }
    } catch (error) {
        next (error);
    }
}
exports.deleteSavedItem = async (req, res, next) => {
    try {
        const {prodId, storeId} = req.query;
        if(!prodId && !storeId) return next(APIError.badRequest("Product or Store ID is required"));
        const info = {prodId, storeId, shopperId: req.userId, shopper: req.user};
        const result = await removeSavedItem(info);
        if(!result) return next(APIError.badRequest("Failed to remove saved item"));
        if(result?.error) return next(APIError.badRequest(result.error));
        return res.status(200).json({msg: "Saved item removed successfully"});
    } catch (error) {
        next(error);
    }
}