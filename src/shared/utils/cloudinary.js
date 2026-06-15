const config = require('../../config/env');

require('dotenv').config();
const cloudinary =require('cloudinary').v2;

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
 
 const uploadFileToCloudinary = async (file, req)=> {
  try{ 
    file[0].filename = file[0].originalname +req.userId + new Date(); 
    const upload = await cloudinary.uploader.upload(file[0].path, {
          upload_preset:accessPath.preset,
              folder: accessPath.folder, 
        });
    return upload;
  }catch(error){
    return {error}
  }
}
 const uploadSingleFileToCloudinary = async (file, req)=> {
  try{ 
    file.filename = file.originalname +req.userId + new Date(); 
    const upload = await cloudinary.uploader.upload(file.path, {
          upload_preset:accessPath.preset,
              folder: accessPath.folder, 
        });
    return upload;
  }catch(error){
    return {error}
  }
}
 const deleteFileFromCloudinary = async (fileId)=> {
  try{   
  const upload = await cloudinary.uploader.destroy(fileId, {
        upload_preset:accessPath.preset,
            folder: accessPath.folder,
      });
    return upload;
  }catch(error){
    return {error}
  }
}
const uploadBase64ToCloudinary = async (base64String, req) => {
  try {
    const upload = await cloudinary.uploader.upload(base64String, {
      upload_preset: accessPath.preset,
      folder: accessPath.folder,
    });
    return upload;
  } catch (error) {
    return { error };
  }
};
module.exports = {
  cloudinary,
  accessPath,
  transOptions,
  options, 
  uploadFileToCloudinary,
deleteFileFromCloudinary,
uploadSingleFileToCloudinary,
uploadBase64ToCloudinary,
};
