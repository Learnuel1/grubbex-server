const { CONSTANTS, CONFIG } = require("../../config");
const config = require("../../config/env");
const { temporalAccExistByToken, temporalAccExist, createAccount, userExist, removeAccount, mFA_status_update, userExistByMail, getCityInfo, getTownInfo, createRecoveryTempInfo } = require("../services/interface");
const { ERROR_FIELD, META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");
const jwt = require("jsonwebtoken");
const logger = require("../../logger"); 
const shared = require("../")
const { findInvitation, deleteInviteByToken } = require("../../api/admin/services"); 
const { recoverInfoByRef, removePasswordRecoveryInfo, updateUserPass, deleteUser, getProfile, passwordRecovery, getAccountsForChat, updateAccountContact, updateUserInfo, getUserById, checkPhoneNumberExist } = require("../../services");
const { isStrongPassword, isValidEmail, isPhoneNumberValid, OTPGen, shortIdGen } = require("../utils/Generator");
const { v4: uuidv4 } = require('uuid');
const { compareSync, hashSync } = require("bcryptjs");
const NaijaStates = require('naija-state-local-government');
const { validateRequestData } = require("../middleware/data_validator.middleware");
const Notification = require("../utils/Notification");
const { deleteFileFromCloudinary, uploadFileToCloudinary, uploadSingleFileToCloudinary } = require("../utils/cloudinary");
const { registrationOTPMailHandler, registrationMailHandler, recoveryPasswordMailHandler } = require("../utils/interface");
   const notify = new Notification();
exports.registerUser = async (req, res, next) => {
  try {  
    const exist = await temporalAccExistByToken(req.token);
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
              logger.info('Registration Hacked detected', { service: META.AUTH  });
              return next(APIError.unauthenticated("Something went wrong during your registration, trying again"));
            }
          }
        });
         
      }
    }   
    if(exist.email !== req.body.email) return next(APIError.badRequest("Email mismatch")); 
    let findInvite;
    if(!req.body.ref){ 
      req.body.type = CONSTANTS.ACCOUNT_ROLE_OBJ.business;
      req.body.role = CONSTANTS.ACCOUNT_ROLE_OBJ.business;
    }else {
      const { ref } = req.body;
        await findInvitation(ref).then(data => {
          if(!data || data === null) {
            logger.info("Invalid registration token detected", {service:META.AUTH})
            return next(APIError.unauthorized("Invalid Registration process"));
          } 
          findInvite = data;
        })
      const payload =  jwt.verify(findInvite?.token, config.TOKEN_SECRETE);
      if(exist.email !== payload.email) {
        logger.info("Invitation and registration email mismatched", {service: META.AUTH})
        return next(APIError.badRequest("Registration email mismatched"))
      }
      req.body.type = CONSTANTS.ACCOUNT_TYPE_OBJ.admin;
        req.body.role = findInvite.role;
    }
    req.body.link = `${config.FRONTEND_ORIGIN_URL}-${shortIdGen(12)}`;
    let account = await createAccount(req.body);
    if(!account) return next(APIError.badRequest("Registration failed"))
    if(account.error) return next(APIError.badRequest(account.error));
    logger.info('Account created and Temporal account deleted successfully', {
      service: META.ACCOUNT,
    }); 
    if(findInvite){ 
      await deleteInviteByToken(findInvite.token);
    logger.info('Invitation deleted successfully', {
      service: META.ACCOUNT,
    }); }
    const title = "Registration Confirmation"
    res.clearCookie('grub_ex');
    const result = await registrationMailHandler(
      req.body.email,
      req.body.firstName
    );
    if (result.error) {
      return next(APIError.customError(ERROR_FIELD.REG_MAIL));
    }
    logger.info('Registration mail sent successfully', {
      service: META.MAIL,
    }); 
    notify.emit("systemNotify", {type: CONSTANTS.SETTING_FIELDS_OBJ.NOTIFICATION.onNewUserRegistration});
    notify.emit("emailer", {to: req.body.email, name: req.body.firstName, subject: "Welcome to Grubbex", event: CONSTANTS.EMAIL_TEMPLATES_OBJ.welcomeEmail});
    res.status(201).json({success: true, msg: "Registration completed successfully"});
  } catch (error) {
    next(error);
  }
};

exports.registerMobileUser = async (req, res, next) => {
  try {  
    const exist = await temporalAccExistByToken(req.token);
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
              logger.info('Registration Hacked detected', { service: META.AUTH  });
              return next(APIError.unauthenticated("Something went wrong during your registration, trying again"));
            }
          }
        });
         
      }
    }   
    if(exist.email !== req.body.email) return next(APIError.badRequest("Email mismatch")); 
    if(req.body.type === CONSTANTS.ACCOUNT_ROLE_OBJ.shopper) {
      req.body.status = CONSTANTS.ACCOUNT_STATUS_OBJ.verified;
      req.body.verified = true;
    }
    req.body.link = `${config.FRONTEND_ORIGIN_URL}-${shortIdGen(12)}`;
    let account = await createAccount(req.body);
    if(!account) return next(APIError.badRequest("Registration failed"))
    if(account.error) return next(APIError.badRequest(account.error));
    logger.info('Account created and Temporal account deleted successfully', {
      service: META.ACCOUNT,
    }); 
    
    const title = "Registration Confirmation"
    res.clearCookie('grub_ex');
    const result = await registrationMailHandler(
      req.body.email,
      req.body.firstName
    );
    if (result.error) {
      return next(APIError.customError(ERROR_FIELD.REG_MAIL));
    }
    logger.info('Registration mail sent successfully', {
      service: META.MAIL,
    });
 
    notify.emit("systemNotify", {type: CONSTANTS.SETTING_FIELDS_OBJ.NOTIFICATION.onNewUserRegistration}); 
    notify.emit("emailer", {to: req.body.email, name: req.body.firstName, subject: "Welcome to Grubbex", event: CONSTANTS.EMAIL_TEMPLATES_OBJ.welcomeEmail});
    res.status(201).json({success: true, msg: "Registration completed successfully"});
  } catch (error) {
    next(error);
  }
};
exports.deleteAccount = async (req, res, next) => {
  try {
    const { userId } = req.query; 
    if (!userId)
      return next(APIError.badRequest("Account ID is required to perform delete"));
    const account = await removeAccount(userId);
    if (!account) return next(APIError.notFound("No Account found", 404));
    if (account.error) return next(APIError.badRequest(account.error));
    logger.info("Deleted account successfully", { service:META.ACCOUNT});
    res
      .status(200)
      .json({ success: true, msg: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};
 
exports.forgotPassword = async (req, res, next) => {
  try {
    if (!req.query.username && !req.query.email && !req.query.phoneNumber)
      next(APIError.badRequest('Username or email or phone number is required'));
    let details;
    const data = {};
    for (const key in req.query) {
      data[key] = req.query[key];
    }
    if (data?.email) {
      if (!isValidEmail(data.email)) return next(APIError.badRequest("Invalid email"));
    }
    if (data?.phoneNumber) {
      if (!isPhoneNumberValid(data.phoneNumber)) return next(APIError.badRequest("Invalid phone number"));
    }
      const useExist = await userExist(data);
      if (!useExist) {
        logger.info('Forgot Password Account not Found', { meta: META.ACCOUNT });
        return next(APIError.notFound(ERROR_FIELD.ACCOUNT_NOT_FOUND));
      }
       
      if (useExist?.error) return next(APIError.badRequest(useExist?.error));
      logger.info('Forgot Password Account Found', { meta: META.ACCOUNT });
      details =sharedUtils.buildRes.removeAuth(useExist.toObject());
      details.userId = useExist._id;
      return res
        .status(200)
        .json(sharedUtils.buildRes.reqResponse ( "Found", details, "user" ));
    
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword, ref } = req.body; 
    if (!newPassword) return next(APIError.badRequest('Provide new password'));
    if (!ref && req.userType !== CONSTANTS.ACCOUNT_TYPE_OBJ.rider && req.userType !== CONSTANTS.ACCOUNT_TYPE_OBJ.shopper ) return next(APIError.badRequest('Recovery Link reference is required'));
    let check ;
    if(ref) check = await recoverInfoByRef(ref);
    if (!check) check = await temporalAccExistByToken(req.token)
    if (!check)
      return next(APIError.badRequest("Recovery process is invalid"));
    if (check?.error) return next(APIError.badRequest(check.error));
    if (!isStrongPassword(newPassword)) return next(APIError.badRequest('Password is weak'));
    const refreshToken = check.refreshToken || req.token;
    jwt.verify(refreshToken, config.TOKEN_SECRETE, async(err, _decoded) => {
      if(err){
        await removePasswordRecoveryInfo(check._id);
        logger.info("Invalid link detected", {service: META.ACCOUNT})
        return next(APIError.unauthorized("Recovery Link expired"))
      }
    })
    const hashedPass = hashSync(newPassword, 12);
   const delRecovery = await removePasswordRecoveryInfo(check._id);
   if (!delRecovery) return next(APIError.badRequest("Invalid reset link"));
   if (delRecovery?.error) return next(APIError.customError("Password reset failed, try again"));
   logger.info("Recovery info deleted successfully", {service: META.ACCOUNT})
    const reset = await updateUserPass(check.user, hashedPass);
    if (!reset) return next(APIError.badRequest(ERROR_FIELD.NOT_FOUND, 404));
    if (reset?.error) return next(APIError.customError("Password reset failed, try again"));
    logger.info('Password reset successfully', { service: META.ACCOUNT });
     res.status(200).json({ success: true, msg: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    if (!req.query.username && !req.query.email)
      next(APIError.badRequest('Username or email is required'));
    let details;
    const data = {};
    for (const key in req.query) {
      data[key] = req.query[key];
    }
    if (data.email) {
      if (!isValidEmail(data.email))
        return next(APIError.customError(ERROR_FIELD.INVALID_EMAIL, 400));
    }
    if (data.username) {
      const useExist = await checkUsername(data.username);
      if (!useExist)
        return next(APIError.customError(ERROR_FIELD.ACCOUNT_NOT_FOUND, 404));
      if (useExist.error) return next(APIError.customError(useExist.error));
      logger.info('Forgot Password', { meta: 'account-service' });
      details = buildResponse.buildUser(useExist.toObject());
      details.userId = useExist._id;
      return res
        .status(200)
        .json({ success: true, msg: 'Found', user: details });
    } else if (data.email) {
      const useExist = await checkEmail(data.email);
      if (!useExist)
        return next(APIError.customError(ERROR_FIELD.ACCOUNT_NOT_FOUND, 404));
      if (useExist.error) return next(APIError.customError(useExist.error));
      logger.info('Forgot Password', { service: META.ACCOUNT });
      details = buildResponse.buildUser(useExist.toObject());
      details.userId = useExist._id;
      return res
        .status(200)
        .json({ success: true, msg: 'found', user: details });
    }
  } catch (error) {
    next(error);
  }
};


exports.sendRecoverMail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(APIError.badRequest('Email is required'));
    const userExist = await userExistByMail(email);
    if (!userExist)
      return next(APIError.notFound(ERROR_FIELD.ACCOUNT_NOT_FOUND));
    if (userExist?.error) return next(APIError.badRequest(userExist.error)); 
     const uniqueString = uuidv4();
     let payload = {email, id:userExist.userId, type:userExist.type};
     const expiryMin = 3;
     let token = jwt.sign(payload, config.TOKEN_SECRETE,{expiresIn:`${expiryMin}m`});
    const info = {
      user: userExist._id,
      token,
      uniqueString
    };
    const saveLink = await passwordRecovery(info);
     
    if (!saveLink)
      return next(APIError.notFound(ERROR_FIELD.NOT_FOUND));
    if (saveLink?.error) return next(APIError.badRequest(saveLink.error));
    logger.info('Recovery info saved successfully', { service: META.ACCOUNT});
    const message = "We received a request to reset the password for your Grubbex account. If you did not request a password reset, please ignore this email. Your account remains secure.  If you made this request, then proceed to set a new password:";

    // account is rider or shopper send otp mail
    let result;
    //else send recovery mail
    if (userExist.type === CONSTANTS.ACCOUNT_ROLE_OBJ.business || userExist.type === CONSTANTS.ACCOUNT_ROLE_OBJ.admin) {
        result = await recoveryPasswordMailHandler(
        email,
        "Password Recovery" ,
        uniqueString,
        "Password Reset Request for Your Grubbex Account",
        message,
        "Grubbex Team"
      );
      if (result.error)
        return next(APIError.badRequest('Recovery mail failed to send'));
      logger.info('Recovery mail sent successfully', { service: META.MAIL});
     return res.status(200).json({
        ...result, token,
        msg: 'Recovery mail sent successfully',
      });
    } else {
      // generate otp and send to user mail 
      const otp = OTPGen().toString();
    const hashedOTP = hashSync( otp, 10);
    if(email && !isValidEmail(email)) return next(APIError.badRequest("Invalid email"))
     payload = {email,otp:hashedOTP, type:userExist.type};
   
     token = jwt.sign(payload, config.TOKEN_SECRETE, {expiresIn:`${expiryMin}m`});
    const info = {
      email,
      otp:hashedOTP,
      refreshToken: token,
      user:userExist._id, 
    };
    const createTemAccount = await createRecoveryTempInfo(validateRequestData("ZTemporalAccountSchema"),info);  
    if(!createTemAccount) return next(APIError.badRequest("Recovery process failed"))
      if(createTemAccount?.error) return next(APIError.badRequest(createTemAccount.error))
      result = await recoveryPasswordMailHandler(
      email,
      "Password Recovery" ,
      uniqueString,
      "Password Reset Request for Your Grubbex Account",
      message,
      "Grubbex Team", otp
    );
    if (result.error)
      return next(APIError.badRequest('Recovery mail failed to send'));
    logger.info('Recovery mail sent successfully', { service: META.MAIL});
    return res.status(200).json({
      ...result,token,
      msg: 'Recovery mail sent successfully',
    });
  }
  } catch (error) {
    next(error);
  }
};

exports.verifyPasswordReset = async (req, res, next) => {
  try {
    const { ref } = req.query;
    if (!ref) return next(APIError.badRequest("Reset reference is required"));
    const check = await recoverInfoByRef(ref);
    if (!check)
      return next(APIError.badRequest("Invalid recovery link"));
    if (check?.error) return next(APIError.badRequest(check.error));
    //verify link 
    jwt.verify(check.token, config.TOKEN_SECRETE, async (err, decode) => {
      if(err) {
        await removePasswordRecoveryInfo(check.user);
        logger.info("Invalid link detected", {service: META.ACCOUNT})
        return next(APIError.unauthorized("Link expired"))
      }
    })
    const user = await  getProfile(check.user)
    const token = jwt.sign({ref, email: user.email}, config.TOKEN_SECRETE, {expiresIn: "3m"});
    res
      .status(200)
      .json({ success: true, msg: 'Link is valid', token });
  } catch (error) {
    return next(error);
  }
};
exports.userProfile = async (req, res, next) =>{
  try{
     
    if (!req.userId) return next(APIError.unauthenticated());
    const profile = await getProfile(req.user);
    if (!profile || profile?.error) return next(APIError.badRequest(profile?.error || " Profile does not exist"));
    logger.info("Profile retrieved successfully", {service: META.ACCOUNT});
    const response = shared.buildRes.reqResponse("Found", profile, "profile");
    res.status(200).json(response);
  
  }catch(error){
    next(error);
  }
}

exports.update_2FA_status = async (req, res, next) =>{
  try{
    if (!req.userId) return next(APIError.unauthenticated());
    const {status } = req.body;
    if(status === null || status === undefined) return next(APIError.badRequest("2FA status is required"))
      if(req.body.status !== true && req.body.status !== false) return next(APIError.badRequest("Invalid 2FA status"))
    const profile = await mFA_status_update(req.userId, req.body.status); 
    if(!profile) return next(APIError.badRequest("2FA update failed, try again"))
    if(profile.error) return next(APIError.badRequest(profile.error));
    logger.info("2FA updated successfully", {service: META.ACCOUNT});
    res.status(200).json({success: true, msg: "2FA updated successfully"});
  }catch(error){
    next(error);
  }
}
exports.updateUser = async (req, res, next) => {
  try {
    if (!req.userId) return next(APIError.unauthenticated());
    const details = {};
    if(req.body?.password) delete req.body.password;
    for (const key in req.body) {
      details[key] = req.body[key];
    }
    console.log(details)
    if (details.length === 0) return next(APIError.badRequest('No data sent for update'));
    if(details?.phoneNumber){
      if(!isPhoneNumberValid(details.phoneNumber)) return next (APIError.badRequest("Phone number is not valid"));
      const numberExist = await checkPhoneNumberExist(details.phoneNumber);
      if(numberExist && numberExist._id.toString() !== req.user.toString()) return next(APIError.badRequest("Phone number is not available"));
      logger.info("Phone number verified", {service: META.ACCOUNT});
    }
    // get user profile
    const info = await getUserById(req.user);
    if(!info) return next(APIError.notFound("Account doe not exist"));
    if(info?.error) return next(APIError.badRequest(info.error));
    const {picture} = info;
    if(req.file){
      if(picture.id) {
          const exist = await deleteFileFromCloudinary(picture.id);
          if (exist?.error) return next(APIError.badRequest(exist.message));
          logger.info(`Deleted existing profile picture successfully`, {service: META.CLOUDINARY,});
      }
      const upload = await uploadSingleFileToCloudinary(req.file, req,);
      
      if (upload?.error) return next(APIError.badRequest(upload.message));
          logger.info('Profile picture uploaded successfully', {  service: META.CLOUDINARY,   });
          details.picture = {
            id: upload.public_id,
            url: upload.secure_url,
          }
        
    }
    const update = await updateUserInfo(req.userId, details);
    if (!update) return next(APIError.customError(ERROR_FIELD.NOT_FOUND, 404));
    if (update.error) return next(APIError.customError(update.error, 400));
    const response = shared.buildRes.removeAuth(update.toObject());
    const {likers, reviews, createdAt, updatedAt, availability, raters, ...data} = response;
    data.picture = {url:data.picture.url}
    logger.info("Profile details updated successfully", { service: META.ACCOUNT });
    res.status(200).json({status: "success", msg: "Profile updated successfully", data});
  } catch (error) {
    next(error);
  }
};

exports.countryStates = async (req, res, next) => {
  try{ 
    res.status(200).json({success: true, msg: "Found", state: NaijaStates.states()})
  } catch (error){
    next(error);
  }
}
exports.countryStatesLGA = async (req, res, next) => {
  try{
    const {state} = req.query;
    if(!state) return next(APIError.badRequest("State is required"))
    res.status(200).json({success: true, msg: "Found", state: NaijaStates.lgas(state)})
  } catch (error){
    next(error);
  }
}
exports.countryCity = async (req, res, next) => {
  try{
    const city = await getCityInfo()
    res.status(200).json({success: true, msg: "Found", city})
  } catch (error){
    next(error);
  }
}
exports.countryStatesCityTown = async (req, res, next) => {
    try{
      const {cityId} = req.query; 
      const town = await getTownInfo(cityId)
      res.status(200).json({success: true, msg: "Found",  town})
    } catch (error){
      next(error);
    }
  }
exports.getAccountsForChat = async (req, res, next) => {
  try{
    const info = {
      userId: req.userId,
      type: req.userType
    }
    let accounts = await getAccountsForChat(info);
    if(!accounts) return next(APIError.notFound("No account found"));
    if(accounts.error) return next(APIError.badRequest(accounts.error));
    accounts = accounts.filter(x => x.userId !== req.userId);
    const response = accounts.map((account ) => {
      return { id: account.userId, name: `${account.firstName} ${account.lastName}`, picture:accounts?.picture?.length > 0 ? accounts.picture[0]?.url: "" };
    });
    logger.info("Chat accounts retrieved successfully", { service: META.ACCOUNT });
    res.status(200).json({success: true, msg: "Found", accounts: response});
  } catch ( error ) {
    next(error)
  }
}
exports.updateUserContact = async (req, res, next ) => {
  try{
      const {phoneNumber } = req.body;
      if(!phoneNumber) return next(APIError.badRequest("Contact is required"));
      if(!isPhoneNumberValid(phoneNumber)) return next(APIError.badRequest("Invalid phone number"));
      const user = await updateAccountContact(req.user, phoneNumber);
      if(!user) return next(APIError.badRequest("Contact update failed, try again"));
      if(user.error) return next(APIError.badRequest(user.error));
      logger.info("Contact updated successfully", {service: META.ACCOUNT});
      res.status(200).json({success: true, msg: "Contact updated successfully"});
  } catch (error) {
    next (error);
  }
}

exports.updatePassword = async (req, res, next) => {
  try {
    const {currentPassword, newPassword } = req.body;
    if(!currentPassword ) return next (APIError.badRequest("Current Password is required"));
    if(!newPassword ) return next (APIError.badRequest("New Password is required"));
    if(!isStrongPassword(newPassword)) return next(APIError.badRequest("New Password is weak"));
    if(currentPassword === newPassword) return next(APIError.badRequest("new password can't be same as current password"))
    const info = await getUserById(req.user);
    if(info.refreshToken.length ===0) return next(APIError.unauthenticated())
    if(!info) return next(APIError.notFound("Account doe not exist"));
    if(info?.error) return next(APIError.badRequest(info.error));
    // verify current password
    if(!compareSync(currentPassword, info.password)) return next(APIError.badRequest("Current password is incorrect"));
    logger.info("Current password confirmed successfully", {service: META.ACCOUNT})
    const hashedPassword = hashSync(newPassword, 10);
    const updated = await updateUserPass(req.user, hashedPassword)
    if (!updated) return next(APIError.badRequest("Password update failed, try again"));
    if (updated?.error) return next(APIError.badRequest(updated.message));
    logger.info('Password updated successfully', {  service: META.ACCOUNT });

    res.clearCookie('grub_ex');
			res
				.status(200)
				.json({ success: true, msg: 'You have successfully change your password' });
  } catch (error) {
    next (error);
  }
}