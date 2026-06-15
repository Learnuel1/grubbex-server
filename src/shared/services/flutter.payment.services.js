const { WalletHistoryModel } = require("../../models/wallet.history.model")
const { WalletModel } = require("../../models/wallet.model")
const { flutterwave } = require("../utils/flutterwave.auth");

exports.fund = async (user, amount) => {
  try{
    return await WalletModel.findOneAndUpdate({user},{$inc:{balance:amount}})
  }catch(error){
    return {error}
  }
}
exports.pay = async (user, amount) => {
  try{
    return await WalletModel.findOneAndUpdate({user},{$inc:{balance:-amount}})
  }catch(error){
    return {error}
  }
}
exports.walletBalance = async (user) =>{
  try{
    return await WalletModel.findOne({user}).select("balance").exec();
  }catch(error){
    return {error};
  }
}
exports.WalletHistory = async (user) =>{
  try{
    return await WalletHistoryModel.find({user}).sort("1").select("-_id -__v -user");
  }catch(error){
    return {error};
  }
}

exports.updateHistory = async (info) => {
  try{
    return await WalletHistoryModel.create({...info,
      $add:{
        transaction: info.transaction
      }
    })
  }catch(error){
    return {error};
  }
}
 

  exports.payWithCard = async (cardDetails ) => {
  try {
    const response = await flutterwave.Charge.card(cardDetails);

    // If OTP is required, return the flw_ref and status
    if (response.meta && response.meta.authorization && response.meta.authorization.mode === "otp") {
      return {
        status: "pending_otp",
        flw_ref: response.data.flw_ref,
        message: "OTP required to complete transaction",
        response,
      };
    }
 
    return response;
  } catch (error) {
    return { error: error.message || "Payment failed" };
  }
}

exports.validateCardOTP = async ({ flw_ref, otp }) => {
  try {
    const payload = {
      otp,
      flw_ref,
    };

    const response = await flutterwave.Charge.validate(payload);
    return response;
  } catch (error) {
    return { error: error.message || "OTP validation failed" };
  }
}

exports.verifyPayment = async (flw_ref) => {
  try {
    const response = await flutterwave.Transaction.verify({ flw_ref });
    return response;
  } catch (error) {
    return { error: error.message || "Payment verification failed" };
  }
}