const MutedOrderModel = require("../../models/muted.order.model");

exports.create = async (info) => {
    try{
        const alreadyMuted = await MutedOrderModel.findOne({ orderId: info.orderId, riderId: info.riderId} ).exec();
        if(alreadyMuted) MutedOrderModel.findByIdAndDelete(alreadyMuted._id).exec();
        return MutedOrderModel.create(info);
    } catch (error) {
        return { error: error.message || "Failed to create muted order" };
    }
}
exports.findMutedByUser = async (riderId) => {
    try {
        const mutedOrders = await MutedOrderModel.find({ riderId, duration: { $gt: new Date() } }).exec();
        // Create a map to ensure uniqueness by orderId
        const uniqueOrdersMap = {};
        mutedOrders.forEach(order => {
            uniqueOrdersMap[order.orderId] = order;
        });
        // Return only unique orders by orderId
        return Object.values(uniqueOrdersMap);
    } catch (error) {
        return { error: error.message || "Failed to fetch muted orders" };
    }
}
exports.find = async (query) => {
    try{
        return MutedOrderModel.find(query).exec();
    } catch (error) {
        return { error: error.message || "Failed to fetch muted order" };
    }
}
exports.updateMutedOrder = async (orderId, duration) => {
    try{
        return await MutedOrderModel.findOneAndUpdate({ orderId }, { duration }, { new: true });
    } catch (error) {
        return { error: error.message || "Failed to mute order" };
    }
}