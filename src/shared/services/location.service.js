const AccountModel = require("../../models/account.model");
const OrderModel = require("../../models/order.models");

exports.updateLocationAndAvailability = async ( accountId,info) => {
    try{
        const update = await AccountModel.findByIdAndUpdate({_id:accountId});
        if(!update) return {error: "Account was not found"};
        if(update.availability === info.availability && update.locationData.lat == info.locationData.lat && update.locationData.lng === info.locationData.lng) return {error: "No new data"};
        update.availability = info.availability;
        update.locationData = info.locationData;
        update.save();
        return update
    } catch (error) {
        return {error: error.message };
    }
}

exports.getRiderLocation = async (accountId) => {
    try{
        return await AccountModel.findById(accountId).select("locationData availability -_id");
    } catch (error) {
        return {error: error.message};
    }
}
exports.getOrderLocation = async (orderId, accountId) => {
    try {
        let order = await OrderModel.findOne({orderId, riderId: accountId}).select("destinationAddress riderCurrentLocation -_id");
        if(!order) order = await OrderModel.findOne({orderId, shopperId: accountId}).select("destinationAddress riderCurrentLocation -_id");
return order || {error: "No order found"};
    } catch (error) {
        return {error: error.message };
    }
}