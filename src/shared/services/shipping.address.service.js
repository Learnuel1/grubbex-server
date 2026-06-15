const { CONSTANTS } = require("../../config");
const ShippingAddressModel = require("../../models/shipping.address.schema");

exports.create = async (shippingAddress) => {
  try { 
    if(shippingAddress?.status && shippingAddress.status.toLowerCase() === CONSTANTS.SHIPPING_ADDRESS_STATUS_OBJ.primary) {
      await ShippingAddressModel.updateMany(
        { userId: shippingAddress.userId, status: CONSTANTS.SHIPPING_ADDRESS_STATUS_OBJ.primary },
        { status:CONSTANTS.SHIPPING_ADDRESS_STATUS_OBJ.other }
      );
    }
   return await ShippingAddressModel.create({...shippingAddress}); 
  } catch (error) {
    return {error: error.message || "Failed to create shipping address"};
  }
}
exports.findByUserId = async (query) => {
    try {
        return await ShippingAddressModel.find(query).sort({ createdAt: -1, status: 1 }).lean().select("-__v -account -_id -createdAt -updatedAt");
    } catch (error) {
        return {error: error.message || "Failed to retrieve shipping addresses"};
    }
    }
exports.deleteById = async (addressId, userId) => {
  try {
    return await ShippingAddressModel.findOneAndDelete({addressId, userId});
  } catch (error ) {
    return {error: error.message};
  }
}
 exports.updateById = async (addressId, userId, updateData) => {
  try {
    return await ShippingAddressModel.findOneAndUpdate({userId, addressId}, updateData, {returnOriginal:false, new:true});
  } catch (error) {
    return {error: error.message || "Failed to update shipping address"};
  } 
}