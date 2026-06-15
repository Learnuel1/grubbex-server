const config = require('../config/env');

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: config.CLOUDINARY_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});
const accessPath = {
  preset: config.UPLOAD_PRESET,
  folder: config.UPLOAD_FOLDER,
};
const options = {
  hostname: 'api.paystack.co',
  port: 443,
  path: '/transaction/initialize',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${config.PAYSTACK_SECRETE_KEY}`,
    'Content-Type': 'application/json'
  }
}
 
const transOptions = (reference) => {
  return{
    hostname: 'api.paystack.co',
   port: 443,
   path: `'/transaction/verify/:${reference}'`,
   method: 'GET',
   headers: {
     Authorization: `Bearer ${config.PAYSTACK_SECRETE_KEY}`
   }}
 }
 
module.exports = {
  cloudinary,
  accessPath,
  transOptions,
  options,
};
