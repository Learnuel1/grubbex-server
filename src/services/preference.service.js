const PreferenceModel = require("../models/preference.model");
const StoreCategoryModel = require("../models/store.category");

exports.createCategory = async (info) => {
  try {
    const regEx = new RegExp(info.category.join('|'), 'i');
    const categoryExist = await StoreCategoryModel.find({name: regEx });
    if(!categoryExist) return {error: "Select preference category does not exist"};
    if(categoryExist.length !== info.category.length && info.category.length !== 0) return {error: "A select preference does not exist"}
    const findPreference = await PreferenceModel.findOne({account: info.account});
    if(!findPreference){
      return await PreferenceModel.create({...info, $set:{
        category: info.preference
      }})
    }else{
      const {category} = findPreference;
      const newCategory = [];
      info.category.forEach((cur) => {
        if(!category.includes(cur)) newCategory.push(cur)
      });
    if(newCategory.length === 0) return {error: `Preference: ${info.category} already exist`}
    category.push(...newCategory);
    return await PreferenceModel.findOneAndUpdate({account: info.account}, {
      $set: {
        category: category
      }
    })
    }
  } catch (error) {
    return {error}
  }
}

exports.getCategory = async (account) => {
  try {
      return await PreferenceModel.findOne({account}).select("-_id -__v -createdAt -updatedAt -account");
  } catch (error) {
    return {error}
  }
}