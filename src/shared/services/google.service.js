const { default: axios } = require("axios");
const { API } = require("../../api/axios.api");
const config = require("../../config/env");

exports.verifyLocation = async (info) => {
    try {
        const url = `${API.GMAPS_BASE_URL}?latlng=${info.latitude},${info.longitude}&key=${config.GOOGLE_MAPS_API_KEY}`;
        const { data } = await axios.get(url);
        if (data.status !== 'OK') throw new Error( data.error_message);
        return {ok: true, result: data.results[0]};
    } catch (error) {
     return {error:error.message};   
    }
}


function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
 

async function geocodeAddress(address, apiKey) {
  const key = apiKey || config.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Google API key is required to geocode addresses');

  const url = `${API.GMAPS_BASE_URL}?address=${encodeURIComponent(
    address
  )}&key=${key}`;
  const res = await axios.get(url);
  if (res.data && res.data.results && res.data.results[0]) {
    const loc = res.data.results[0].geometry.location;
    return { lat: loc.lat, lon: loc.lng };
  }
  throw new Error('Geocoding failed for address: ' + address);
}
exports.getGeocodeAddress = async (address, apiKey) => {
    try{ 
  const key = apiKey || config.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Google API key is required to geocode addresses');

  const url = `${API.GMAPS_BASE_URL}?address=${encodeURIComponent(
    address
  )}&key=${key}`;
  const res = await axios.get(url);
  if (res.data && res.data.results && res.data.results[0]) {
    const loc = res.data.results[0].geometry.location;
    return { lat: loc.lat, lon: loc.lng };
  }
  throw new Error('Geocoding failed for address: ' + address);
} catch (error){
    return {error: error.message}
}
}
  
exports.getDistanceKmBetweenAddresses = async (addrA, addrB, options = {}) => {
    try{
  const { apiKey = null, mode  } = options;
   
  const key = apiKey || config.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Google API key required for Distance Matrix modes'); 
  const url = `${API.GMAPS_DISTANCE_MATRIX_URL}?origins=${addrA.lat},${addrA.lng}&destinations=${addrB.lat},${addrB.lng}&mode=${mode}&key=${key}`;
  const res = await axios.get(url);
  if (
    res.data &&
    res.data.rows &&
    res.data.rows[0] &&
    res.data.rows[0].elements &&
    res.data.rows[0].elements[0] &&
    res.data.rows[0].elements[0].distance &&
    typeof res.data.rows[0].elements[0].distance.value === 'number'
  ) {
    return res.data.rows[0].elements[0];
  }
  return { error: 'Distance could not be calculated, try again',  };
} catch (error) {
    return {error: error.message }
}
}
 
// Filter orders
exports.getOrdersWithinRadius = async (orders, riderLat, riderLon, maxKm = config.RIDER_RADIUS)  => {
  return orders.filter(order => {
    const store = order.store;     // store object containing lat/lon
    if (!store?.lat || !store?.lon) return false;
    const dist = getDistanceFromLatLonInKm(
      riderLat, riderLon,
      store.lat, store.lon
    );
    return dist <= maxKm;
  });
}