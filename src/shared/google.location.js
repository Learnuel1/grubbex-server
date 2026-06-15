const { Client } = require("@googlemaps/google-maps-services-js");
const config = require("../config/env");

const client = new Client({});

async function getLocationFromAddress(address) {
  try {
    const response = await client.geocode({
      params: {
        address: address,
        key: config.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const formattedAddress = response.data.results[0].formatted_address;
      
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress,
        placeId: response.data.results[0].place_id
      };
    }
    
    return { error: "No results found" };
  } catch (error) {
    return { error: error.message || "Failed to get location data" };
  }
}

module.exports = { getLocationFromAddress };