const AccountModel = require("../../models/account.model");
const TemporalAccountModel = require ("../../models/temporal.account.model");

exports.registerTempAccount = async (details) => {
  try {
    const exist = await AccountModel.findOne({email:details.email});
    if(exist && !exist.mFA) return {error:"Account already exist", data:exist}
     await this.findTemAccount(details.email);
    const save = await TemporalAccountModel.create({...details});
    if (!save)
      return {error: "Account registration failed, try again"};
    return save;
  } catch (error) {
    return {error};
  }
};

exports.findTemAccount = async (email) => {
  try{
    return await TemporalAccountModel.findOneAndDelete({email});
  }catch(error){
    return {error};
  }
}
exports.findTemAccountByToken = async (refreshToken) => {
  try{
    return await TemporalAccountModel.findOne({refreshToken});
  }catch(error){
    return {error};
  }
}

exports.findUser = async (info) => {
  try{
    let data;
    if(info?.email) data = await AccountModel.findOne({email:info.email}).exec();
    if(data) data.field = info.email;
    if(!data && info?.phoneNumber){ data =  await AccountModel.findOne({phoneNumber:info.phoneNumber}).exec()
   if(data) data.field = info.phoneNumber;}
    
    return data;
  }catch(error){
    return [error];
  }
}
exports.findUserByEmail = async (email) => {
  try{
     return await AccountModel.findOne({email}).select("-picture.id -likers -raters -reviews").exec();
    
  }catch(error){
    return [error];
  }
}
exports.findUserByToken = async (refreshToken) => {
  try{
     return await AccountModel.findOne({refreshToken}).select("-picture.id -likers -raters -reviews").exec();
  }catch(error){
    throw new Error(error);
  }
}
exports.findByRole = async (type) => {
  try{
    return await TemporalAccountModel.findOne({type});
  }catch(error){
    return {error};
  }
}
exports.findUserById = async (id) => {
  try{
     return await AccountModel.findOne({_id:id}).select("-picture.id -likers -raters -reviews").exec();
  }catch(error){
    throw new Error(error);
  }
}
 
exports.create2FA_OTP = async (details) => {
  try {
    const exist = await TemporalAccountModel.findOne({email:details.email});
    if(exist) return await TemporalAccountModel.findOneAndUpdate({email:details.email},{...details});
   const  save = await TemporalAccountModel.create({...details});
    if (!save)
      return {error: "2FA OTP failed to create"};
    return save;
  } catch (error) {
    return {error};
  }
};
exports.recoveryTempInfo = async (details) => {
  try { 
    await TemporalAccountModel.findOneAndDelete({email:details.email});
    const save = await TemporalAccountModel.create({...details});
    if (!save)
      return {error: "Account recovery failed, try again"};
    return save;
  } catch (error) {
    return {error};
  }
};
exports.createOrderOTP = async (details) => {
  try{

    await TemporalAccountModel.findOneAndDelete({email: details.email});
    return await TemporalAccountModel.create({...details});
  } catch (error) {
    return {error: error.message };
  }
}
exports.orderOTP = async (details) => {
  try{
    await TemporalAccountModel.findOneAndDelete({email: details.email, refreshToken: details.refreshToken});
    
  } catch (error) {
    return {error: error.message };
  }
}
exports.findUserByCustomId = async (userId) => {
  try{
     return await AccountModel.findOne({userId}).exec();
  }catch(error){
    throw new Error(error);
  }
}