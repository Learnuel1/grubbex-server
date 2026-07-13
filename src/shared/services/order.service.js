const { default: mongoose } = require("mongoose");
const { CONSTANTS } = require("../../config");
const OrderModel = require("../../models/order.models");
const TemporalAccountModel = require("../../models/temporal.account.model");
const { WalletModel } = require("../../models/wallet.model");
const { WalletHistoryModel } = require("../../models/wallet.history.model");

exports.createDraft = async (info) => {
    try {  
        const {latitude, longitude, formattedAddress, ...rest } = info.destinationAddress.location;
        info.destinationAddress.location = {
            coordinates: [longitude, latitude],
           formattedAddress,
           latitude,
            longitude,
        }  
        await OrderModel.findOneAndDelete({qrText: info.qrText, status: CONSTANTS.ORDER_STATUS_OBJ.draft, shopperId: info.shopperId});
        const createOrder = await OrderModel.create({...info, $set:{
            payment: info.payment,
        }});  
        return createOrder;
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
        const {payment,...rest} = info
        return await OrderModel.findOneAndUpdate({reference},{ $set:{...rest}, $push:{
            payment: info.payment
    }}, {new:true});
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
        }]).select("-__v -_id -user -updatedAt -destinationAddress.account -destinationAddress.addressId -qrCode.id -shopperId -shopper -reference -qrText -store.bankDetails -paymentType -payment._id -orderStates._id -orderStates.by").sort({ createdAt: -1 }).limit(limit).lean();
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
            if(data.status.toLowerCase() === CONSTANTS.ORDER_STATUS_OBJ.pending.toLowerCase() && data.status.toLowerCase() === CONSTANTS.ORDER_STATUS_OBJ.pickup.toLowerCase()) return {error: "Order is yet to be accepted by a rider"}
            data.storeStatus = status.storeStatus;
        }
        if(status.hasOwnProperty("status")) {
            data.status = status.status;
        }
        const {orderStates} = data;
        const states = []; 
        orderStates.forEach((cur) => {
            const {currentState, ...rest} = cur.toObject();
            states.push(rest);
        })
         states.push(status.orderState);
         data.orderStates = states;
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
        }]).select("-__v -_id -user  -updatedAt -destinationAddress.account -destinationAddress.addressId -qrCode.id -shopperId -shopper -reference -qrText -store.bankDetails -paymentType -orderStates._id -orderStates.by").sort({ createdAt: -1 });
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
        }]).select("-destinationAddress.account.picture.id").sort({ createdAt: -1 });
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
         const {orderStates} = data;
        let others = [];
        orderStates.forEach((cur)=>{
            const {currentState, ...current} = cur.toObject();
            others.push(current);
        });
        others.push(info.orderState);
       // update Rider location to store location;
        data.riderCurrentLocation = info.riderCurrentLocation;
        data.auth = info.auth;
       if(data?.qrCode ) data.qrCode =info.qrCode;
        if(info?.orderState) data.orderStates = others
        if(info.hasOwnProperty("status")){ 
            data.status = info.status;
            data.storeStatus =info.storeStatus;
        }
       return await data.save();
    } catch (error) {
        return { error: error.message };
    }
}
exports.completedOrderByIdForAuth = async (info, othersParam) => {
    // Start a session and begin transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find the order
        const data = await OrderModel.findOne(
            { _id: info._id, storeId: info.storeId, orderId: info.orderId },
            null,
            { session }
        );
        if (!data) {
            await session.abortTransaction();
            session.endSession();
            return { error: "Order not found" };
        }

        // 2. Build new orderStates array (excluding 'currentState' from each)
        const newOrderStates = data.orderStates.map(cur => {
            const { currentState, ...rest } = cur.toObject();
            return rest;
        });
        // Add the new state from info
        if (info.orderState) {
            newOrderStates.push(info.orderState);
        }

        // 3. Update fields on the order document
        data.riderCurrentLocation = info.riderCurrentLocation;
        data.auth = info.auth;
        if (data.qrCode) data.qrCode = info.qrCode;
        if (info.hasOwnProperty("status")) {
            data.status = info.status;
            data.storeStatus = info.storeStatus;
        }
        data.orderStates = newOrderStates;

        // 4. Wallet update – use the original 'othersParam' which presumably contains user and balance
        //    (assuming othersParam has fields: user, balanceAfter)
        await WalletModel.findOneAndUpdate(
            { user: othersParam.user },
            { $inc: {balance: othersParam.amount} },
            { session }
        );

        // 5. Create wallet history – again use the object from othersParam
        //    If you need to create history for each state, adjust accordingly.
        await WalletHistoryModel.create([othersParam], { session });

        // 6. Save the order document within the transaction
        await data.save({ session });

        // 7. Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return data; // success

    } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        return { error: error.message || "Failed to process order" };
    }
};
exports.findOrderByQRInfo = async (info) => {
    try{
        if(info.hasOwnProperty("qrCode") && info.hasOwnProperty("pickUpCode"))
            return await OrderModel.findOne({"auth.code":info.pickUpCode, qrText:info.qrCode});
        if(info.hasOwnProperty("token"))
        return await OrderModel.findOne({"auth.token":info.token})
    if(info.hasOwnProperty("code")) return await OrderModel.findOne({"auth.code":info.code});
    if(info.hasOwnProperty("pickUpCode")) return await OrderModel.findOne({"auth.code":info.code});
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
exports.acceptOrRejectOrder = async (info, orderId) => {
    try{
        const order = await OrderModel.findOne({orderId});
        if(!order) return {error: "Order does not exist"};
        if(order.isAvailable === false && info.operation === CONSTANTS.ORDER_STATUS_OBJ.accept) return {error: "Order is no more available"};
        const {orderStates} = order;
        let others = [];
        orderStates.forEach((cur)=>{
            const {currentState, ...current} = cur.toObject();
            others.push(current);
        })
        const currentState = info.operation === CONSTANTS.ORDER_STATUS_OBJ.accept ? info.status : CONSTANTS.ORDER_STATUS_OBJ.cancelled
        order.riderCurrentLocation = info.riderCurrentLocation;
        order.isAvailable = info.isAvailable;
        order.riderId = info.riderId;
        order.rider = info.rider;
        order.status =info.status
        others.push({status:currentState , by:info.rider, type:info.type, currentState:currentState});
        order.orderStates = others; 
       order.save();
        return order;
    } catch (error) {
        console.log(error)
        return {error: error.message}
    }
}

exports.riderOrder = async (query, skip= 0, limit =10) => {
    try{
         const total = await OrderModel.countDocuments(query);
        const orders = await OrderModel.find(query)
            .populate([{ model: "Account", path: "destinationAddress.account", select: "firstName lastName email picture -_id" }])
            .select("-__v -_id -user  -updatedAt -destinationAddress.account -destinationAddress.addressId -qrCode.id -shopperId -shopper -reference -qrText -store.bankDetails -paymentType -payment._id -orderStates._id -orderStates.by")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); 
            return {orders, total}
    } catch (error){
        return {error:error.message}
    }
}