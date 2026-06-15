const { API } = require("../../api/axios.api");
const { CONSTANTS } = require("../../config");
const config = require("../../config/env");
const logger = require("../../logger");
const { verifyLocation } = require("../services/google.service");
const { updateLocationAndAvailability, getRiderLocation, getOrderLocation } = require("../services/interface");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");
const axios = require('axios');

 

exports.updateAVailability = async (req, res, next ) => {
    try{
        const { lat, lng, status } = req.body;
        if(!status) return next (APIError.badRequest("Rider Status is required"));
        if(!Array.from(Object.values(CONSTANTS.RIDER.ACC_STATUS_OBJ)).includes(status)) return next(APIError.badRequest("Invalid status"));
    if(!lat || !lng) return next(APIError.badRequest("Provide location data"));
    if(isNaN(lat) || isNaN(lng)) return next(APIError.badRequest("Location data must be digits only"));
    const data = await verifyLocation({latitude: lat, longitude: lng});
    if(data?.error) return next(APIError.badRequest(data.error));
     logger.info(`Verified location successfully`, {service: META.LOCATION});
    const info = {
        availability: status,
        locationData: {lat, lng}
    }
    // compute the riders orders in the vicinity
    // get orders that are available and within the radius of the rider, then compute the distance between the rider and the order, then sort the orders by distance and assign the closest order to the rider, then update the order with the rider's location and availability status
    const radius = config.RIDER_RADIUS || 5;


    
    const update = await updateLocationAndAvailability(req.user, info);
    if(!update) return next(APIError.badRequest("Availability update failed"));
    if(update?.error) return next(APIError.badRequest(update.error));
    logger.info("Location and availability updated successfully", {service: META.LOCATION});
    res.status(200).json({ success: true, msg: "Availability updated successfully"});
    } catch (error) {
        next(error);
    }
}
exports.getRiderCurrentLocation = async (req, res, next) => {
    try{
        const location = await getRiderLocation(req.user);
        if(!location) return next(APIError.badRequest("Could get current location, try again."));
        if(location?.error) return next(APIError.badRequest(location.error));
    logger.info("Retrieve current location successfully", {service: META.LOCATION});
    res.status(200).json({success: true, msg: "Found", data: location});
    } catch (error) {
        next (error) ;
    }
}

exports.getOrderCurrentLocation = async (req, res, next ) => {
    try {
        const {orderId} = req.query;
        if(!orderId) return next(APIError.badRequest("Order ID is required"));
        const location = await getOrderLocation(orderId, req.user);
        if(!location) return next(APIError.badRequest("Order location retrieval failed, try again"));
        if(location?.error) return next(APIError.badRequest(location.error));
        logger.info("Retrieved order location successfully", {service: META.LOCATION});
        res.status(200).json({success: true, msg: "Found", data:location});
    } catch (error ) {
        next (error);
    }
}

