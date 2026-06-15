const logger = require("../../logger");
const { verifyLocation } = require("../services/google.service");
const { createShippingAddress, updateShippingAddressById, getShippingAddressByUserId, deleteShippingAddressById } = require("../services/interface");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");

exports.newShippingAddress = async (req, res, next) => {   
    try {
        const {lat, lng} = req.body;
        delete req.body.lat;
        delete req.body.lng;
        req.body.location = {latitude: lat, longitude: lng};
        // verify that the address is valid using google maps geocoding api
        const locationInfo = await verifyLocation(req.body.location);
        if(locationInfo?.error) return next(APIError.badRequest(locationInfo.error));
        req.body.location.formattedAddress = locationInfo.result.formatted_address;
        const address = await createShippingAddress(req.body);
        if(!address) return next(APIError.badRequest("Shipping address creation failed, try again"));
        if(address?.error) return next(APIError.badRequest(address.error));
        logger.info("Shipping address created successfully", {service:META.SHIPPING_ADDRESS}); 
        res.status(201).json({success: true, msg: "Shipping address created successfully"});
    } catch (error) { 
     next(error);
    }
}
exports.getShippingAddress = async (req, res, next) => {
    try {
        const {addressId } = req.query;
        const query = {userId: req.userId}
        if(addressId) query.addressId = addressId;
        const address = await getShippingAddressByUserId(query);
        if(!address || address.length === 0) return next(APIError.notFound("Shipping address not found"));
        if(address?.error) return next(APIError.badRequest(address.error));
        logger.info("Shipping address retrieved successfully", {service:META.SHIPPING_ADDRESS});
        res.status(200).json({success: true, msg: "Found", data: address});
    } catch (error) {
        next(error);
    }
}
exports.updateShippingAddress = async (req, res, next) => {
    try {
        const { addressId } = req.query;
        const {lat, lng} = req.body;
        if(lat && lng) {
            delete req.body.lat;
            delete req.body.lng;
            req.body.location = {latitude: lat, longitude: lng};
            // verify that the address is valid using google maps geocoding api
            const locationInfo = await verifyLocation(req.body.location);
            if(locationInfo?.error) return next(APIError.badRequest(locationInfo.error));
            req.body.location = {latitude: lat, longitude: lng, formattedAddress: locationInfo.result.formatted_address};
        }
        if(!addressId) return next(APIError.badRequest("Address ID is required"));
        const address = await updateShippingAddressById(addressId, req.userId, req.body );
        if(!address) return next(APIError.notFound("Shipping address not found"));
        if(address?.error) return next(APIError.badRequest(address.error));
        logger.info("Shipping address updated successfully", {service:META.SHIPPING_ADDRESS});
        res.status(200).json({success: true, msg: "Shipping address updated successfully"});
    } catch (error) {
        next(error);
    }
}
exports.deleteShippingAddress = async (req, res, next) => {
    try {
        const { addressId } = req.query;
        if(!addressId) return next(APIError.badRequest("Address ID is required"));
        const address = await deleteShippingAddressById(addressId, req.userId);
        if(!address) return next(APIError.notFound("Shipping address not found"));
        if(address?.error) return next(APIError.badRequest(address.error));
        logger.info("Shipping address deleted successfully", {service:META.SHIPPING_ADDRESS});
        res.status(200).json({success: true, msg: "Shipping address deleted successfully"});
    } catch (error) {
        next(error);
    }
}