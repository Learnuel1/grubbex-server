const { hashSync, compareSync } = require ("bcryptjs");
const { OTPGen, isValidEmail } =require ("../utils/Generator");
const config =require ("../../config/env");
const jwt = require("jsonwebtoken");
const {APIError} =  require("../utils/apiError");
const { META, ERROR_FIELD } = require("../utils/actions");
 
const logger = require("../../logger");
const { temporalAccExistByToken, createTemporalAccount, temporalAccExist, userExistByMail, send2FA_OTP, createRecoveryTempInfo } = require("../services/interface");
const { validateRequestData } = require("../middleware/data_validator.middleware");
const { registrationOTPMailHandler } = require("../utils/interface");

exports.createTemporalAccount = async (req, res, next) => {
  try{
    const {email} = req.body;
    const otp = OTPGen().toString();
    const hashedOTP = hashSync( otp, 10);
    if(email && !isValidEmail(email)) return next(APIError.badRequest("Invalid email"))
    const payload = {email,otp:hashedOTP};
    const expiryMin=2;
    const token = jwt.sign(payload, config.TOKEN_SECRETE, {expiresIn:`${expiryMin}m`});
    const info = {
      email,
      otp:hashedOTP,
      refreshToken: token,
    };
    const createTemAccount = await createTemporalAccount(validateRequestData("ZTemporalAccountSchema"),info);
    if(!createTemAccount) return next(APIError.badRequest("Registration process failed"))
    if(createTemAccount.error) return next(APIError.badRequest(createTemAccount.error))
    logger.info("Temporal Account created successfully", {service:META.ACCOUNT})
    const template = "all_otp";
    const title = "Complete Your Registration"
    const message = " Please enter the code below on the registration page to complete the process."
    //send OTP TO MAIL
    //registrationOTPMailHandler
    const result = await registrationOTPMailHandler(
      createTemAccount.email,
      otp,
      `${expiryMin} minutes`,
      title,
      message,
      template,
      "Grubby Team",
      "Registration OTP",
    );
    if (result.error) {
      return next(APIError.customError(result.error));
    }
    logger.info('OTP sent successfully', { service: META.MAIL });
    res.cookie('grub_ex', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      // maxAge: 7 * 60 * 60 * 1000,
    });
    res
      .status(200)
      .json({ success: true, msg: 'OTP Sent Successfully', token ,expiryMin});
  }catch(error){
    next(error);
  }
}

exports.renewOTP = async (req, res, next) => {
  try{
    const email = req.email?.toLowerCase();
    const otp = OTPGen().toString();
    const hashedOTP = hashSync(otp, 10);
    if(email && !isValidEmail(email)) return next(APIError.badRequest("Invalid email"))
    const payload = {email,otp};
    const expiryMin=2;
    const token = jwt.sign(payload, config.TOKEN_SECRETE, {expiresIn:`${expiryMin}m`});
    const info = {
      email,
      otp:hashedOTP,
      refreshToken: token,
    }; 
    const otpType = await userExistByMail(email);
    let mailTemplate = otpType ? "mfa" : "all_otp";
    let mailTitle = otpType ? "Login OTP" : "Registration OTP";
    let resend_OTP ;
    if(otpType && otpType?.mfa){
      resend_OTP = await send2FA_OTP(validateRequestData("ZTemporalAccountSchema"), info); 
      
      if(!resend_OTP) return next(APIError.badRequest("2FA OTP failed to send"))
        if(resend_OTP?.error) return next(APIError.badRequest(resend_OTP.error))
        logger.info("2FA OTP created successfully", {service: META.MFA})
    } else{
      resend_OTP= await createTemporalAccount(validateRequestData("ZTemporalAccountSchema"),info);
      if(!resend_OTP) return next(APIError.badRequest("Registration process failed"))
      if(resend_OTP.error) return next(APIError.badRequest(resend_OTP.error))
      logger.info("Temporal Account created successfully", {service:META.ACCOUNT})
    }
    const title = "Complete Your Registration"
    const message = " Please enter the code below on the registration page to complete the process."
  //send OTP TO MAIL
    const result = await registrationOTPMailHandler(
      resend_OTP.email,
      otp,
      `${expiryMin} minutes`,
      title,
      message,
      mailTemplate, 
    );
    if (result.error) {
      return next(APIError.customError(ERROR_FIELD.FAILED_OTP));
    }
    logger.info('OTP resend successful', { service: META.MAIL });
    res.cookie('grub_ex', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      // maxAge: 7 * 60 * 60 * 1000,
    });
    res
      .status(200)
      .json({ success: true, msg: 'OTP Sent Successfully', token ,expiryMin});
  
  }catch(error){
    next(error);
  }
}

exports.renewRecoveryOTP = async (req, res, next) => {
  try{
    const email = req.email;
    const otp = OTPGen().toString();
    const hashedOTP = hashSync(otp, 10);
    if(email && !isValidEmail(email)) return next(APIError.badRequest("Invalid email"))
    const payload = {email,otp};
    const expiryMin=7;
    const token = jwt.sign(payload, config.TOKEN_SECRETE, {expiresIn:`${expiryMin}m`});
    const info = {
      email,
      otp:hashedOTP,
      refreshToken: token,
    }; 
    const otpType = await userExistByMail(email);
    let mailTemplate = otpType ? "mfa" : "all_otp";
    let mailTitle = otpType ? "Login OTP" : "Registration OTP";
    let resend_OTP ;
    if(otpType && otpType?.mfa){
      resend_OTP = await send2FA_OTP(validateRequestData("ZTemporalAccountSchema"), info); 
      
      if(!resend_OTP) return next(APIError.badRequest("2FA OTP failed to send"))
        if(resend_OTP?.error) return next(APIError.badRequest(resend_OTP.error))
        logger.info("2FA OTP created successfully", {service: META.MFA})
    } else{
      resend_OTP= await createTemporalAccount(validateRequestData("ZTemporalAccountSchema"),info);
      if(!resend_OTP) return next(APIError.badRequest("Registration process failed"))
      if(resend_OTP.error) return next(APIError.badRequest(resend_OTP.error))
      logger.info("Temporal Account created successfully", {service:META.ACCOUNT})
    }
    const title = "Complete Your Registration"
    const message = " Please enter the code below on the registration page to complete the process."
  //send OTP TO MAIL
    const result = await registrationOTPMailHandler(
      resend_OTP.email,
      otp,
      `${expiryMin} minutes`,
      title,
      message,
      mailTemplate, 
    );
    if (result.error) {
      return next(APIError.customError(ERROR_FIELD.FAILED_OTP));
    }
    logger.info('OTP resend successful', { service: META.MAIL });
    res.cookie('grub_ex', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      // maxAge: 7 * 60 * 60 * 1000,
    });
    res
      .status(200)
      .json({ success: true, msg: 'OTP Sent Successfully', token ,expiryMin});
  
  }catch(error){
    next(error);
  }
}

exports.verifyOTP = async (req, res, next) => {
  try {
    const {otp} = req.body ;
    if (!otp) return next(APIError.badRequest('OTP is required'));
    let exist = await temporalAccExistByToken(req.token);
    if (!exist) {
      jwt.verify(req.token, config.TOKEN_SECRETE, async (err, decode) => {
        if (err) {
          logger.info('Token reuse detected', { service: META.AUTH});
          return next(APIError.unauthorized(ERROR_FIELD.INVALID_TOKEN));
        } 
        logger.info('Token reuse detected', { service: META.AUTH });
        return next(APIError.unauthorized(ERROR_FIELD.TOKEN_NOT_FOUND));
      });
      return next(APIError.unauthorized(ERROR_FIELD.INVALID_TOKEN));
    } else {
      //if token is invalid send return to registration page
      if (exist) {
        jwt.verify(req.token, config.TOKEN_SECRETE, async(err, _decoded) => {
          if (err) {
            if (err.name !== 'TokenExpiredError') {
             await temporalAccExist(exist.email)
              logger.info('Hacked token detected', { service: META.AUTH  });
              return next(APIError.unauthorized("OTP Expired"));
            }
          }
        });
         
      }
    } 
    if (!compareSync( otp.toString(), exist.otp )) return next(APIError.unauthorized(ERROR_FIELD.INVALID_OTP));
    logger.info("OTP verified successfully", {service: META.AUTH});
    res.clearCookie('grub_ex');
    const payload = {
      id:exist._id, 
      email:exist.email, 
      otp:hashSync(otp, 10), 
    }
      let registrationToken = jwt.sign(payload, config.TOKEN_SECRETE, {
        expiresIn: '1d',
      });
      payload.refreshToken = registrationToken
      const createTemAccount = await createTemporalAccount(validateRequestData("ZTemporalAccountSchema"), payload);
      if(!createTemAccount) return next(APIError.badRequest("OTP verification failed"))
      if(createTemAccount.error && createTemAccount.error.toLowerCase() === "account already exist") {
        payload.type = createTemAccount.data.type;
       
        payload.refreshToken = registrationToken = jwt.sign(payload, config.TOKEN_SECRETE, {
          expiresIn: '4m',
        }); 
        payload.user = createTemAccount.data._id;
         const temAccount = await createRecoveryTempInfo(validateRequestData("ZTemporalAccountSchema"),payload);  
        if(!temAccount) return next(APIError.badRequest("Recovery process failed"))
        if(temAccount?.error) return next(APIError.badRequest(temAccount.error))
      }
      else if(createTemAccount.error) return next(APIError.badRequest(createTemAccount.error))
      res.cookie('grub_ex', registrationToken,{
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        // maxAge: 24 * 60 * 60 * 1000,
      });
      res
        .status(200)
        .json({ success: true, msg: 'OTP verified Successfully', token:registrationToken});
  }catch(error){
    next(error)
  }
}