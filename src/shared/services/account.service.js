const { CONSTANTS } = require("../../config");
const AccountModel = require("../../models/account.model");
const { KYCModel } = require("../../models/kyc.model");
const OrderModel = require("../../models/order.models");
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

exports.delete = async (userId, userType) => {
  try{
    const data = {};
    if( userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper){
      const exist = await AccountModel.findOne({userId}).exec();
      if(!exist) throw new Error("Account does not exist")
        data.email = exist.email;
      data.userName = exist.firstName;
      const orders = await OrderModel.countDocuments({shopperId:userId});
      data.orderCount = orders;
      return await AccountModel.deleteOne({userId});
     await OrderModel.delete({shopperId:userId});
      return data;
    } else if  (userType === CONSTANTS.ACCOUNT_TYPE_OBJ.rider){
      const exist = await AccountModel.findOne({userId}).exec();
       data.email = exist.email;
      data.userName = exist.firstName;
       const orders = await OrderModel.countDocuments({rider:userId});
      data.orderCount = orders;
      await KYCModel.deleteOne({userId});
     await AccountModel.deleteOne({userId});
     await OrderModel.delete({shopperId:userId});
     return data;
    } else if  (userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business){
      const exist = await AccountModel.findOne({userId}).exec();
       data.email = exist.email;
      data.userName = exist.firstName;
      const kyc = await KYCModel.find({userId});
      if(kyc && kyc.length > 0){
        const {store} = kyc;
        await StoreModel.deleteOne({storeId: store.storeId});
      }
      const orders = await OrderModel.countDocuments({rider:userId});
      data.orderCount = orders;
      await KYCModel.deleteOne({userId});
     await AccountModel.deleteOne({userId});
     await OrderModel.delete({shopperId:userId});
     return data;
    }
  }catch(error) {
    return {error: error.message};
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