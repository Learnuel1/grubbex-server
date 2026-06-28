const { CONSTANTS } = require("../../config");
const AccountModel = require("../../models/account.model");
const { KYCModel } = require("../../models/kyc.model");
const { WalletModel } = require("../../models/wallet.model");
const { findTemAccount } = require("./temporal.service");

exports.registerAccount = async (details) => {
  try{
    const data = await AccountModel.create({...details});
    await findTemAccount(details.email);
    if(details.type === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper){
      details.user = data._id;
      details.onBoarded = true;
      const kyc =  await KYCModel.create({...details});
      if(!kyc) return {error: "Failed to create KYC"};
      if(kyc?.error) return {error: kyc.error};
      const wallet =  await WalletModel.create({user:data._id});
    if(!wallet) return {error: "Failed to create wallet"};
    if(wallet?.error) return {error: wallet.error};
    }
    if(details.type === CONSTANTS.ACCOUNT_ROLE_OBJ.super || details.type === CONSTANTS.ACCOUNT_ROLE_OBJ.rider || details.type === CONSTANTS.ACCOUNT_ROLE_OBJ.business){
    const wallet =  await WalletModel.create({user:data._id});
    if(!wallet) return {error: "Failed to create wallet"};
    if(wallet?.error) return {error: wallet.error};
    }
    return data;
  }catch(error){
    if(error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return { error:`An account with same ${field} already exist`}}
    return {error};
  }
}

exports.delete = async (userId) => {
  try{
    console.log(userId)
      const exist = await AccountModel.findOne({userId}).exec();
      if(!exist) throw new Error("Account does not exist")
      return await AccountModel.deleteOne({userId});
  }catch(error) {
    throw {error};
  }
}

exports.mFA_status = async (id, status) => {
  try{
    return await AccountModel.findOneAndUpdate({userId:id}, {mFA:status}, {returnOriginal: false});
  } catch(error) {
    return {error};
  }
}

exports.admins = async (search) => {
  try {
    return await AccountModel.find(search).select("-_id -password -refreshToken -__v");
  } catch (error) {
    return {error}
  }
}