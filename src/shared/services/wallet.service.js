const { CONSTANTS } = require("../../config");
const { WalletHistoryModel } = require("../../models/wallet.history.model");
const { WalletModel } = require("../../models/wallet.model");

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
    try {
        return await WalletHistoryModel.create(info);
    } catch (error) {
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
        if (!wallet) {
            return { error: "Wallet not found" };
        }
        return wallet;
    } catch (error) {
        return { error: error.message || "Failed to fetch wallet balance" };
    }
}