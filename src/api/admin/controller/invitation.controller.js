const jwt = require("jsonwebtoken");
const { APIError } = require("../../../utils/apiError");
const { CONSTANTS } = require("../../../config");
const { getInvites, inviteAdmin, findInvitation, deleteInvite } = require("../services");
const logger = require("../../../logger");
const config = require("../../../config/env");
const { META, ERROR_FIELD } = require("../../../shared/utils/actions");
const { createTemporalAccount } = require("../../../shared/services/interface");
const { validateRequestData } = require("../../../shared/middleware/data_validator.middleware");
const { OTPGen } = require("../../../shared/utils/Generator");
const { hashSync } = require("bcryptjs");
const { registrationOTPMailHandler, invitationMailHandler } = require("../../../shared/utils/mailer");
const Notification = require("../../../shared/utils/Notification");

exports.sendInvitation = async (req, res, next) => {
  try { 
    const {email, role, id} = req.body; 
    if(!CONSTANTS.ACCOUNT_ROLE.includes(role)) return next (APIError.badRequest("Invalid user role"))
    if(role.toLowerCase() === CONSTANTS.ACCOUNT_ROLE_OBJ.super) return next(APIError.badRequest("Super admin already exist"))
    const payload = {email, role}
  const token = jwt.sign(payload, config.TOKEN_SECRETE, {expiresIn:"7d"})
    const invite = await inviteAdmin({email, role, id, token});
    if(!invite) return next(APIError.badRequest("invitation failed, try again")) 
    if(invite?.error) return next(APIError.badRequest(invite?.error))
      logger.info('Invitation created successfully', {
        meta: META.INVITATION,
      });
      //send invite mail
      const message = "We're excited to invite you to join Grubbex as an admin, where your expertise can shape the future of our platform and drive its success. Invitation expires after a week."
    const result = await invitationMailHandler(email, "Invitation", id, "You're invited!", message, "Grubbex Team");
    if (result?.error)
      return next(APIError.badRequest('Invitation mail failed to send'));
    logger.info('Invitation mail sent successfully', {
      meta: META.MAIL,
    });
    const notice = validateRequestData("ZNotificationSchema", {message:"Invited admin user"})
    const payLoad = {
      userId:req.userId,
      account: req.user,
      title: "Admin Invite",
      info: `Sent admin invitation to ${email} with "${role}" role`,
    }
    const sendNotice = new Notification()
    sendNotice.emit("notify", payload);
    res.status(200).json({ success: true, msg: 'Invitation sent successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getInvitations = async (req, res, next) => {
  try {
    const {search} = req.query;
    const searchQuery = {
          $or:[
            {email: new RegExp(search, 'i')},
            {role: new RegExp(search, 'i')}
          ]
    }
    const files = await getInvites(searchQuery); 
    if(!files || files.length === 0) return res.status(200).json({success: true, msg: "No invitation found", invite: files}) 
    if (files?.error) return next(APIError.badRequest(files.error));
    logger.info("Invitation retrieved successfully", {meta:META.INVITATION});
    res.status(200).json({success: true, msg: "Found", invite:files})
  } catch (error) {
    next (error)
  }
}
exports.removeInvitation = async (req, res, next) =>{
  try{
    const {id} = req.query;
    if(!id) return next(APIError.badRequest("ID is required"))
    const removeInvite = await deleteInvite(id);
  if(!removeInvite) return next(APIError.badRequest("Invitation does not exist"))
  if(removeInvite?.error) return next(APIError.badRequest(removeInvite.error));
  logger.info("Invitation deleted successfully", {meta:META.INVITATION})
  res.status(200).json({success: true, msg: "Invitation deleted successfully"});
  }catch (error) {
    next(error);
  }
}
exports.verifyInvitation = async (req, res, next) => {
  try {
    try {
      const { ref } = req.query;
      if (!ref) return next(APIError.badRequest(ERROR_FIELD.INVALID_LINK));
      const foundInvite = await findInvitation(ref);
      if (!foundInvite) {
        logger.info('Invalid Invite detected', { meta:META.INVITATION});
        return next(APIError.notFound(ERROR_FIELD.INVALID_INVITE));
      }
      //invite last for 7days
      const currentDate = new Date();
      const validDate = foundInvite.createdAt.getDate() - currentDate.getDate();
      jwt.verify(foundInvite.token, config.TOKEN_SECRETE);
      if (validDate > 7) {
        foundInvite.token = '';
        foundInvite.save();
        logger.info('Expired Invite detected', { meta:META.INVITATION});
        return next(APIError.badRequest(ERROR_FIELD.INVITE_EXPIRED));
      }
      logger.info('Invitation validated successfully', {
        service: META.INVITATION,
      });

// send otp
      const otp = OTPGen().toString();
      const hashedOTP = hashSync( otp, 10); 
      const payload = { email:foundInvite.email, otp:hashedOTP, type: CONSTANTS.ACCOUNT_TYPE_OBJ.admin };
      const expiryMin=7;
      const token = jwt.sign(payload, config.TOKEN_SECRETE, {expiresIn:`${expiryMin}m`});
      const info = {
        email:foundInvite.email,
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
      const result = await registrationOTPMailHandler(
      createTemAccount.email,
      otp,
      `${expiryMin} minutes`,
      title,
      message,
      template
      );
      if (result.error) {
        return next(APIError.badRequest(ERROR_FIELD.FAILED_OTP));
      }
      logger.info('OTP sent successfully', { service: META.MAIL });
      res.cookie('grub_ex', token, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        // maxAge: 7 * 60 * 60 * 1000,
      });

      res.status(200).json({ success: true, msg: 'Invitation is authenticated and OTP sent', email:foundInvite.email, token ,expiryMin });
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next (error)
  }
}
  