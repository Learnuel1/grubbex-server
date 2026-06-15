const { CONSTANTS } = require("../../config");
const logger = require("../../logger");
const { walletBalance, createPayout, getPayouts, getRecentPayouts, getPayoutsAggregate, getTodayPayoutsAggregate, topPayouts } = require("../services/interface");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");
const Notification = require("../utils/Notification");

exports.createPayout = async (req, res, next) => {
    try{
        const { amount } = req.body;
        const wallet = await walletBalance(req.user);
        if(wallet.error) return next(APIError.badRequest(wallet.error));
       if(wallet.balance < amount) return next(APIError.badRequest("Insufficient wallet balance for payout"));
       
        const payout = await createPayout(req.body);
        if(!payout) return next(APIError.badRequest("Payout failed, try again "));
        if(payout.error) return next(APIError.badRequest(payout.error));
        logger.info("Payout request completed successfully", {service: META.PAYOUT});
        // send notification
         
        const notifyPayload = {
            userId: req.userId,
            account: req.user,
            title: "Payout Request Completed",
            category:CONSTANTS.NOTIFICATION_TYPE_OBJ.transaction,
            info: `Your payout request of amount ${amount} has been submitted successfully`
        };
        const notice = new Notification();
        notice.emit("notify", notifyPayload) 
        res.status(201).json({ msg: "Payout request completed successfully" });
    } catch (error) {
        next (error) ;
    }
}
exports.getPayouts = async (req, res, next) => {
    try {
        let { status, type, search} = req.query;
        query = {};
        if(!type) return next(APIError.badRequest("Payout type is required"));
        if(!status) return next(APIError.badRequest("Payout status is required"));
        type = type?.toLowerCase() === "store" ? CONSTANTS.ACCOUNT_TYPE_OBJ.business : type;
        if(!CONSTANTS.ACCOUNT_TYPE.includes(type)) return next(APIError.badRequest("Invalid payout type"));
        if(status.toLowerCase() !=="all")
            if(status && !Array.from(Object.values( CONSTANTS.PAYOUT_STATUS)).includes(status)) return next(APIError.badRequest("Invalid payout status"));
        if(search) {
            query = {
                $and: [ {status}, {accountType: type} ],
                $or: [
                {"account.firstName": { $regex: search, $options: "i" }},
                {"account.lastName": { $regex: search, $options: "i" }},
                {"account.email": { $regex: search, $options: "i" }}, 
            ]
        }
        }
        const payouts = await getPayouts(status, type, query);
        if(payouts?.error) return next(APIError.badRequest(payouts.error));
        logger.info("Payouts retrieved successfully", {service:META.PAYOUT})
        res.status(200).json({ msg: "Payouts retrieved successfully", data: payouts });
    } catch (error ) {
        next(error);
    }
}
exports.recentPayouts = async (req, res, next) => {
    try {
          let {type, limit} = req.query;
        if(!type) return next(APIError.badRequest("Payout type is required")); 
        type = type?.toLowerCase() === "store" ? CONSTANTS.ACCOUNT_TYPE_OBJ.business : type;
        if(!CONSTANTS.ACCOUNT_TYPE.includes(type)) return next(APIError.badRequest("Invalid payout type"));
        limit = limit ? parseInt(limit) : 5;
        const payouts = await getRecentPayouts(CONSTANTS.PAYOUT_STATUS.completed, req.user.accountType, limit);
        if(payouts?.error) return next(APIError.badRequest(payouts.error));
        logger.info("Recent payouts retrieved successfully", {service:META.PAYOUT})
        res.status(200).json({ msg: "Recent payouts retrieved successfully", data: payouts });

    } catch (error) {
        next(error);
    }
}
exports.payoutsAggregate = async (req, res, next) => {
    try {
        const {type} = req.query;
        if(!type) return next(APIError.badRequest("Payout type is required")); 
        const accountType = type?.toLowerCase() === "store" ? CONSTANTS.ACCOUNT_TYPE_OBJ.business : type;
        if(!CONSTANTS.ACCOUNT_TYPE.includes(accountType)) return next(APIError.badRequest("Invalid payout type"));

        const statuses = [
        CONSTANTS.PAYOUT_STATUS.pending,
         CONSTANTS.PAYOUT_STATUS.processing,
         CONSTANTS.PAYOUT_STATUS.completed,
            ]; 
            const aggregateData = await getPayoutsAggregate(statuses, accountType);
            if(aggregateData?.error) return next(APIError.badRequest(aggregateData.error));
            logger.info("Payout aggregate data retrieved successfully", {service:META.PAYOUT})
            // Transform the aggregate data to include status and totalAmount
            const transformedData = aggregateData.map(item => ({
                status: item._id,
                totalAmount: item.totalAmount,
                count: item.count
            }));
            const todayPayout  = await getTodayPayoutsAggregate(CONSTANTS.PAYOUT_STATUS.completed, accountType);
            if(todayPayout?.error) return next(APIError.badRequest(todayPayout.error)); 
            const today = todayPayout.length > 0 ? todayPayout[0] : {status: CONSTANTS.PAYOUT_STATUS.completed, totalAmount: 0, count: 0};
            res.status(200).json({ msg: "Payout aggregate data retrieved successfully", data: transformedData, todayPayout: {status: today._id, totalAmount: today.totalAmount } });
    } catch (error) {
        next(error);
    }
}
exports.getTopPayouts = async (req, res, next) => {
    try {
        let {type, limit} = req.query;
        if(!type) return next(APIError.badRequest("Payout type is required"));
        type = type?.toLowerCase() === "store" ? CONSTANTS.ACCOUNT_TYPE_OBJ.business : type;
        if(!CONSTANTS.ACCOUNT_TYPE.includes(type)) return next(APIError.badRequest("Invalid payout type"));
        if(limit && limit.toLowerCase() !== "all" && isNaN(parseInt(limit))) return next(APIError.badRequest("Invalid limit value"));
        if(limit && limit.toLowerCase() !== "all")
            limit = limit ? parseInt(limit) : 5;
        const payouts = await topPayouts(type, limit);
        // remove _id field
        const formattedPayouts = payouts.map(payout => ({ 
            totalAmount: payout.totalAmount,
            storeName: payout.storeName
        }));
        if(payouts?.error) return next(APIError.badRequest(payouts.error));
        logger.info("Top payouts retrieved successfully", {service:META.PAYOUT})
        res.status(200).json({ msg: "Top payouts retrieved successfully", data: formattedPayouts });
    } catch (error ) {
        next(error);
    }
}