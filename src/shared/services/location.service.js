const { CONSTANTS } = require("../../config");
const AccountModel = require("../../models/account.model");
const OrderModel = require("../../models/order.models");

exports.updateLocationAndAvailability = async ( accountId,info) => {

    try{ 
        const update = await AccountModel.findByIdAndUpdate({_id:accountId});
        if(!update) return {error: "Account was not found"};
        if(update.availability === info.availability && update.locationData.lat == info.locationData.lat && update.locationData.lng === info.locationData.lng) return {error: "No new data"};
        update.availability = info.availability;
        update.locationData = info.locationData;
        // get orders that have been picked up by this rider,
        const riderCurrentLocation = { 
            latitude: info.locationData.lat,
            longitude: info.locationData.lng
        };
        await OrderModel.updateMany({rider:accountId, status: CONSTANTS.ORDER_STATUS_OBJ.pickup},{riderCurrentLocation})
        update.save();
        return update
    } catch (error) {
        return {error: error.message };
    }
}

exports.getRiderLocation = async (_id) => {
    try{
        return await AccountModel.findById(_id).select("locationData availability -_id");
    } catch (error) {
        return {error: error.message};
    }
}
exports.getOrderLocation = async (orderId, accountId) => {
    try {
        let order = await OrderModel.findOne({orderId, rider: accountId}).select("destinationAddress riderCurrentLocation -_id ");
        if(!order) order = await OrderModel.findOne({orderId, shopper: accountId}).select("destinationAddress riderCurrentLocation -_id ");
return order || {error: "No order found"};
    } catch (error) {
        return {error: error.message };
    }
}