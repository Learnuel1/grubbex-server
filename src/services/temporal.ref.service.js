const TempReferenceModel = require("../models/temp.reference.modell");

exports.create = async (details) => {
  try{
      return await TempReferenceModel.create({...details});
  }catch(error){
      return {error};
  }
}
exports.findByReference = async (reference) => {
  try{
      return await TempReferenceModel.findOne({reference}).exec();
  }catch(error){
      return {error};
  }
}
exports.deleteByReference = async (reference) => {
  try{
      return await TempReferenceModel.findOneAndDelete({reference}).exec();
  }catch(error){
      return {error};
  }
}