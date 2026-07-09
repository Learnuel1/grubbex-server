const { CONSTANTS } = require("../../config");
const TemporalTransactionModel = require("../../models/temporal.transaction");
const { WalletHistoryModel } = require("../../models/wallet.history.model");
const { WalletModel } = require("../../models/wallet.model");
const mongoose = require('mongoose');

exports.adminWalletUpdate = async (info) => {
    try {
        const wallet = await WalletModel.create({...info});
        return wallet;
    } catch (error) {
        return { error: error.message || "Failed to update wallet" };
    }
}
exports.walletUpdate = async (info) => {
    try {
            return await WalletModel.findOneAndUpdate(
                { user: info.user },
                 { ...info },
                { returnOriginal:false}
            ).exec();
        
    } catch (error) {
        return { error: error.message || "Failed to update store wallet" };
    }
}
exports.newTransactionHistory = async (info) => {
   
    const session = await mongoose.startSession();
   session.startTransaction()
    try {
        const {reference} = info;
        const history = await WalletHistoryModel.create([info], { session });
       
    // 2. Delete the temporary transaction
    if(reference){
    const deleted = await TemporalTransactionModel.findOneAndDelete(
      { reference },
      { session }
    ); 
    if (!deleted)  throw new Error("Temporal Transaction reference was not found");
 }
    await session.commitTransaction();
    session.endSession();
       return history;
    } catch (error) {
        await session.abortTransaction();
         session.endSession();
        return { error: error.message || "Failed to create transaction history" };
    }
}
exports.adminTransactionHistory = async (info) => {
    const session = await mongoose.startSession();
   session.startTransaction()
    try { 
        const history = await WalletHistoryModel.create([info], { session });

    await session.commitTransaction();
    session.endSession(); 
    return history;
    } catch (error) {
        console.log(error)
        await session.abortTransaction();
         session.endSession();
        return { error: error.message || "Failed to create transaction history" };
    }
}
exports.walletHistory = async (user) => {
    try {
        return await WalletHistoryModel.find({ user: user })
            .sort({ createdAt: -1 }).select("-_id -__v -user")
            .populate("user", "name email")
            .exec();
    } catch (error) {
        return { error: error.message || "Failed to fetch wallet history" };
    }
}

exports.walletHistoryByDateRange = async (user, startDate, endDate) => {
    try {
        const query = {
            user: user,
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        return await WalletHistoryModel.find(query)
            .sort({ createdAt: -1 })
            .populate("user", "name email")
            .exec();
    } catch (error) {
        return { error: error.message || "Failed to fetch wallet history by date range" };
    }
}
exports.walletBalance = async (user) => {
    try {
        const wallet = await WalletModel.findOne({ user: user }).select("-_id -__v -user -createdAt -updatedAt");
        return wallet;
    } catch (error) {
        return { error: error.message || "Failed to fetch wallet balance" };
    }
}