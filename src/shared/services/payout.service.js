const { CONSTANTS } = require("../../config");
const PayoutModel = require("../../models/payout.model");

exports.create = async (info) => {
    try {
            return await PayoutModel.create({...info});
    } catch (error) {
        return {error: error.message}
    }
}
exports.getPayouts = async (status, accountType, search = null) => {
    try {
        if(search === null|| search === undefined || search === "") {
             if(!status || status.toLowerCase() === "all" ) return await PayoutModel.find({accountType}).select("-_id -__v -account -store").populate("paidBy.account", "firstName email").populate("account", "email firstName lastName phoneNumber status state picture.url -_id").populate("paidBy.account", "firstName email type role -_id").sort({createdAt: -1});

              return await PayoutModel.find({status, accountType}) .select("-_id -__v -account -store").populate("paidBy.account", "firstName email type role").sort({createdAt: -1});
        } else {
             return await PayoutModel.find(search).select("-_id -__v -account -store").populate("paidBy.account", "firstName email").populate("account", "email firstName lastName phoneNumber status state picture.url -_id").populate("paidBy.account", "firstName email type role -_id").sort({createdAt: -1});
        }
        
    } catch(error) {
        return {error: error.message }
    }
}
exports.getRecentPayouts = async (status, accountType, limit) => {
    try {
        return await PayoutModel.find({status, accountType}).select("-_id -__v -account -store").populate("paidBy.account", "firstName email type role").limit(limit).sort({updatedAt: -1});
    } catch(error) {
        return {error: error.message }
    }
}
exports.payoutAggregate = async (statuses, accountType) => {
    try {
        return await PayoutModel.aggregate([ 
            { $match: { status:{$in: statuses} } },
            { $group: { _id: "$status", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }  
        ])
    } catch (error) {
        return {error: error.message }
    }
}
exports.todayPayoutAggregate = async (status, accountType) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        return await PayoutModel.aggregate([
            { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay }, accountType, status } },
            { $group: { _id: "$status", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]);
    } catch (error) {
        return {error: error.message }
    }
}

exports.topPayouts = async (accountType, limit) => {
    try {
        if(limit === "all"){
        return await PayoutModel.aggregate([
            { $match: { accountType, status: CONSTANTS.PAYOUT_STATUS.completed } },
            { $group: { _id: "$account", totalAmount: { $sum: "$amount" }, storeName: { $first: "$store.name" } } },
            { $sort: { totalAmount: -1 } } 
        ]);
    }  
        return await PayoutModel.aggregate([
            { $match: { accountType, status: CONSTANTS.PAYOUT_STATUS.completed } },
            { $group: { _id: "$account",  totalAmount: { $sum: "$amount" },storeName: { $first: "$storeName" } } },
            { $sort: { totalAmount: -1 } },
            { $limit: limit }
        ])  ;
    } catch(error) {
        return {error: error.message }
    }
}
 