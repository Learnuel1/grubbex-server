const categoryModule = require("./store.category.service")
const StoreModule = require("./store.service");
const ProductModule = require("./product.service");
// STORE
exports.addNewStore = async (info) => await StoreModule.add(info);
 
exports.removeStore = async (storeId, user) => await StoreModule.remove(storeId, user);
exports.updateStore = async ( storeId, user) => await StoreModule.update( storeId, user);
exports.updateStoreLocation = async ( storeId, info) => await StoreModule.updateLocation( storeId, info);
exports.findStore = async (type) => await StoreModule.find(type);
exports.searchUserStore = async (query) => await StoreModule.search(query);
exports.getStoreByOwner = async (owner) => await StoreModule.storeByOwner(owner);
exports.findNearbyStores = async (location, radiusKm, limit) => await StoreModule.findNearby(location, radiusKm, limit);
exports.nearByStore = async (longitude, latitude) => await StoreModule.nearByStore(longitude, latitude)
exports.getAllStore = async (query, limit, skip) => await StoreModule.allStore(query, limit = 10, skip =0)

// CREATE STORE CATEGORY SECTION
exports.createStoreCategory = async (info) => categoryModule.create(info)
exports.updateStoreCategory = async (id,info) => categoryModule.update(id, info);
exports.deleteStoreCategory = async (id) => categoryModule.delete(id);
exports.getStoreCategory = async (search) => categoryModule.storeCategory(search);
exports.removeSubCategory = async (info) => categoryModule.deleteSubCategory(info)
exports.categoryExists = async (category) => await categoryModule.categoryExist(category)

// PRODUCT SECTION
exports. addNewProduct = async (schemaValidator, details) => await ProductModule.create(details);
exports.getProductsByStore = async (store) => await ProductModule.productsByStore(store);
exports.getProductsByStoreAndProdId = async (store,prodId) => await ProductModule.productsByStoreAndProId(store, prodId);
exports.getProductsByStoreId = async (storeId) => await ProductModule.productsByStoreId(storeId);
exports.getFilteredProducts = async (query) => await ProductModule.searchProductInStore(query);
exports.updateProductStatus = async (info) => await ProductModule.updateProductStatus(info);
exports.deleteProduct = async (prodId, store) => await ProductModule.removeProduct(prodId, store); 
exports.getShopperFilteredProducts = async (query) => await ProductModule.searchProductsForShopper(query)
exports.verifyProductPromoCode = async (code) => await ProductModule.verifyPromoCode(code);
exports.findDiscountCode = async (discountCode) => await ProductModule.promoCodeExist(discountCode);
exports.getStoreByProductId = (prodId) => ProductModule.storeInfoByProductId(prodId);
exports.getStorByProductIdArray = async ( prodIdArr) => await ProductModule.storeInfoByProductIdArray(prodIdArr);
exports.getStoreByProductIdSync = (prodId) =>  ProductModule.storeInfoByProductIdSync(prodId);
exports.removeSoldProductQuantity = async (prodId, storeId, qty) => await ProductModule.decreaseProductQuantity(prodId, storeId, qty);
