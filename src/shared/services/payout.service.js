const { default: mongoose } = require("mongoose");
const { CONSTANTS } = require("../../config");
const PayoutModel = require("../../models/payout.model");
const { WalletHistoryModel } = require("../../models/wallet.history.model");
const { WalletModel } = require("../../models/wallet.model");
const SettingModel = require("../../models/setting.model");

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

exports.payoutByID = async (id) => {
    try {
         return await PayoutModel.findOne({id}).select("-_id -__v -account -store").populate("paidBy.account", "firstName email").populate("account", "email firstName lastName phoneNumber status state picture.url -_id").populate("paidBy.account", "firstName email type role -_id").sort({createdAt: -1});

           
        
    } catch(error) {
        return {error: error.message }
    }
}
exports.processPayout = async (info) => {
    // Start a Mongoose session and begin transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const wallet = await WalletModel.findOne({ user: info.account }).session(session); 
        if (!wallet) {
            throw new Error('Wallet was not found');
        }

        // 2. Check sufficient balance
        if (wallet.balance < info.amount) {
            throw new Error('Insufficient Wallet balance');
        }

        // 3. Retrieve payout duration setting (single document)
        const setting = await SettingModel.findOne().session(session);
        if (!setting || !setting.payoutDuration || setting.payoutDuration.length === 0) {
            throw new Error('Payout duration setting is missing');
        }

        const numberOfDays = setting.payoutDuration[0].numberOfDays;
        // 4. Compute next due date (safe date arithmetic)
        const currentPayoutDate = wallet.payoutDate ? new Date(wallet.payoutDate) : new Date();
        const nextDueDate = new Date(currentPayoutDate.getTime() + numberOfDays * 24 * 60 * 60 * 1000);

        // 5. Update wallet balance and due date
        wallet.balance = wallet.balance - info.amount;
        wallet.payoutDueDate = nextDueDate;
        await wallet.save({ session });

        // 6. Update payout status
        const updatedPayout = await PayoutModel.findOneAndUpdate(
            { id: info.id },
            { status: info.status },
            { session, new: true }  // optional: return updated document
        );
        if (!updatedPayout) {
            throw new Error('Payout record not found');
        }

        // 7. Commit transaction if all operations succeeded
       
        const history = {
            reference: info.id,
            user:info.account,
            type:CONSTANTS.TRANSACTION_TYPE.withdrawal,
            currency: "NGN",
            debit: info.amount,
            status:CONSTANTS.ORDER_PAYMENT_STATUS.success,
            balanceBefore:wallet.balance,
            balanceAfter: wallet.balance - info.amount,
            description: "Payout",
            initiatedBy: info.createdBy,
            meta: info.account
        }
        await WalletHistoryModel.create([history], {session});
         await session.commitTransaction();
        session.endSession();
        // Return success (you may customise the returned object)
        return { success: true, message: 'Payout processed successfully' };

    } catch (error) { 
        await session.abortTransaction();
        session.endSession();
 
        return { error: error.message };
    }
};