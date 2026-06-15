const { PAYSTACK_SECRETE_KEY } = require("../config/env");

const options = (url = '/transaction/initialize', method = 'POST', params= null) => {
  if(params === null){
    return  { 
      hostname: 'api.paystack.co',
      port: 443,
      path: `${url}`,
      method: method,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRETE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  } else { 
    return {
       hostname: 'api.paystack.co',
      port: 443,
      path: `${url}`,
      method: method,
      params: {...params},
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRETE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
    }
} 
module.exports = {
  options, 
};