const { APIError } = require("../utils/apiError");
const Schemas = require("../schema");
const { hashSync } = require("bcryptjs");
const { shortIdGen, isPhoneNumberValid, referenceGen, isValidEmail, isStrongPassword } = require("../utils/Generator");
const { userExist, getUserKYC, searchUserKYC } = require("../services/interface");
const { default: mongoose, Types, ObjectId } = require("mongoose");
const { v4: uuidv4 } = require('uuid');
const { findStore, getStoreByProductId, getStoreByOwner } = require("../../api/store/service");
const { getAccountByGrubbexId, userManagementSetting } = require("../../services");
const { CONSTANTS } = require("../../config");
module.exports = {
  validateRequestData(schema, data ={}) { 
    return  async (req, res, next) => {
      try{ 
    if(!schema) return next(APIError.badRequest("Schema name is required"));
    if(schema === "ZStoreSchema"){
      req.body.storeId = referenceGen();
      req.body.user = req.user;
    }
    if (schema === "ZProfileSchema"){  
      if(req.body?.emergencyContact)
          req.body.emergencyContact = JSON.parse(req.body.emergencyContact);
        req.body.birthDate = new  Date(req.body.birthDate)
    }
    if(req.body?.email){
      if(!isValidEmail(req.body.email)) return next(APIError.badRequest(`Provided email is invalid`))
    }
    if (schema === "ZStoreCategorySchema") { 
      req.body.id = shortIdGen();
      if(req.body?.status?.toLowerCase() === "publish") req.body.status = req.body.status.concat("ed");
    }
    if (schema === "ZInvitationSchema") req.body.id = uuidv4();
    if (schema === "ZStoreProfileSchema") { 
      req.body.user = req.user;
      req.body.userId = req.userId;
    } 
    if (schema === "ZNotificationSchema") { 
      req.body.id = shortIdGen(); 
      req.body.userId = req.userId; 
      req.body.account = req.user;
    }
    if (schema === "ZProductSchema") { 
      req.body.user = req.user;
      req.body.userId = req.userId; 
      const store = await findStore({user:req.body.user});
      if(!store || store.length === 0) return next(APIError.badRequest("Store does not exist"));
      req.body.store = store[0]._id;
      req.body.storeId = store[0].storeId;
      req.body.prodId = referenceGen();
    }
    if(schema === "ZChatSchema"){
      req.body.sender = req.user;
      req.body.userId = req.userId;
      // use grx id to get the user id
      const user = await getAccountByGrubbexId(req.body.receiver);
      if(!user) return next(APIError.badRequest("User does not exist"));
      req.body.receiver = user._id;
      req.body.id = shortIdGen(24);
    };
    if( schema === "ZTicketSchema"){
      req.body.id = shortIdGen(20);
      req.body.sender = req.user;
    }
    if( schema === "ZTicketChatSchema" || schema === "ZFaqSchema"){
      req.body.id = shortIdGen(20);
      req.body.sender = req.user; 
      req.body.account = req.user;
    }
    if(schema === "ZLikeRatingSchema" || schema === "ZReviewSchema"){
      req.body.account = req.user;
      req.body.shopper = req.user;
      req.body.id = shortIdGen(20);
    }
    if(schema === "ZPromotionSchema"){
      req.body.account = req.user; 
      req.body.id = shortIdGen(20);
      req.body.startDate = new Date(req.body.startDate);  
    }
    if( schema === "ZShippingAddressSchema"){
      req.body.account = req.user;
      req.body.userId = req.userId;
      req.body.addressId = shortIdGen(10);
      if(req.body?.phoneNumber) {
        const number = req.body.phoneNumber
        if(!isPhoneNumberValid( req.body.phoneNumber)) return next(APIError.badRequest("Invalid Phone number"));
        if(req.body.phoneNumber.charAt(0) === "+"){
          req.body.phoneNumber =  "0".concat(req.body.phoneNumber.slice(4)) ;
          req.body.countryCode = number.slice(0,4)
        }  
      }
    }
    if (schema === "ZOrderSchema") {
     if( !req.body.orderId ) req.body.orderId = referenceGen(20).toLowerCase();
      req.body.shopper = req.user;
      req.shopperId = req.userId;
      // get store address from kyc the product id
      const item = req.body.items[0];
    const store = await getStoreByProductId(item.prodId);
    if(!store) return next(APIError.notFound("Product does not exist"));
    if(store?.error) return next(APIError.badRequest(store.error));
    // use the store to get the store address from kyc
    const storeKYC = await searchUserKYC({"store.storeId":store.storeId});
  
    if(!storeKYC ?? storeKYC.length === 0) return next(APIError.badRequest("Order store info failed, try again"));
    if(storeKYC?.error) return next(APIError.badRequest(storeKYC.error));
    const info = {
      address:storeKYC[0].profile[0].address,
      store:{storeId:storeKYC[0].store[0].storeId, name:storeKYC[0].store[0].name},
      bankDetails:storeKYC[0].bankDetails[0],
    }
    delete info.bankDetails.bvn;
    req.body.store = [info ];
    const { destinationAddress } = req.body;
    if( destinationAddress){ 
      delete req.body.destinationAddress;
      destinationAddress.account = req.user;
      req.body.destinationAddress = destinationAddress;
    }
    req.body.shopperId = req.userId;
    }
    if( schema === "ZPayoutSchema"){
      if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business ) {
        const store = await getStoreByOwner({user: req.user});
        if(!store || store.length === 0) return next(APIError.badRequest("Store does not exist"));
        req.body.storeId = store[0].storeId;
        req.body.store = store[0]._id;
        req.body.storeName = store[0].name;
        req.body.id = `S-${shortIdGen(10)}`;
      } 
       
      else if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.rider) {
        req.body.id = `R-${shortIdGen(10)}`
        req.body.storeName = req.userInfo.firstName + " " + req.userInfo.lastName;
      }
       req.body.bankDetails = {
          accountName: req.body.accountName,
          accountNumber: req.body.accountNumber,
          bankName: req.body.bankName
        }
        delete req.body.accountName;
        delete req.body.accountNumber;
        delete req.body.bankName;

      req.body.account = req.user;
      req.body.accountType = req.userType;
      req.body.status = CONSTANTS.PAYOUT_STATUS.pending;
    }
    if( schema === "ZShopperUpdateSchema"){ 
      if(req.body?.phoneNumber) {
        const number = req.body.phoneNumber
        if(!isPhoneNumberValid( req.body.phoneNumber)) return next(APIError.badRequest("Invalid Phone number"));
        if(req.body.phoneNumber.charAt(0) === "+"){
          req.body.phoneNumber =  "0".concat(req.body.phoneNumber.slice(4)) ;
          req.body.countryCode = number.slice(0,4)
        }  
      }
    }
 
    Schemas[schema].parse(req.body); 
     next();
   }catch(error){
     next(error);  
   }
 }
 },
 
  accountType(type="", role="") { 
   return  async (req, _res, next) => {
   try{
   if(!req.body?.type) req.body.type = type;
   if(!req.body?.role)  req.body.role = role;
    const {password, userId, phoneNumber} = req.body;
    if (isStrongPassword(req.body.password) === false) return next(APIError.badRequest("Password is weak"));
    if(password) req.body.password = hashSync(password, 12)
    if(phoneNumber) {
      if(!isPhoneNumberValid( phoneNumber)) next(APIError.badRequest("Invalid Phone number"))
      if(phoneNumber.charAt(0) === "+"){
        req.body.phoneNumber =  "0".concat(phoneNumber.slice(4)) ;
        req.body.countryCode = phoneNumber.slice(0,4)
      } else   req.body.phoneNumber =phoneNumber 
    }
    if(!userId) { 
      req.body.userId = `GBX${shortIdGen()}`;
     }
     const checkDuplicate = await userExist(req.body);
     if(checkDuplicate) return next(APIError.badRequest(`${checkDuplicate.field}: is not available`)); 
     next();
   }catch(error){
     next(error);  
   }
 }
 },
  allowedRoles(roles) { 
   return  async (req, res, next) => {
   try{ 
    const query = {
      userManagement: {
        accountType: req.userRole,
      }
    }
    const permits = await userManagementSetting(query)
   if(permits.includes(CONSTANTS.ADMIN.PERMISSION_OBJ.managePlatform)) next()
   if(!roles.includes(req.userRole.toLowerCase())) return next(APIError.unauthorized("You don't have required permission"))
     next();
   }catch(error){
     next(error);  
   }
 }
 },
  notAllowedRoles(roles) { 
   return  async (req, res, next) => {
   try{
   if(roles.includes(req.userRole.toLowerCase())) return next(APIError.unauthorized("You don't have required permission"))
     next();
   }catch(error){
     next(error);  
   }
 }
},
  notAllowedAccount(type){ 
   return  async (req, res, next) => {
   try{
   if(type.toLowerCase() === req.userType.toLowerCase()) return next(APIError.unauthorized("You don't have required permission"))
     next();
   }catch(error){
     next(error);  
   }
 }
 },
 renameZodSchema(schema) { 
  return  async (req, res, next) => {
  try{
    let rename = schema.slice(0,(schema.length-6)).slice(1);
    if(!schema) return next(APIError.badRequest("Zod Schema name is required"));
   req.schema = rename;
    next();
  }catch(error){
    next(error);  
  }
}
},
}



