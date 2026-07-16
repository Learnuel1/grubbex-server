const { APIError } = require("../utils/apiError");
const jwt = require("jsonwebtoken");
const { getUserById, KYCcheck } = require("../services");
const { ERROR_FIELD } = require("../utils/actions");
const config = require("../config/env"); 
const { CONSTANTS } = require("../config");
const {  temporalAccExistByToken, userExistById } = require("../shared/services/interface");
const useragent = require("useragent");
const { Types } = require("mongoose");
const { compareSync } = require("bcryptjs");

const adminRequired = async (req, res, next) => {
  try {
    let token = req.cookies?.grub_ex;
    if (!token) token = req.headers?.authorization?.split(" ")[1];
    if (!token) token = req.headers?.cookie?.split("=")[1];
    if (!token) return next(APIError.unauthenticated());
    const payload = jwt.verify(token, config.TOKEN_SECRETE);
    if (payload?.type?.toLowerCase() !== CONSTANTS.ACCOUNT_TYPE_OBJ.admin && payload?.type?.toLowerCase() !== CONSTANTS.ACCOUNT_TYPE_OBJ.dev)
      return next(APIError.unauthorized());
    req.user = new Types.ObjectId(payload.id)
    req.userId = payload.userId;
    req.userRole = payload.role; 
    req.userType = payload.type;
    req.token = token;
    req.userInfo = {
      user: req.user,
      userId:req.userId,
      userRole: req.userRole,
      userType: req.userType,
      firstName: req.firstName,
      lastName: payload?.lastName,
      email: req.email
    }
    const userInfo = await userExistById(new Types.ObjectId(payload.id));
 
   if(!userInfo || userInfo === null) return next(APIError.unauthenticated());
    const createdBy = {
      name: `${userInfo.firstName} ${userInfo.lastName}`,
      id: payload.id,
      role: payload.role,
      type: payload.type,
    }
    req.body.createdBy = createdBy;
    req.createdBy = createdBy;
    req.user = userInfo._id; 
    next();
  } catch (error) {
    if (error.message === ERROR_FIELD.JWT_EXPIRED) next(APIError.unauthenticated());
    next(error);
  }
};
const othersRequired = async (req, res, next) => {
  try {
    let token = req.cookies?.grub_ex;
    if (!token) token = req.headers?.authorization?.split(" ")[1];
    if (!token) token = req.headers?.cookie?.split("=")[1];
    if (!token) return next(APIError.unauthenticated());
    const payload = jwt.verify(token, config.TOKEN_SECRETE);
    if (CONSTANTS.ACCOUNT_TYPE.includes(payload.role?.toLowerCase()) && payload.role.toLowerCase() === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper)
      return next(APIError.unauthorized());
    req.userId = payload.userId;
    req.userRole = payload.role; 
    req.userType = payload.type; 
     req.userInfo = { 
      userId:req.userId,
      userRole: req.userRole,
      userType: req.userType, 
    }
    if(payload?.storeId) req.storeId = payload.storeId; 
    next();
  } catch (error) {
    if (error.message === ERROR_FIELD.JWT_EXPIRED) next(APIError.unauthenticated());
    next(error);
  }
};
const userRequired = async (req, res, next) => {
  try {
    let token = req.cookies?.grub_ex;
    if (!token) token = req.headers?.authorization?.split(" ")[1];
    if (!token) token = req.headers?.cookie?.split("=")[1];
    if (!token) return next(APIError.unauthenticated());
    const payload = jwt.verify(token, config.TOKEN_SECRETE);
    const isUser = await userExistById(new Types.ObjectId(payload.id));
    if (!isUser) return next(APIError.customError(`user does not exist`, 404));
    if (isUser?.error) return next(APIError.customError(isUser?.error), 400);
    req.user = new Types.ObjectId(payload.id)
    req.userId = payload.userId;
    req.userRole = payload.role;
    req.userType = payload.type;
    req.firstName = isUser.firstName;
    req.lastName = isUser.lastName;
    req.email = isUser.email;
    req.token = token;
    req.userInfo = {
      user: req.user,
      userId:req.userId,
      userRole: req.userRole,
      userType: req.userType,
      firstName: req.firstName,
      lastName: req.lastName,
      email: req.email
    }
    if(payload?.storeId) req.storeId = payload.storeId; 
    if(isUser.verified === true) req.verified = isUser.verified;
    if(req.path === "/advert"){
    req.query = {status: CONSTANTS.PROMOTION_STATUS_OBJ.active };
    }
    if(new RegExp(payload.role, 'i').test(CONSTANTS.ACCOUNT_TYPE_OBJ.rider))   req.onBoarded = payload.onBoarded;
    next();
  } catch (error) {
    if (error.message === ERROR_FIELD.JWT_EXPIRED) 
      next(APIError.unauthenticated());
    else next(error);
  }
}; 
const driverRequired = async (req, res, next) => {
  try {
     if(req.userRole.toLowerCase() !== CONSTANTS.ACCOUNT_TYPE_OBJ.rider.toLowerCase()) return next(APIError.unauthorized());
     if(!req.onBoarded || req.onBoarded === false){
      const kyc = await KYCcheck(req.userId);
      if(kyc){ req.onBoarded = kyc.onBoarded};
     }
    if(req.email.toString().toLowerCase() === CONSTANTS.TEST_EMAIL[1].toLowerCase()) req.onBoarded = true;
    next();
  } catch (error) {
     next(error);
  }
}; 
const verifyOTPToken = async (req, res, next) => {
  try {
    let token = req.cookies?.grub_ex;
    if (!token) token = req.headers?.authorization?.split(" ")[1];
    if (!token) token = req.headers?.cookie?.split("=")[1];
    if (!token) return next(APIError.unauthenticated());
    const payload = jwt.verify(token, config.TOKEN_SECRETE);
    const isUser = await getUserById(new Types.ObjectId(payload.id));
    if (!isUser) return next(APIError.customError(`OTP not exist`, 404));
    if (isUser.error) return next(APIError.customError(isUser.error), 400);
    req.userId = payload.id;
    req.userRole = payload.role;
    req.firstName = isUser.firstName;
    req.email = isUser.email;
    req.userInfo = {
      userId:req.userId,
      userRole: req.userRole,  
      email: req.email
    }
    next();
  } catch (error) {
    if (error.message === ERROR_FIELD.JWT_EXPIRED) 
      next(APIError.badRequest("OTP expired"));
    else next(error);
  }
}; 

const phoneIsRequired = async (req, res, next) => {
  try{
    
    req.usedRoute =CONSTANTS.APP_ROUTE.mobile
    next();
  }catch(error){
    next(error);
  }
}
const webIsRequired = async (req, res, next) => {
  try{
    req.usedRoute =CONSTANTS.APP_ROUTE.web; 
    next();
  }catch(error){
    next(error);
  }
}

const tokenRequired = async (req, res, next) => {
  try {
    let token = req.cookies?.grub_ex;
    if (!token || token === "null") token = req.headers?.authorization?.split(" ")[1];
    if (!token || token === "null") token = req.headers?.cookie?.split("=")[1];
    if (!token || token === "null") return next(APIError.unauthenticated("Token is required"));
    let findExisting;
    if(req.path !== "/reset_password"){
      findExisting = await temporalAccExistByToken(token.trim());
      if (!findExisting) return next(APIError.unauthenticated("Token does not exist"));
     }
     if(req.path !== "/renew-otp"){
    jwt.verify(token, config.TOKEN_SECRETE, (err, decoded) => {
      if (err) return next(APIError.unauthenticated("Token expired"));
    });
  }
    const payload = jwt.decode(token, config.TOKEN_SECRETE);
    req.email = payload.email;
    req.token = token;
    req.userType = payload.type;
    next();
  } catch (error) {
    next(error);
  }
};
const passwordRequired = async (req, res, next) => {
  try {
    let token = req.headers?.password_token;
    const userId = req.userId; 
    if (!userId || userId === "null") return next(APIError.badRequest("Invalid user"));
    if (!token || token === "null") return next(APIError.badRequest("Password token is required"));
    jwt.verify(token, config.TOKEN_SECRETE);
    next();
  } catch (error) {
    next(error);
  }
};
const isVerified = async (req, res, next) => {
  try { 
    const isUser = await getUserById(req.user);
    if(!isUser) return next(APIError.notFound("Account does not exist"))
    if (isUser.verified === false) {
      req.verified = isUser.verified;  
    }
    next();
  } catch (error) {
    next(error);
  }
};
const isOrderOTPValid = async (req, res, next ) => {
  try {
     const {otp} = req.body;
     if(!otp) return next(APIError.badRequest("OTP is required"));
     const otpExist = await temporalAccExist(req.email);
     if(!otpExist) return next(APIError.notFound("OTP does not exist"));
     jwt.verify(otpExist.refreshToken, config.TOKEN_SECRETE)
     if(!compareSync(otp, otpExist.otp)) return next(APIError.badRequest("Incorrect OTP"));
     const payload = jwt.decode(otpExist.refreshToken, config.TOKEN_SECRETE);
     req.orderId = payload.orderId;
     next();
  } catch (error) {
     if (error.message === ERROR_FIELD.JWT_EXPIRED) 
      next(APIError.badRequest("OTP expired"));
    else next(error);
  }
}  
const checkRouteUsed = async (req, res, next) => {
  try { 
    if(req.usedRoute === CONSTANTS.APP_ROUTE.web && req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.rider ) return next(APIError.unauthorized("Please use the Mobile App"));
    else if(req.usedRoute === CONSTANTS.APP_ROUTE.web && req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.shopper ) return next(APIError.unauthorized("Please use the Mobile App"));
    else if(req.usedRoute === CONSTANTS.APP_ROUTE.mobile && req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.admin ) return next(APIError.unauthorized("Please use the Website"));
    else if(req.usedRoute === CONSTANTS.APP_ROUTE.mobile && req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business)return next(APIError.unauthorized("Please use the Website"));
    next();
  } catch (error) {
    next(error);
  }
};
module.exports = {
  adminRequired,
  userRequired,  
  verifyOTPToken,
  driverRequired,
  phoneIsRequired,
  tokenRequired,
  othersRequired, 
  passwordRequired,
  isVerified,
  webIsRequired,
  isOrderOTPValid,
  checkRouteUsed,
};
