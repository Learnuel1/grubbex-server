const Flutterwave = require('flutterwave-node-v3');
const config = require('../config/env');

// const flutterwave = new Flutterwave({
//   publicKey: FLUTTER_PUBLIC_KEY,
//   secretKey: FLUTTER_SECRET_KEY,
//   encryptionKey: FLUTTER_ENCRY_KEY,
// });
let options = {
  'method': 'GET',
  'url': 'https://api.flutterwave.com/v3/banks/NG',
  'headers': {
    'Authorization': `Bearer ${config.FLUTTER_SECRET_KEY}`
  }
};
module.exports = {
  flutterOptions:options,
}

