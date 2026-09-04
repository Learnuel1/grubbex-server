const SavedItemModel = require("../../models/saved.item.model");

exports.save = async (info) => {
    try{
        if(info?.storeId) {
            const exist = await SavedItemModel.findOne({ storeId: info.storeId, shopperId: info.shopperId});
            if(exist) return {error: "Store has been already saved"};
        } else if(info?.prodId) {
            const exist = await SavedItemModel.findOne({ prodId: info.prodId, shopperId: info.shopperId});
            if(exist) return {error: "Product has been already saved"}; 
        }
        return await SavedItemModel.create(info);
    } catch (error) {
        return {error: error.message}
    }
}
exports.remove = async (info) => {
    try{
        if(info?.storeId) {
            const exist = await SavedItemModel.findOne({ storeId: info.storeId, shopperId: info.shopperId});
            if(!exist) return {error: "Store has not been saved"};
            return await SavedItemModel.findOneAndDelete({ storeId: info.storeId, shopperId: info.shopperId});
        } else if(info?.prodId) {
            const exist = await SavedItemModel.findOne({ prodId: info.prodId, shopperId: info.shopperId});
            if(!exist) return {error: "Product has not been saved"};
            return await SavedItemModel.findOneAndDelete({ prodId: info.prodId, shopperId: info.shopperId});
        }
    } catch (error) {
        return {error: error.message}
    }   
}

const selectedFields = "-_id -__v -createdAt -updatedAt -user -status -storeId -media.mainImage.id -media.others.id -barcode._id -barcode.id -shopper -shopperId -prodId -store";
exports.getSavedStoreItems = async (query, skip, limit) => {
    try{
        const populateOptions = [
  {
    model: "Store",
    path: "store",
    select: "-_id -__v -createdAt -updatedAt -category -user -shopper -shopperId -prodId -store -locationStatus", 
  },
   
];
const totalCount = await SavedItemModel.countDocuments(query);
        const savedItems = await SavedItemModel.find(query).skip(skip).limit(limit).populate(populateOptions).select(selectedFields).skip(skip).limit(limit).exec();
        return {savedItems, totalCount};
    } catch (error) {
        return {error: error.message}
    }
}
exports.getSavedProducts = async (query, skip, limit) => {
    try{
          const populateOptions = [
  {
    model: "Product",
    path: "product",
    select: "-_id -__v -createdAt -updatedAt -category -status -storeId -media.mainImage.id -media.others.id -barcode._id -barcode.id -shopper -shopperId -prodId -store", 
  },
   
];
        const totalCount = await SavedItemModel.countDocuments(query);
        const savedItems = await SavedItemModel.find(query).populate(populateOptions).select(selectedFields).skip(skip).limit(limit).exec();
        return {  savedItems, totalCount   };
    } catch (error) {
        return {error: error.message}
    }
}