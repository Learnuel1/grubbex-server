 
const { hashSync, compareSync } = require('bcryptjs');
const {
  usernameExist,
  emailExist,
  createAdmin,
  getAllAccounts,
  passwordRecovery, 
  updateUserPass,
  updateUserInfo,
  deleteUser,
  deleteTempUser,
  registerUser,
  userExistByEmail,
  getPasswordRecoveryInfo,
  getExistingPicture,
  updateUserProfile,
  removePasswordRecoveryInfo,
  getProfile,
  recoverInfoByRef,
  getUserById,
} = require('../services');
const { ERROR_FIELD, META } = require('../shared/utils/actions');
const { APIError } = require('../utils/apiError');
const { isValidEmail, OPTDigitGen } = require('../utils/validation');
const resBuilder = require('../shared/utils/seedData');
const { checkEmail, checkByEmail } = require('../services/account.services');
const { v4: uuidv4 } = require('uuid');
const { 
  registrationMailHandler,
  registrationOTPMailHandler,
  invitationMailHandler,
} = require('../utils/mailer');
const logger = require('../logger');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const TemporalAccountModel = require('../models/temporal.account.model'); 
const { CONSTANTS } = require('../config');
const { cloudinary, accessPath } = require('../utils/cloudinary');
const { mFA_status_update } = require('../shared/services/interface');
const { findInvitation } = require('../api/admin/services');
const { recoveryPasswordMailHandler } = require('../shared/utils/mailer');
 
exports.registerUser = async (req, res, next) => {
  try {
    // let token = req.cookie?.jwt;
    // if (!token) token = req.headers?.authorization?.split(' ')[1];
    // if (!token) token = req.headers?.cookie?.split('=')[1];
    // if(!token) return next(APIError.customError("Token is required", 403));
    // const verify =  jwt.verify(token, config.TOKEN_SECRETE);
    // if(!verify) {
    //   return next(APIError.customError(ERROR_FIELD.INVALID_TOKEN, 403));
    // }

    let {firstName, lastName, password, email, dob, role } = req.body;
    if (!firstName) return next(APIError.badRequest('First name is required'));
    if (!lastName) return next(APIError.badRequest('Last name is required'));
    if( CONSTANTS.TEST_EMAIL.includes(email.toLowerCase())) password = CONSTANTS.TEST_PASSWORD
    if (!password) return next(APIError.badRequest('Password is required'));
    if (!email) return next(APIError.badRequest('Email is required'));
    if ( !role)   return next (APIError.badRequest("Provide account type"));
    if(!CONSTANTS.ACCOUNT_TYPE.includes(role.toLowerCase()) || role.toLowerCase() === CONSTANTS.ACCOUNT_TYPE[1]) return next(APIError.badRequest('Invalid account type'));
   
    if (password.length < 6) return next(APIError.badRequest("Password must be at least 6 characters"));
    if (!isValidEmail(email))return next(APIError.badRequest(ERROR_FIELD.INVALID_EMAIL));
    const findEmail = await emailExist(email);
    if(findEmail) return next(APIError.customError(`Account already exist`, 400));
    // const payload = jwt.decode(token, config.TOKEN_SECRETE);
    const exist = await TemporalAccountModel.findOne({email:email}).exec();
    if(!exist){
      logger.info("Registration hack detected", {service: "Registration"});
      return next(APIError.customError("Invalid registration", 403));
    }
    if(exist.email !== email) return next(APIError.badRequest("Email mismatch"));
    // if(!compareSync(payload.otp, exist.otp)) return next(APIError.badRequest("Invalid registration OTP"));

    const details = {lastName, firstName, email, dob, role};
    details.password = hashSync(password, 12);
    const desc = {
      type: "Wallet Creation",
      id: "",

    }
    details.transaction = [desc];
    details.description = CONSTANTS.TRANSACTION_DESC[0];
    const account = await registerUser(details);
    if(!account) return next(APIError.badRequest("Registration failed"))
    if(account.error) return next(APIError.badRequest(account.error));
    await deleteTempUser(email);
    logger.info('Temporal account deleted successfully', {
      service: META.ACCOUNT,
    }); 
    // res.clearCookie('jwt');
    const result = await registrationMailHandler(
      email,
      firstName
    );
    if (result.error) {
      return next(APIError.customError(ERROR_FIELD.REG_MAIL));
    }
    logger.info('Registration mail sent successfully', {
      service: META.MAIL,
    });
    res.status(201).json({success: true, msg: "Registration completed successfully"});
  } catch (error) {
    next(error);
  }
};
exports.verifyOTP = async (req, res, next) => {
  try {
    let token = req.cookie?.jwt;
    if (!token) token = req.headers?.authorization?.split(' ')[1];
    if (!token) token = req.headers?.cookie?.split('=')[1];
    if(!token) return next(APIError.customError("Token is required", 403));
    let otp = req.body.otp.toString();
    if (!otp) return next(APIError.badRequest('OTP is required'));
    const exist = await TemporalAccountModel.findOne({refreshToken:token}).exec();
    if (!exist) {
      jwt.verify(token, config.TOKEN_SECRETE, async (err, decode) => {
        if (err) {
          const payload = jwt.decode(token, config.TOKEN_SECRETE);
          const failedUser = await TemporalAccountModel.findOne({
           email: payload?.email
          }); 
          failedUser.refreshToken = [];
          failedUser.otp ='';
          failedUser.save();
          logger.info('Token reuse detected', { service: META.MAIL});
          return next(APIError.customError(ERROR_FIELD.INVALID_TOKEN, 403));
        } 
        logger.info('Token reuse detected', { service: META.MAIL });
        return next(APIError.customError(ERROR_FIELD.TOKEN_NOT_FOUND, 403));
      });
      return next(APIError.customError(ERROR_FIELD.INVALID_TOKEN, 403));
    } else {
      //if token is invalid send return to registration page
      if (exist) {
        jwt.verify(token, config.TOKEN_SECRETE, (err, _decoded) => {
          if (err) {
            if (err.name !== 'TokenExpiredError') {
              exist.refreshToken = [];
              exist.otp = '';
              exist.save();
              logger.info('Hacked token detected', { service: META.MAIL  });
              return next(APIError.customError("OTP Expired", 403));
            }
          }
        });
         
      }
    } 
    if (!compareSync(otp.toString(), exist.otp)) return next(APIError.customError(ERROR_FIELD.INVALID_OTP, 403));
    exist.refreshToken = [];
    exist.save();  
    res.clearCookie('jwt')
      const payload ={id:exist._id, email:exist.email, otp}
      const registrationToken = jwt.sign(payload, config.TOKEN_SECRETE, {
        expiresIn: '1d',
      });
      res.cookie('jwt', registrationToken,{
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
      });
      res
        .status(200)
        .json({ success: true, msg: 'OTP verified Successfully', token:registrationToken});
  }catch(error){
    next(error)
  }
}
exports.createAccount = async (req, res, next) => {
  try {
    let token = req.cookie?.jwt;
    if (!token) token = req.headers?.authorization?.split(' ')[1];
    if (!token) token = req.headers?.cookie?.split('=')[1];
    if (!token)
      return next(APIError.customError(ERROR_FIELD.TOKEN_NOT_FOUND, 403));
    let otp = req.body.otp.toString();
    if (!otp) return next(APIError.badRequest('OTP is required'));
    const verify = jwt.verify(token, config.TOKEN_SECRETE);
   
    const exist = await TemporalAccountModel.findOne({
      refreshToken: token,
    }).exec();
    if (!exist) return next(APIError.customError(ERROR_FIELD.INVALID_OTP, 403));
    if (!compareSync(otp, exist.otp))
      return next(APIError.customError(ERROR_FIELD.INVALID_OTP, 403));
      let payload = { id: verify.id, type: verify.type };
    const data = buildResponse.buildTemporalUser(exist.toObject());
    data.status = CONSTANTS.ACCOUNT_STATUS[1];   
    
    const account = await registerUser(data);
    if (!account)
      return next(APIError.customError(ERROR_FIELD.REG_FAILED, 400));
    if (account.error) return next(APIError.customError(account.error));
    logger.info('Registration completed successfully', {
      meta: META.ACCOUNT,
    });
    await deleteTempUser(payload.id);
    logger.info('Temporal account deleted successfully', {
      meta: META.ACCOUNT,
    });
    //send registration TO MAIL
    const result = await registrationMailHandler(
      account.email,
      account.username
    );
    if (result.error) {
      return next(APIError.customError(ERROR_FIELD.REG_MAIL));
    }
    logger.info('Registration mail sent successfully', {
      meta: 'mail-service',
    });
    res.clearCookie('jwt');
    res
      .status(201)
      .json({ success: true, msg: 'Registration Completed Successfully' });
  } catch (error) {
    if (error.message === ERROR_FIELD.JWT_EXPIRED) {
      logger.info('Expired token detected', { meta: 'account-service' });
      next(APIError.customError(ERROR_FIELD.EXPIRED_TOKEN, 403));
    }
    next(error);
  }
};

exports.temporalUserEmailOTP = async (req, res, next) => {
  try{
    const {email} = req.body;
    if(!email) return next(APIError.badRequest("Email is required"));
    if (!isValidEmail(email))
    return next(APIError.badRequest(ERROR_FIELD.INVALID_EMAIL));
   const findEmail = await emailExist(email);
    if(findEmail) return next(APIError.customError(`${email} already exist`, 400));
      
    let user = {};
      exist = await TemporalAccountModel.findOne({ email }).exec(); 
    const payload = { email };
      const OTPToken = jwt.sign(payload, config.TOKEN_SECRETE, {
        expiresIn: '7m',
      });
      let otp ="";
      if (CONSTANTS.TEST_EMAIL.includes(email.toLowerCase())) otp = "000000";
      else otp = OPTDigitGen();
      const hashedOTP = hashSync(otp.toString(), 10);
      user.refreshToken = [OTPToken];
      user.otp = hashedOTP;
      user.email=email
      if(exist) {
         await TemporalAccountModel.findOneAndUpdate({ email:email },{...user},{returnOriginal: false}).exec();
        logger.info("Existing Temporal OTP updated", {service: "Temporal"});
      }else{
        await TemporalAccountModel.create({ ...user });
        logger.info("Temporal OTP created", {service: "Temporal"});
      } 
      const expiryMin=7;
      //send OTP TO MAIL
      const result = await registrationOTPMailHandler(
        user.email,
        otp,
        `${expiryMin} minutes`
      );
      if (result.error) {
        return next(APIError.customError(ERROR_FIELD.FAILED_OTP));
      }
      logger.info('OTP sent successfully', { service: META.MAIL });
      res.cookie('jwt', OTPToken, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 60 * 60 * 1000,
      });
      res
        .status(200)
        .json({ success: true, msg: 'OTP Sent Successfully', token: OTPToken ,expiryMin});
    
  } catch (error) {
    next(error)
  }
}
exports.temporalUserOpt = async (req, res, next) => {
  try {
    let refreshToken = req.cookie?.jwt;
    if (!refreshToken) refreshToken = req.headers?.authorization?.split(' ')[1];
    if (!refreshToken) refreshToken = req.headers?.cookie?.split('=')[1];
    if (!refreshToken)
      return next(APIError.customError(ERROR_FIELD.TOKEN_NOT_FOUND, 403));
    const email = req.body.email;
    if (!isValidEmail(email))
      return next(APIError.badRequest(ERROR_FIELD.INVALID_EMAIL));
    const exist = await TemporalAccountModel.findOne({ refreshToken });
    if (!exist) {
      jwt.verify(refreshToken, config.TOKEN_SECRETE, async (err, decode) => {
        if (err) {
          const payload = jwt.decode(refreshToken, config.TOKEN_SECRETE);
          const failedUser = await TemporalAccountModel.findOne({
           _id: payload.id
          }); 
          failedUser.refreshToken = [];
          failedUser.save();
          logger.info('OTP reuse detected', { meta: 'mail-service' });
          return next(APIError.customError(ERROR_FIELD.INVALID_TOKEN, 403));
        }
        logger.info('OTP reuse detected', { meta: 'mail-service' });
        return next(APIError.customError(ERROR_FIELD.TOKEN_NOT_FOUND, 403));
      });
      return next(APIError.customError(ERROR_FIELD.INVALID_TOKEN, 403));
    } else {
      //if token is invalid send return to registration page
      if (exist) {
        jwt.verify(refreshToken, config.TOKEN_SECRETE, (err, _decoded) => {
          if (err) {
            if (err.name !== 'TokenExpiredError') {
              exist.refreshToken = [];
              exist.save();
              logger.info('Hacked token detected', { meta: META.ACCOUNT });
              return next(APIError.customError("OTP Expired", 403));
            }
          }
        });
        if (exist.email !== email) {
          logger.info('Registration email mismatch detected', {
            meta: 'mail-service',
          });
          return next(APIError.customError("Email mismatch", 403));
        }
      }
      const payload = { id: exist._id, type: exist.type };
      const OTPToken = jwt.sign(payload, config.TOKEN_SECRETE, {
        expiresIn: '7m',
      });
      const otp = OPTDigitGen();
      exist.refreshToken = [OTPToken];
      exist.otp = otp;
      exist.save();
      const expiryMin=7;
      //send OTP TO MAIL
      const result = await registrationOTPMailHandler(
        exist.email,
        otp,
        `${expiryMin} minutes`
      );
      if (result.error) {
        return next(APIError.customError(ERROR_FIELD.FAILED_OTP));
      }
      logger.info('OTP sent successfully', { meta: 'mail-service' });
      res.cookie('jwt', OTPToken, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 60 * 60 * 1000,
      });
      res
        .status(200)
        .json({ success: true, msg: 'OTP Sent Successfully', token: OTPToken ,expiryMin});
    }
  } catch (error) {
    next(error);
  }
};


exports.registerAdmin = async (req, res, next) => {
  try {
    const { name, password, email } = req.body;
    const { id } = req.query;
    
    let exist = await emailExist(email);
    if (exist) return next(APIError.customError(`${email} already exist`, 400));
    const invite = await findInvitation(id);
    if (!invite)
      return next(
        APIError.badRequest('Invite ID or token is required, click on link')
      );
    const currentDate = new Date();
    const validDate = currentDate.getDate() - invite.createdAt.getDate();
    if (validDate > 7) {
      await deleteInvite(id);
      logger.info('Expired Invite detected', { meta: META.INVITATION });
      return next(APIError.customError(ERROR_FIELD.INVITE_EXPIRED, 400));
    }
    if (email !== invite.email) {
      logger.info('Admin registration email mismatch detected', {
        meta: META.INVITATION,
      });
      return next(APIError.badRequest('Email mismatched'));
    }
    const details = { email };
    const hashedPassword = hashSync(password, 12);
    details.password = hashedPassword;
    if (req.body.phone) details.phone = req.body.phone;
    details.type = CONSTANTS.ACCOUNT_TYPE_OBJ.admin;
    details.role = invite.role;
    details.status = CONSTANTS.ACCOUNT_STATUS[1];
    details.firstName = req.body.firstName;
    details.lastName= req.body.lastName;
    const register = await createAdmin(details);
    if (register.error) return next(APIError.badRequest(register.error));
    logger.info('Admin registration successful', { meta: META.ACCOUNT});
    await deleteInvite(id);
    logger.info('Invite id invalided', { meta: META.ACCOUNT });
    const data = resBuilder.removeAuth(register.toObject());
    const result = await registrationMailHandler(email);
    if (result.error) {
      await deleteUser(email);
      return next(APIError.customError(ERROR_FIELD.REG_FAILED));
    }
    const response = resBuilder.commonResponse(
      'Registration successful',
      data,
      'account'
    );
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

 
exports.sendRecoverMail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(APIError.badRequest('Email is required'));
    const userExist = await userExistByEmail(email);
    if (!userExist)
      return next(APIError.notFound(ERROR_FIELD.ACCOUNT_NOT_FOUND));
    if (userExist?.error) return next(APIError.badRequest(userExist.error)); 
     const uniqueString = uuidv4();
     const payload = {email, id:userExist.userId};
     const token = jwt.sign(payload, config.TOKEN_SECRETE,{expiresIn:"7m"})
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
    const message = "We received a request to reset the password for your Grubbex account. If you did not request a password reset, please ignore this email. Your account remains secure.  If you made this request, please click the link below to set a new password:";
    const result = await recoveryPasswordMailHandler(
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
    res.status(200).json({
      ...result,
      msg: 'Recovery mail sent successfully',
    });
  } catch (error) {
    next(error);
  }
};



exports.profileUpdate = async (req, res, next) =>{
  try{
    const {firstName, lastName} = req.body;
    if (!firstName) return next(APIError.badRequest("Firstname is required"));
    if (!lastName) return next(APIError.badRequest("Lastname is required"));
    
    // use cloudinary to store image
    if(req.body.imageData) {
      const pictureExist = await getExistingPicture(req.userId);
      if(pictureExist.imageId){
        await cloudinary.uploader.destroy(pictureExist.imageId,{
          upload_preset:accessPath.preset,
          folder: accessPath.folder,
        });
        logger.info("Deleted existing image successfully", {service: META.CLOUDINARY});
      }
      const upload = await cloudinary.uploader.upload(req.body.imageData, {
        upload_preset:accessPath.preset,
        folder: accessPath.folder,
      });
      logger.info("Image uploaded successfully", {service: META.CLOUDINARY});
      const details = {firstName, lastName, imageUrl: upload.secure_url, imageId: upload.public_id};
      const save = await updateUserProfile(req.userId, details);
      if(!save) return next(APIError.customError("Profile updated failed, try again", 400))
      if(save.error) return next(APIError.badRequest(save.error));
      logger.info("Image saved successfully", {service: META.ACCOUNT});
      res.status(200).json({success: true, msg: "Profile Updated successfully"});
    } else{
      const details = {firstName, lastName, imageUrl: null, imageId: null};
      const save = await updateUserProfile(req.userId, details);
      if(!save) return next(APIError.customError("Profile updated failed, try again", 400))
      if(save.error) return next(APIError.badRequest(save.error));
      logger.info("Image saved successfully", {service: META.ACCOUNT});
      res.status(200).json({success: true, msg: "Profile Updated successfully"});
    }
  
  }catch(error){
    next(error);
  }
}



