const { CONSTANTS } = require("../../../config");
const ProductModel = require("../../../models/product.model")

exports.create =  async ( details) => {
    try{
      const product = await ProductModel.create({...details, 
        $set:{
        barcode: details.barcode
      }, $set: {
        variation: details.variation
      }, $set: {
        category: details.category
      }, $set: {
        tags: details.tags
      }
     });
      return product;
  } catch (error) {
    return {error:error.message}
  }
}
exports.productsByStore = async (store) => {
  try{
    return await ProductModel.find({store}).select("-_id -__v -store -barcode.id -barcode._id -media.mainImage.id -media.others.id").exec();
  }  catch (error) {
    return {error: error.message}
  }
}
exports.productsByStoreId = async (storeId) => {
  try{
    return await ProductModel.find({storeId}).select("-_id -__v -store").exec();
  }  catch (error) {
    return {error: error.message}
  }
}

exports.searchProductInStore = async (query) => {
  try{
    return await ProductModel.find(query).select("-_id -__v -store").exec();
  } catch (error) {
    return {error: error.message};
  }
}
exports.updateProductStatus = async (info) => {
  try{
    const findProduct = await ProductModel.findOne({prodId:info.prodId, store: info.store}).populate([{
      path: "store",
      model: "Store",
      match: {user: info.user}
    }]);
    if(!findProduct) return {error: "Product does not exist"};
    if(findProduct.status === info.status) return {error: "Product status already updated"};
    findProduct.status = info.status;
   return findProduct.save();
  } catch (error) {
    return {error: error.message};
  }
}
exports.removeProduct = async (prodId, store) => {
  try{
    return await ProductModel.findOneAndDelete({prodId, store});
  } catch (error) {
    return {error: error.message}
  }
}
exports.searchProductsForShopper = async (query) =>{
  try{
    const data = await ProductModel.find(query).populate([
     { 
      model: "Store",
      path: "store",
      select: "-_id -__v -createdAt -updatedAt -category -user",
      sort: {rating: 1, likes: 1},
      
    },
     {
        model: "Like",
        path: "likers",
        select: "userId -_id"  
       },
       {
        model: "Review",
        path: "reviews",
        select: "userId -_id"  
       },
       {
        model: "Like",
        path: "raters",
        select: "userId -_id"  
       }
    ]).sort({rating:1, likes:1}).select("-_id -__v -createdAt -updatedAt -user -status -storeId -media.mainImage.id -media.others.id").limit(20).exec();
    if( data?.length === 0){
    return  await ProductModel.find({status: CONSTANTS.CATEGORY_STATUS_OBJ.published}).populate([
        { 
         model: "Store",
         path: "store",
         select: "-_id -__v -createdAt -updatedAt -category -user ",
         sort: {rating: 1, likes: 1}
       },
       {
        model: "Like",
        path: "likers",
        select: "userId -_id"  
       },
       {
        model: "Review",
        path: "reviews",
        select: "userId -_id"  
       },
       {
        model: "Like",
        path: "raters",
        select: "userId -_id"  
       }
        
       ]).sort({rating:1, likes:1}).select("-_id -__v -createdAt -updatedAt -user -status -storeId -media.mainImage.id -media.others.id").limit(20).exec();
    }
    return data;
  } catch (error) {
    return {error : error.message};
  }
}

exports.verifyPromoCode = async (discountCode) => {
  try {
    return await ProductModel.findOne({"pricing.discountCode": discountCode, quantity:{$gt:0}}).select("pricing prodId price storeId name -_id");

  } catch (error) {
    return {error: error.message};
  }
}
exports.promoCodeExist = async (discountCode) => {
  try {
    return await ProductModel.findOne({"pricing.discountCode": discountCode});
  } catch (error) {
    return {error: error.message };
  }
}
exports.storeInfoByProductId = async (prodId) => {
  try {
     return  await ProductModel.findOne({prodId,status: CONSTANTS.CATEGORY_STATUS_OBJ.published}).populate([
        { 
         model: "Store",
         path: "store",
         select: "-_id -__v -createdAt -updatedAt -category -user "
       }
       ]) 
  } catch (error){
    return {error: error.message}
  }
}
exports.storeInfoByProductIdSync = async (prodId) => {
  try {
     return  await ProductModel.findOne({prodId,status: CONSTANTS.CATEGORY_STATUS_OBJ.published}).populate([
        { 
         model: "Store",
         path: "store",
         select: "-_id -__v -createdAt -updatedAt -category -user "
       }
       ]) 
  } catch (error){
    return {error: error.message}
  }
}
exports.storeInfoByProductIdArray = async (prodIdArr) => {
  try {
     return  await ProductModel.find({prodId:{$in:prodIdArr},status: CONSTANTS.CATEGORY_STATUS_OBJ.published}).populate([
        { 
         model: "Store",
         path: "store",
         select: "-_id -__v -createdAt -updatedAt -category -user "
       }
       ]) 
  } catch (error){
    return {error: error.message}
  }
}

exports.decreaseProductQuantity = async (prodId, storeId, quantity) => {
  try{
    return await ProductModel.findOneAndUpdate(
      { prodId, storeId },
      { $inc: { quantity: -quantity } },
      { new: true }
    );
  } catch (error) {
    return {error: error.message}
  }
}