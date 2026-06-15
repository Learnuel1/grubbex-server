const ItemModel = require("../models/item.model");
const {  default: mongoose } = require("mongoose");

exports.create = async (info) => {
  try {
    return await ItemModel.create({...info});
  } catch (error) {
    if(error instanceof mongoose.Error) return{error:"Invalid data format"}
    if (error.name === 'MongoServerError') { 
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return {error: `'${value}' already exist`}
    }
     return {error}
  }
};
exports.update = async (id, info) => {
  try {
    const exist = await ItemModel.findOne({_id:id}).exec();
    if(!exist) return {error: "item does not exist"};
    return await ItemModel.updateOne({_id:exist._id}, {...info}, {returnOriginal:false}).exec();
  } catch (error) {
    if(error instanceof mongoose.Error) return{error:"Invalid data format"}
    if (error.name === 'MongoServerError') { 
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return {error: `'${value}' already exist`}
    }
    return {error};
  }
}
exports.remove = async (id) => {
  try {
    const exist = await ItemModel.findOne({_id:id}).exec();
    if(!exist) return {error: "item does not exist"};
    return await ItemModel.findByIdAndDelete({_id:exist._id}).exec();
  } catch (error) {
     if(error instanceof mongoose.Error)
      return{error:"Invalid data format"}
      if (error.name === 'CastError')
      return{error:"Invalid itemId format"}
    return {error};
  }
}
exports.items = async () => {
  try {
    return await ItemModel.find({}).select("-__v").exec();
  } catch (error) {
  return {error}     
  }
} 
exports.itemById = async (id) => {
  try {
    return await ItemModel.findById({_id:id}).select("-__v").exec();
  } catch (error) {
     if(error instanceof mongoose.Error)
      return{error:"Invalid data format"}
      if (error.name === 'CastError')
      return{error:"Invalid itemId format"}
    return {error};
  }
} 
exports.itemsByCategory = async (category) => {
  try {
    return await ItemModel.find({category: { $regex: category, $options: 'i' }}).select("-__v").exec();
  } catch (error) { 
     if(error instanceof mongoose.Error)
      return{error:"Invalid data format"}
      if (error.name === 'CastError')
      return{error:"Invalid itemId format"}
    return {error};
  }
} 