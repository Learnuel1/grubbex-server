const { CONSTANTS } = require("../../config");
const AccountModel = require("../../models/account.model");
const { KYCModel } = require("../../models/kyc.model");
const OrderModel = require("../../models/order.models");
const StoreModel = require("../../models/store.model");
const { WalletModel } = require("../../models/wallet.model");
const { findTemAccount } = require("./temporal.service");
const mongoose = require('mongoose'); 
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

// exports.delete = async (userId, userType) => {
//   try{
//     const data = {};
//     if( userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper){
//       const exist = await AccountModel.findOne({userId}).exec();
//       if(!exist) throw new Error("Account does not exist")
//         data.email = exist.email;
//       data.userName = exist.firstName;
//       const orders = await OrderModel.countDocuments({shopperId:userId});
//       data.orderCount = orders;
//       return await AccountModel.deleteOne({userId});
//      await OrderModel.delete({shopperId:userId});
//       return data;
//     } else if  (userType === CONSTANTS.ACCOUNT_TYPE_OBJ.rider){
//       const exist = await AccountModel.findOne({userId}).exec();
//        data.email = exist.email;
//       data.userName = exist.firstName;
//        const orders = await OrderModel.countDocuments({rider:userId});
//       data.orderCount = orders;
//       await KYCModel.deleteOne({userId});
//      await AccountModel.deleteOne({userId});
//      await OrderModel.delete({shopperId:userId});
//      return data;
//     } else if  (userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business){
//       const exist = await AccountModel.findOne({userId}).exec();
//        data.email = exist.email;
//       data.userName = exist.firstName;
//       const kyc = await KYCModel.find({userId});
//       if(kyc && kyc.length > 0){
//         const {store} = kyc;
//         await StoreModel.deleteOne({storeId: store.storeId});
//       }
//       const orders = await OrderModel.countDocuments({rider:userId});
//       data.orderCount = orders;
//       await KYCModel.deleteOne({userId});
//      await AccountModel.deleteOne({userId});
//      await OrderModel.delete({shopperId:userId});
//      return data;
//     }
//   }catch(error) {
//     return {error: error.message};
//   }
// }

exports.mFA_status = async (id, status) => {
  try{
    return await AccountModel.findOneAndUpdate({userId:id}, {mFA:status}, {returnOriginal: false});
  } catch(error) {
    return {error};
  }
}


exports.delete = async (userId, userType) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let data = {};

    if (userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper) {
      // 1. Find the account
      const account = await AccountModel.findOne({ userId }).session(session);
      if (!account) throw new Error('Account does not exist');

      data.email = account.email;
      data.userName = account.firstName;
      data.orderCount = await OrderModel.countDocuments({ shopperId: userId }).session(session);

      // 2. Delete account
      await AccountModel.deleteOne({ userId }).session(session);

      // 3. Delete orders (optional – you might want to keep order history anonymized)
      // await OrderModel.deleteMany({ shopperId: userId }).session(session);

      // 4. Commit transaction
      await session.commitTransaction();
      session.endSession();
      return data;
    }

    else if (userType === CONSTANTS.ACCOUNT_TYPE_OBJ.rider) {
      const account = await AccountModel.findOne({ userId }).session(session);
      if (!account) throw new Error('Account does not exist');

      data.email = account.email;
      data.userName = account.firstName;
      data.orderCount = await OrderModel.countDocuments({ rider: userId }).session(session);

      // Delete KYC
      await KYCModel.deleteOne({ userId }).session(session);
       // delete wallet 
      await WalletModel.deleteOne({user:account._id}).session(session);
      // Delete account
      await AccountModel.deleteOne({ userId }).session(session);
      // Delete associated orders (if any)
      await OrderModel.deleteMany({ rider: userId }).session(session);

      await session.commitTransaction();
      session.endSession();
      return data;
    }

    else if (userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business) {
      const account = await AccountModel.findOne({ userId }).session(session);
      if (!account) throw new Error('Account does not exist');

      data.email = account.email;
      data.userName = account.firstName;
      // get store
      const store = await StoreModel.findOne({user:account._id});
      const activeOrders = await OrderModel.find({storeId:store.storeId, storeStatus:{$ne: CONSTANTS.ORDER_STATUS_OBJ.completed}}).session(session);
      if(activeOrders && activeOrders.length > 0) throw new Error("You have an active Order");
      data.orderCount = await OrderModel.countDocuments({ storeId: store.storeId }).session(session);

      // Find KYC record(s) – assuming one KYC per business
      const kyc = await KYCModel.findOne({ userId }).session(session);
      if (kyc && kyc.storeId) {
        // Delete associated store
         await KYCModel.deleteOne({ userId }).session(session);
        }
        await StoreModel.deleteOne({ storeId: store.storeId }).session(session);
      // delete wallet 
      await WalletModel.deleteOne({user:account._id}).session(session);
      // Delete account
      await AccountModel.deleteOne({ userId }).session(session);
      // Delete orders (if any)
      await OrderModel.deleteMany({ shopperId: userId }).session(session);

      await session.commitTransaction();
      session.endSession();
      return data;
    }

    else {
      throw new Error('Invalid user type');
    }

  } catch (error) {
    // Rollback transaction on any error
    await session.abortTransaction();
    session.endSession(); 
    return { error: error.message };
  }
};

exports.admins = async (search) => {
  try {
    return await AccountModel.find(search).select("-_id -password -refreshToken -__v");
  } catch (error) {
    return {error}
  }
}