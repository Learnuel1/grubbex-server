const { default: mongoose } = require("mongoose"); 
const { CONSTANTS } = require("../config");
const AccountModel = require("../models/account.model");
const { KYCModel } = require("../models/kyc.model");
const RecoveryLinkModel = require("../models/recovery.model");
const TemporalAccountModel = require("../models/temporal.account.model"); 
const { WalletModel } = require("../models/wallet.model");
const { ACTIONS } = require("../utils/actions"); 

exports.register = async (details) => {
  try {
    const user = await AccountModel.create({...details});
      await WalletModel.create({user:user._id, balance:0});
      if(details.role.toLowerCase() === CONSTANTS.ACCOUNT_TYPE[2].toLowerCase()){
        await KYCModel.create({ user: user._id});
      }
      return user
  } catch (error) { 
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.registerTempAccount = async (details) => {
  try {
    const save = await TemporalAccountModel.create({...details});
    if (!save)
      return {error: "Account registration failed, try again"};
    return save;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.temporalUser = async (email) => {
  try {
    const temp = await TemporalAccountModel.findOne({ email }).exec();
    if (!temp) return temp;
    let exist = temp.refreshToken.find((item) => item === token);
    if (exist) {
      return exist = temp;
    }
    return temp;
  } catch (error) {
    return {error};
  }
};
exports.updateTempToken = async (info) => {
  try {
    const temp = await TemporalAccountModel.findByIdAndUpdate({_id:info.id}, {otp:info.otp});
    if (!temp) return {error: "Token does not exist"};
    temp.refreshToken.push(info.refreshToken);
    temp.save();
    return temp;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.deleteTempToken = async (info) => {
  try {
    const temp = await TemporalAccountModel.findByIdAndUpdate({_id:info.id});
    if (!temp) return {error: "Token does not exist"};
    const exist = temp.refreshToken.filter((item)=>item !== info.refreshToken);
    temp.refreshToken = [...exist];
    temp.save();
    return temp;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.updateTempOtp = async (id, info) => {
  try {
    const exist = await TemporalAccountModel.findOneAndUpdate({_id: id}, {otp:info.otp}, {returnOriginal:false});
    if (!exist) return {error: "Token does not exist"};
    exist.refreshToken = [info.refreshToken];
    exist.save();
    return exist;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.removeTempAccount = async (id) => {
  try {
    return await TemporalAccountModel.findOneAndDelete({email:email});
  } catch (error) {
    return {error};
  }
};
exports.defaultRegistration = async (details) => {
  try {
    const check = await AccountModel.findOne({role:CONSTANTS.ACCOUNT_TYPE[1]});
    if (check)
      return {error: `${CONSTANTS.ACCOUNT_TYPE[1]} account already exist`};
    return await AccountModel.create({...details});
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.create = async (details) => {
  try {
    return await AccountModel.create({...details});
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.checkEmail = async (email) => {
  try {
   return await AccountModel.findOne({email:email}).exec(); 
  } catch (error) {
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
}
};
exports.checkUsername = async (username) => {
  try {
    let exist = await TemporalAccountModel.findOne({username});
    if (exist) {
      exist.register = ACTIONS.INCOMPLETE_REG;
      return exist;
    } else {
      exist = await AccountModel.findOne({username});
      return exist;
    } 
  } catch (error) {
    return {error};
  }
};
exports.checkById = async (id) => {
  try {
    const temp = await TemporalAccountModel.findOne({_id:id});
    if (temp) {
      return temp;
    } else {
      return await AccountModel.findOne({_id:id});
    }
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.checkByEmail = async ( email) => {
  try {
    return await AccountModel.findOne({email});
  } catch (error) {
    return {error};
  }
};
exports.phoneNumberExist = async (phoneNumber) => {
  try {
    return await AccountModel.findOne({phoneNumber});
  } catch (error) {
    return {error};
  }
};

exports.logOut = async (id) => {
  try {
    const logout = await AccountModel.findByIdAndUpdate({_id:id});
    logout.refreshToken = [];
    logout.save();
    return logout;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.updateToken = async (id, refreshToken, token) => {
  try {
    const userInfo = await AccountModel.findByIdAndUpdate({_id:id});
    const existingToken = userInfo.refreshToken.filter(rt => rt !== token);
    userInfo.refreshToken = [...existingToken, refreshToken];
    userInfo.save();
    return userInfo;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};

exports.userAccounts = async (search) => {
  try {
    return await AccountModel.find(search).select("-_id -password -refreshToken -__v");
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.removeAccount = async (email) => {
  try {
    return await AccountModel.findOneAndDelete({email}).exec();
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.passwordRecoveryInfo = async (info) =>{
  try {
    await RecoveryLinkModel.deleteOne({user:info.userId});
    return await RecoveryLinkModel.create({...info});
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.getRecoveryInfo = async (user) =>{
  try {
    return await RecoveryLinkModel.findOne({user});
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.getRecoveryInfoByRef = async (uniqueString) =>{
  try {
    return await RecoveryLinkModel.findOne({uniqueString});
  } catch (error) {
    return {error};
  }
};
exports.deleteRecoveryInfo = async (id) =>{
  try {
   let remove = await RecoveryLinkModel.findByIdAndDelete({_id:id});
   if(!remove) remove = await TemporalAccountModel.findByIdAndDelete({_id:id});
   return remove;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
 
exports.updatePassword = async (id, password) => {
  try {
    return await AccountModel.findByIdAndUpdate({_id:id}, {password, refreshToken:[]});
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
      return  {error:'Invalid account ID format'} ;
   }
    return {error};
  }
};
exports.updateAccount = async (id, details) => {
  try {
    return await AccountModel.findOneAndUpdate({userId:id}, {...details},  {returnOriginal: false});
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.kind === 'ObjectId') {
     return  {error:'Invalid account ID format'} ;
  }
    return {error};
  }
};

exports.getAdmin = async () =>{
  try {
    return await AccountModel.find({type: CONSTANTS.ACCOUNT_TYPE[1]}).exec();
  } catch (error) {
    return {error};
  }
};

exports.updateProfile = async (id, details) => {
  try{
    return await AccountModel.findByIdAndUpdate({_id:id}, {...details}, {returnOriginal: false}).exec();
  }catch(error){
    return {error};
  }
}


exports.imageExist = async (id) =>{
  return AccountModel.findOne({_id: id}, {imageId:1, imageUrl:1}).exec();
}
exports.profile = async (id) => {
  try{
    return await AccountModel.findById({_id:id}).select("-_id -__v -password -refreshToken -createdAt -updatedAt -picture.id -picture._id -likers -raters -reviews").exec();
  }catch(error){
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
  }
}
exports.getAccountByGrubbexId = async (id) => {
  try{
    return await AccountModel.findOne({userId:id}).select("-__v -password -refreshToken -createdAt -updatedAt").exec();
  } catch(error){
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
  }
}
exports.getAccountsForChat = async (senderInfo) => {
  try{
      if(senderInfo.type === CONSTANTS.ACCOUNT_TYPE_OBJ.admin || senderInfo.type === CONSTANTS.ACCOUNT_TYPE_OBJ.dev){
        return await AccountModel.find({}).select("userId firstName lastName picture").exec();
      }else{

      }
  } catch (error) {
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
  }
}
exports.updateContact= async ( _id, phoneNumber) => {
  try{
        return await AccountModel.findByIdAndUpdate({_id}, {phoneNumber});
  } catch (error) {
    if(error.name === "ValidationError" || error.name === "CastError") return {error: "Invalid data"};
    return {error};
  }
}