const axios = require('axios');
const config = require('../config/env');
const { APIError } = require('../utils/apiError');
const { KYCUpdate, getUserKYC } = require('../services');
const { CONSTANTS } = require('../config');
const logger = require('../logger');
const { META } = require('../shared/utils/actions');
const { updateStoreLocation } = require('../api/store/service');
const { API } = require('../api/axios.api');
exports.getReverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    if(!lat) return next(APIError.badRequest("Latitude is required"));
    if(!lng) return next(APIError.badRequest("Longitude is required")); 
  const url = `${API.GMAPS_BASE_URL}?latlng=${lat},${lng}&key=${config.GOOGLE_MAPS_API_KEY}`;
    const { data } = await axios.get(url);
    if (data.status !== 'OK') return next(APIError.badRequest(data.error_message));
    const best = data.results[0];
    logger.info(`Reverse geocode successful for lat: ${lat}, lng: ${lng}`, {service: META.LOCATION});
    // get store info if user is business
      const info = await getUserKYC(req.user);
      if(!info || info === null) return next(APIError.notFound("Create a Store to save location"));
    const position = { 
      latitude: best.geometry.location.lat,
      longitude: best.geometry.location.lng,
      formattedAddress: best.formatted_address,
    };
    const storeId = req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business ? info.store[0].storeId : null;
    const detail = {
      kyc: CONSTANTS.KYC_TYPE_INFO.location,
            status: CONSTANTS.KYC_STATUS[0],
          userId: req.userId,
            user: req.user,
            userType: req.userType,
            onBoarded: false,
            storeId,
    }
    detail.location = position;
    const updateLocation = await KYCUpdate(detail);
    if(!updateLocation) return next(APIError.badRequest("Could not save location"));
    if(updateLocation?.error) return next(APIError.badRequest(updateLocation.error));
    logger.info("Location saved successfully to KYC", {service:  META.KYC});
    // save location to Store model if user is business
    if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business){
      detail.locationStatus = CONSTANTS.LOCATION_STATUS.set;
      const storeLocation = await updateStoreLocation(storeId, detail);
      if(!storeLocation) return next(APIError.badRequest("Could not update store location"));
      if(storeLocation?.error) return next(APIError.badRequest(storeLocation.error));
      logger.info("Location saved successfully to Store", {service:  META.STORE});
    }
    // res.json({ ok: true, result: { formatted: best.formatted_address, place_id: best.place_id, lat, lng } });
    res.status(200).json({ success: true, msg: "Location saved successfully", data: position });

  } catch (error) {
    next(error);
  }
};

exports.isAddressNormalized = async (req, res, next) => {
  try { 
const { address } = req.body;            // can be raw text or place_id
if(!address) return next(new Error("Address is required"));
const formatted_address = `${address.houseNo} ${address.street}, ${address.city}, ${address.state},  NIGERIA`;
  const GMAPS_KEY = config.GOOGLE_MAPS_API_KEY;
  const url = `${API.GMAPS_BASE_URL}?address=${encodeURIComponent(formatted_address)}&key=${GMAPS_KEY}`;
  
    const { data } = await axios.get(url);
    if (data.status !== 'OK') throw new Error('Invalid address');
    const best = data.results[0];
    const types = new Set(best.types); 
    if (types.has('street_address') || types.has('premise') || types.has('point_of_interest')) {
      res.json({ ok: true, result: { formatted: best.formatted_address, place_id: best.place_id, lat: best.geometry.location.lat, lng: best.geometry.location.lng } });
    } else {
      res.status(400).json({ success: false, msg: 'Please provide a street-level address.' });
    } 
  }catch (error) {
    next(error);
  }
};