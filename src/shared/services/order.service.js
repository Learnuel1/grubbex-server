const { CONSTANTS } = require("../../config");
const OrderModel = require("../../models/order.models");
const TemporalAccountModel = require("../../models/temporal.account.model");

exports.createDraft = async (info) => {
    try { 
       await OrderModel.findOneAndDelete({qrText: info.qrText, status: CONSTANTS.ORDER_STATUS_OBJ.draft, shopperId: info.shopperId});
        return await OrderModel.create({...info});
    } catch (error) {
        return { error: error.message || "Failed to create order" };
    }

}
exports.orderByReference = (reference) => {
    try{
        return OrderModel.findOne({ reference }).exec();
    } catch (error) {
        return {error };
    }
}
exports.updateOrderDetails = async (info, reference) => {
    try{
        return await OrderModel.findOneAndUpdate({reference}, {...info});
    } catch (error) {
        return {error};
    }
}
exports.allOrders = async (query, page =1, limit= 14) => {
    try {
        return await OrderModel.find( query).populate([{
            model: "Account",
            path:"destinationAddress.account",
            select: "firstName lastName email picture -_id"
        }]).select("-__v -_id -user -createdAt -updatedAt -destinationAddress.account -destinationAddress.addressId -qrCode.id -shopperId -shopper -reference -qrText -store.bankDetails -paymentType").sort({ createdAt: -1 }).limit(limit).lean();
    } catch (error) {
        return { error: error.message || "Failed to fetch orders" };
    }
}
exports.updateOrderStatus = async (query,status) => {
    try {
        const data = await OrderModel.findOne(query);
        if (!data) {
            return { error: "Order not found" };
        }
        if(data.store === status) {
            return { error: "Order already has this status" };
        }
        if(status.hasOwnProperty("storeStatus")) {
            data.storeStatus = status.storeStatus;
        }
        if(status.hasOwnProperty("status")) {
            data.status = status.status;
        } 
     return   await data.save();
    } catch (error) {
        return { error: error.message || "Failed to update order status" };
    }
}
exports.orderById = async (orderId ) => {
    try {
        return await OrderModel.find( {orderId}).populate([{
            model: "Account",
            path:"destinationAddress.account",
            select: "firstName lastName email  picture -_id"
        }]).select("-__v -_id -user -createdAt -updatedAt -destinationAddress.account -destinationAddress.addressId -qrCode.id -shopperId -shopper -reference -qrText -store.bankDetails -paymentType").sort({ createdAt: -1 });
    } catch (error) {
        return { error: error.message || "Failed to fetch orders" };
    }
}
exports.orderByIdForAuth = async (orderId ) => {
    try {
        return await OrderModel.findOne({orderId}).populate([{
            model: "Account",
            path:"destinationAddress.account",
            select: "firstName lastName email picture -_id"
        }]).sort({ createdAt: -1 });
    } catch (error) {
        return { error: error.message || "Failed to fetch orders" };
    }
}
exports.updateOrderByIdForAuth = async (info ) => {
    try {
        const data = await OrderModel.findOne({_id: info._id, storeId:info.storeId, orderId:info.orderId} );
        if (!data) {
            return { error: "Order not found" };
        }
        data.auth = info.auth; 
        if(info.hasOwnProperty("status")) data.status = info.status;
       return await data.save();
    } catch (error) {
        return { error: error.message || "Failed to fetch orders" };
    }
}
exports.findOrderByQRInfo = async (info) => {
    try{
        if(info.hasOwnProperty("token"))
        return await OrderModel.findOne({"auth.token":info.token})
    if(info.hasOwnProperty("code")) return await OrderModel.findOne({"auth.code":info.code})
    } catch (error) {
        return {error: error.message || "Failed to fetch Order"}
    }
}

exports.findOrderForQRCodeGeneration = async (orderId, info) => {
    try {
        return await OrderModel.findOne({orderId, ...info });
    } catch (error) {
        return { error: error.message || "Failed to fetch order for QR code generation" };
    }
}

exports.updateOrderQRCodeInfo = async (orderId, info) => {
    try {
        const data = await OrderModel.findOneAndUpdate({orderId}, {...info}, {new: true} );
        return data;
    } catch (error) {       
         return { error: error.message || "Failed to update order QR code info" };
    }
}
