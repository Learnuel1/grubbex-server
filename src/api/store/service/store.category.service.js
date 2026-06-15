const StoreCategoryModel = require("../../../models/store.category");

exports.create = async (info) => {
  try {
    if(info?.parentId) {
      const exist = await StoreCategoryModel.findOne({id: info.parentId});
      if(!exist || exist === null) return {error: "Store category does not exist"}
      delete info.parentId;
      const {name, description} = info
      const subExists = exist.subCategory.find(sub => sub.name.toLowerCase() === info.name.toLowerCase());
      if(subExists) return {error: `${info.name} sub-category already exist`}
      exist.subCategory.push({name, description});
      return exist.save();
    }else{
      const storeCategoryExist = await StoreCategoryModel.findOne({name:info.name});
      if(storeCategoryExist) throw new Error(`Store category: ${info.name} already exist`);
      return await StoreCategoryModel.create({...info, $set:{
        image: info.image
      }});
    }
  } catch (error) {
    return {error}
  }
}
exports.update = async (id, info) => {
  try {
     return await StoreCategoryModel.findOneAndUpdate({id:id}, {...info}, {returnOriginal:false});
    
  } catch (error) {
    return  {error}
  }
}
exports.delete = async (id) => {
  try {
      return await StoreCategoryModel.findOneAndDelete({id})
  } catch (error) {
    return {error}
  }
}

exports.storeCategory = async (search) => {
  try {
    return await StoreCategoryModel.find(search).select("-__v -_id -createdBy._id -image.id")
  } catch (error) {
    return {error}
  }
}

exports.deleteSubCategory = async (info) => {
  try {
      const exist = await StoreCategoryModel.findOne({id: info.parentId, "subCategory.name": info.name});
      if(!exist || exist === null) return {error: "Store subcategory does not exist"}
     const otherSubcategory = exist.subCategory.filter(x => x.name !== info.name);
      exist.subCategory= otherSubcategory;
      return exist.save();
    
  } catch (error) {
    return {error}
  }
}
exports.categoryExist = async (category) => {
  try{
     return await StoreCategoryModel.findOne({name: new RegExp(category, 'i')});
  } catch (error) {
    return {error: error.message}
  }
}

