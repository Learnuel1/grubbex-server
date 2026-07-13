const { CONSTANTS } = require("../../config");
const logger = require("../../logger");
const { getAccountByGrubbexId } = require("../../services");
const { getWalletHistory, getWalletHistoryByDateRange, payStackPayWithCard, saveOrderOTP, createTempTransaction, walletBalance } = require("../services/interface");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");

exports.walletHistory = async (req, res, next) => {
    try {
           const page = Math.max(1, parseInt(req.query.page) || 1);          // default page = 1
        const limit = Math.max(1, parseInt(req.query.limit) || 10);       // default limit = 10
        const skip = (page - 1) * limit;
        const {data, total} = await getWalletHistory(req.user, skip, limit);
        if (data?.error)  return next(APIError.badRequest(data.error)); 
        if(!data) {
             return res.status(200).json({
            success: true,
            message: data.length === 0 ? "No transaction history" : "Wallet history fetched successfully",
            data: data,
            pagination: {
                total,
                page,
                limit,
                totalPages:0,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
        }
        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            message: data.length === 0 ? "No transaction history" : "Wallet history fetched successfully",
            data: data,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
         next(error);
    }
}
exports.walletHistoryByDateRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const page = Math.max(1, parseInt(req.query.page) || 1);          // default page = 1
        const limit = Math.max(1, parseInt(req.query.limit) || 10);       // default limit = 10
        const skip = (page - 1) * limit;
        let start, end;
        if (!startDate ) return next(APIError.badRequest("Start date is required"));
        if(!endDate) end = new Date(startDate);
        else end = new Date(endDate);
        end.setHours(23, 59, 59, 999)
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0)
        const {data, total} = await getWalletHistoryByDateRange(req.user, start, end);
        if (data?.error) return next(APIError.badRequest(data.error));
        
        if(!data) {
             return res.status(200).json({
            success: true,
            message: data.length === 0 ? "No transaction history" : "Wallet history fetched successfully",
            data: data,
            pagination: {
                total,
                page,
                limit,
                totalPages:0,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
        }
        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            message: data.length === 0 ? "No transaction history" : "Wallet history fetched successfully",
            data: data,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        next(error);
    }
}


exports.initializeWalletFundingWithPayStack = async (req, res, next ) => {
    try{
      //verify card Details
    const {cardDetails } = req.body;
    const userInfo = await getAccountByGrubbexId(req.userId);
        // const ref = paymentReference();
       
        const phoneNumber = `${userInfo.countryCode}${userInfo.phoneNumber.slice(1)}`;
    const cardPayload = {
            card_number: cardDetails.cardNumber,
            expiry_month: cardDetails.expiryDate.split("/")[0],
            expiry_year: cardDetails.expiryDate.split("/")[1],
            cvv: cardDetails.cvv,
            currency: 'NGN',
            amount: req.body.amount.toFixed(2),
            email: req.email, 
           phone_number: phoneNumber,
           paymentEventType:CONSTANTS.TRANSACTION_TYPE.funding,
           paymentType: CONSTANTS.PAYMENT_TYPE_OBJ.card,
           user: req.user,
           
  }
    
    const initializeCardCharge = await   payStackPayWithCard(cardPayload);
  
    if(initializeCardCharge?.error) return next(APIError.badRequest(initializeCardCharge.error));
    if(initializeCardCharge?.status === true) {
        // save the REFERENCE INFORMATION FOR THE CUSTOMER 
        const info = {
        user:req.user,
        email:req.email,
        refreshToken:initializeCardCharge.data.access_code,
        otp: initializeCardCharge.data.reference,
    };
     req.body.reference = initializeCardCharge.data.reference;
    // save order as draft
    req.body.status = CONSTANTS.ORDER_STATUS_OBJ.draft; 
    const createOrderOTP = await saveOrderOTP(info);
    if(!createOrderOTP) 
        return next(APIError.badRequest("Failed to create wallet OTP"));
    if(createOrderOTP?.error)
        return next(APIError.badRequest(createOrderOTP.error));
    logger.info("Wallet OTP created successfully", {service: META.ORDER});
    const tempTrans = await  createTempTransaction({id:"",reference:req.body.reference, event: CONSTANTS.TRANSACTION_TYPE.funding}) ;
    if(!tempTrans) return next(APIError.badRequest("Wallet Transaction Failed. try again"));
    if(tempTrans?.error) return next(APIError.badRequest(tempTrans.error));
     logger.info("Temporal Wallet Transaction created successfully", {service: META.PAYMENT});
        // logger.info("OTP required for payment", {service: META.PAYMENT}); 
        return res.status(200).json({
            status: "success",
            msg: initializeCardCharge.message,
           data: { 
               ...initializeCardCharge.data,
           } 
        });

    }else  return next(APIError.badRequest("Failed to create order, try again"))
       
    } catch (error ) {
        next (error);
    }
} 
exports.getWalletBalance = async (req, res, next) => {
    try {
        const wallet = await walletBalance(req.user);
        const info = {}
        if (wallet?.error) return next(APIError.badRequest(wallet.error));
        logger.info("Wallet balance fetched successfully", {service: META.WALLET});
        if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper){
        info.balance = wallet.balance;
         }else {
            info.balance = wallet.balance;
            info.pendingBalance = wallet.pendingBalance;
            info.payOutDueDate = wallet.payoutDueDate;
         }
        return res.status(200).json({ success: true, msg: "Wallet balance fetched successfully", data: info });
    } catch (error) {
        next({ error: error.message || "Failed to fetch wallet balance" });
    }
}