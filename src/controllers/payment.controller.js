const Transactions = require("flutterwave-node-v3/lib/rave.transactions");
const { FLW_SECRET_HASH } = require("../config/env");
const logger = require("../logger");
const { getUserById, getBookingById, payment, fundWallet, getWalletBalance, bookingStatus, updateWalletHistory, updateBooking } = require("../services");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");
const { flutterOptions } = require("../utils/flutterwave.auth");
const Flutterwave = require('flutterwave-node-v3');
const { paymentReference } = require("../utils/validation");
const config = require("../config/env");
const request = require('request');
const resBuilder = require("../utils/responseBuilder");
const { CONSTANTS } = require("../config");
const { flutterwave } = require("../shared/utils/flutterwave.auth");
const { payStackBankList, resolveBankAccount, resolveBVN, getTransferStatus } = require("../shared/services/paystack.payment.services");
exports.verify =  async (req, res, next) => {
  try{

  if (req.body.status === 'successful') {
    
      const transactionDetails = await Transactions.find({ref: req.body.tx_ref});
      const response = await flutterwave.Transaction.verify({id: req.body.transaction_id});
      if (
          response.data.status === "successful"
          && response.data.amount === transactionDetails.amount
          && response.data.currency === "NGN") {
          // Success! Confirm the customer's payment
          //update database,
          logger.info("Payment verified successfully", {service: META.FLUTTER_WAVE_SERVICE})
          const update = await updateBooking(req.tx_ref);
          if(!update) return next(APIError.badRequest("Payment was hacked"));
            if(update.error) return next(APIError.badRequest(update.error));
          logger.info("Booking updated successfully", {service: META.BOOKING})
            res.status(200).json({success: true, msg: "Payment Verified Successfully"})
      } else {
          // Inform the customer their payment was unsuccessful
          return next(APIError.customError("Payment failed, try again", 400))
      }
      }
      
      }catch(error){
        next(error)
      }
  }
// exports.checkout = async (req, res, next) => {
//   try{
//     const {bookId} = req.body;
//     if(!bookId) return next(APIError.badRequest("Book ID is required"));
//     // if(!amount) return next(APIError.badRequest("Amount to pay is required"));
//     // if(isNaN(amount)) return next(APIError.badRequest("Amount is invalid"));
//     // bookId exist
//     const bookingExist = await getBookingById(bookId);
//     if(!bookingExist) return next(APIError.notFound("Booking not Found"));
//     if(bookingExist.error) return next(APIError.badRequest(bookingExist.error));
//     if(bookingExist.user.toString() !== req.userId) return next(APIError.unauthorized())
//     logger.info("Booking found", {service: META.PAYMENT});
//     const user = await getUserById(req.userId);
//     const info = {
//       email: user.email,
//       contact: user.phone,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       id: req.userId,
//       eventType: "checkout",
//       bookId,
//       muvaId: bookingExist.muva,
//     }
//     // const paymentUrl = await getPaymentUrl(info, amount, bookId);
//     // if(paymentUrl.error) return next(APIError.badRequest(payment.error));
//     const ref = paymentReference();
//     logger.info("Payment reference generated successfully", {service:META.PAYMENT})
//     return  res.status(200).json({success: true, ref: ref, msg: "Transaction reference created successfully", customer:info});
//   }catch(error) {
//     next(error);
//   }
// }
// Webhook to confirmed flutterwave payment gate completed successfully
// exports.paymentCompleted = async (req, res, next) =>{
//   try{
//     // send info to database
//   // update user wallet balance 
//   logger.info("webhook initiated", {service:"webhook"})
//   // If you specified a secret hash, check for the signature
//   // const secretHash =  FLW_SECRET_HASH;
//   // const signature = req.headers["verify-hash"];
//   // if (!signature || (signature !== FLW_SECRET_HASH)) {
//   //     // This request isn't from Flutterwave; discard
//   //     logger.error("Payment hack detected", {service:META.FULTTER_WAVE_SERVICE});
//   //   return  next(APIError.customError("Payment hack detected", 401));
//   // }
//   const payload = req.body;
//   if(payload.customer?.eventType.toLowerCase() === CONSTANTS.BOOKING_EVENT_TYPE[1].toLowerCase()){
//     // update payment info
//     const completed = await payment(payload.customer.id, payload.data.amount);
//     // remove 10% from the amount for the company
//     if(!completed) next(APIError.customError("Payment Failed", 400))
//     if(completed.error) next(APIError.customError(completed.error, 400))
    
    
//     //update booking status
//     const info = {
//       paymentRef: payload.data.paymentRef,
//       status: CONSTANTS.BOOK_STATUS[2],
//       amount:payload.data.amount
//     }
//     const update = await updateBooking(info,payload.customer.bookId, payload.customer.id);
//     // const update = await updateBooking(CONSTANTS.BOOK_STATUS[2],payload.customer.bookId, payload.customer.id, payload.data.amount);
//     if(update.error) next(APIError.customError(update.error, 401));
//     logger.info("Booking status updates successfully", {service:META.PAYMENT});
//     const history = {
//       user: payload.customer.muvaId,
//       amount: balance.toFixed(2),
//       description: "Booking Payment",
//       transaction:[`${payload.firstName} ${payload.lastName} paid ${balance.toFixed(2)} for ${payload.bookId}`],
//     }
//     const walletHis = await updateWalletHistory(history);
//     if(!walletHis) next(APIError.customError("Payment history Failed", 400))
//     if(walletHis.error) next(APIError.customError(walletHis.error, 400))
//     logger.info("Payment History recorded successfully", {service:META.PAYMENT}); 
//     res.status(200).json({success: true});
//   }else if(payload.customer.eventType.toLowerCase() === CONSTANTS.BOOKING_EVENT_TYPE[0].toLowerCase()){
//     const completed = await fundWallet(payload.customer.id, payload.data.amount);
//     if(!completed) next(APIError.customError("Payment Failed", 400))
//     if(completed.error) next(APIError.customError(completed.error, 400))
//     logger.info("Payment completed successfully", {service:META.PAYMENT}); 
//   // update wallet history
//   const history = {
//     user: payload.customer.id,
//     amount: payload.data.amount,
//     description: "Wallet Funding",
//     transaction:[...completed],
//   }
//   const walletHis = await updateWalletHistory(history);
//   if(!walletHis) next(APIError.customError("Payment history Failed", 400))
//   if(walletHis.error) next(APIError.customError(walletHis.error, 400))
//   logger.info("History recorded successfully", {service:META.PAYMENT}); 
//     res.status(200).json({success: true});
//   }else{
//     logger.error("Payment event not found", {service:META.PAYMENT});
//     return next(APIError.notFound("Payment event NOT found"));
//   } 

//   }catch(error){
//     next(error);
//   }
// }

exports.walletBalance = async (req, res, next) => {
  try{
    const bal = await getWalletBalance(req.userId);
    if(!bal) return next(APIError.badRequest("No record found"));
    if(bal.error) return next(APIError.badRequest(bal.error));
    logger.info("Wallet balance retrieved successfully", {service:META.PAYMENT})
    res.status(200).json({success: true, msg: "Balanced retrieved successfully", balance: bal.balance});
  }catch(error){
    next(error);
  }
}
// exports.verifyBankInfo = async (req, res, next) => {
//   try{
//     const { bankcode, account, bvn} = req.query
//     if(!account) return next(APIError.badRequest("Account number is required"));
//     if(!bankcode) return next(APIError.badRequest("Account bank is required"));
//     // if(!bvn) return next(APIError.badRequest("BVN is required"));
//     // if(bvn.length !== 11) return next(APIError.badRequest("BVN is invalid, (must be 11 digits)"));
// const details = {
//   account_number: account.toString(),
//   account_bank: bankcode.toString()
// };
// const verify = await flutterwave.Misc.verify_Account(details)
//   if(verify.status === "error") return next(APIError.badRequest(verify.message));
//     logger.info("Account number verified successfully", {service:META.FULTTER_WAVE_SERVICE});
//     //verify BVN
//     if(bvn && bvn.trim() !==""){
//       if(bvn.length !== 11) return next(APIError.badRequest("BVN is invalid, (must be 11 digits)"));
//       const names = verify.data.account_name.split(" ");
//       const initBVN = await flutterwave.Misc.bvn({bvn, firstname: names[0], lastname: names[1] })
//       if(initBVN?.error_id) return next(APIError.badRequest(`BVN:${initBVN.message}, try again`));
//       if(initBVN.status === "error") return next(APIError.badRequest(`${initBVN.message}, try again`));
//       logger.info("BVN initialized successfully", {service:META.FLUTTER_WAVE_SERVICE}); 
//       const verifyBVN = await flutterwave.Misc.verifybvn({ reference: initBVN.data.reference})
//       if(!verifyBVN || verifyBVN.status === "error") return next(APIError.badRequest(verifyBVN?.message || 'BVN verification failed'));
//       logger.info("BVN verified successfully", {service:META.FLUTTER_WAVE_SERVICE});
//     }
//     res.status(200).json({success: true, msg: "Account number is valid", bank:verify.data});
//   }catch(error){
//     next(error);
//   }
// }

exports.getBanks = async (req, res, next) => {
  try{
// request(flutterOptions, function (error, response) {
//   if (error) return next(APIError.customError(error.message, 400));
//   const banks = JSON.parse(response.body);
//   const build = resBuilder.commonResponse("Found", banks.data, "banks" );
//   res.status(200).json(build )
// });
const data = await payStackBankList();
if(!data) return next(APIError.badRequest("Bank list failed, try again"));
if(data?.error) return next(APIError.badRequest(data.error));
const build = resBuilder.commonResponse("Found", data, "banks" );
  res.status(200).json(build );
  }catch(error){
    next(error);
  }
}

exports.verifyBankInfo = async (req, res, next) => {
  try{
    const { bankcode, account, bvn} = req.query
    if(!account) return next(APIError.badRequest("Account number is required"));
    if(!bankcode) return next(APIError.badRequest("Account bank is required"));
    const details = {};
  const resolve = await resolveBankAccount(account.toString(), bankcode.toString());
  if(resolve?.error) return next (APIError.badRequest(resolve.error));
  if(!resolve) return next (APIError.badRequest("Bank Account Verification failed, try again")); 
    logger.info("Account number verified successfully", {service:META.PAYSTACK_SERVICE});
    //verify BVN
    details.accountName = resolve.account_name;
    if(bvn && bvn.trim() !==""){
      if(bvn.trim().length !== 11) return next(APIError.badRequest("BVN is invalid, (must be 11 digits)")); 
      const verifyBVN = await resolveBVN(bvn);
      if(!verifyBVN) return next(APIError.badRequest("BVN verification failed, try again"));
      if(verifyBVN?.error) return next(APIError.badRequest(verifyBVN.error));
      logger.info("BVN verified successfully", {service:META.PAYSTACK_SERVICE});
    }
    res.status(200).json({success: true, msg: "Account number is valid", bank:{...details}});
  }catch(error){
    next(error);
  }
}
exports.transactionStatus = async (req, res, next) => {
  try {
    const {transferCode } = req.query;
    if(!transferCode) return next(APIError.badRequest( "Transaction code is required"));
    const verify = await getTransferStatus(transferCode);
    if(!verify) return next(APIError.badRequest("Transaction verification  Failed"));
    if(verify?.error) return next(APIError.badRequest(verify.error));
    logger.info("Transaction Verified successfully", {servic: META.PASYSTACK_SERVICE});
    res.status(200).json({success: true, msg: "Transaction verified successfully"});
  } catch (error) {
    next (error );
  }
}