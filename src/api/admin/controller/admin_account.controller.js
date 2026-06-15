const logger = require("../../../logger");
const { userExist, createAccount, roleExist, adminAccounts, getWalletBalance } = require("../../../shared/services/interface");
const { META } = require("../../../shared/utils/actions");
const { APIError } = require("../../../shared/utils/apiError");  
const { CONSTANTS, CONFIG } = require("../../../config");
const { getUserAccounts, deleteUser, updateUserInfo, updateNotificationSetting } = require("../../../services");
const config = require("../../../config/env");
const { shortIdGen, generateStrongPassword, isStrongPassword } = require("../../../shared/utils/Generator");
const { hashSync } = require("bcryptjs");
const { registrationMailHandler } = require("../../../shared/utils/mailer"); 
const { adminWalletUpdate } = require("../../../shared/services/wallet.service");

exports.defaultAdminAccount = async () => {
  try {   
    const exist = await userExist({email:config.ADMIN_MAIL})
    // const walletExist = await getWalletBalance(exist?._id);
    // if(exist && !walletExist) {
    //   const wallet = await adminWalletUpdate({user: exist._id, balance: 0});
    //   if(!wallet) return logger.info("Admin wallet creation failed", {service: META.ACCOUNT});
    //   if(wallet?.error) return logger.info(wallet.error, {service: META.ACCOUNT});
    //   logger.info("Admin wallet created successfully", {service: META.ACCOUNT});
    // }
    if(exist) return logger.info(`${exist.type} already exist`, {
      service: META.ACCOUNT,
    }); 
    const role = await roleExist({type: CONSTANTS.ACCOUNT_ROLE_OBJ.super});
    if(role)return logger.info(`${CONSTANTS.ACCOUNT_ROLE_OBJ.super} admin already exist`, {
      service: META.ACCOUNT,
    });
    const password =  generateStrongPassword(12);
    if (!isStrongPassword(password)) {
      logger.info("Weak password detected", {service: META.ACCOUNT})
    }
    const info = {
      password: hashSync(password, 10),
      email:config.ADMIN_MAIL,
      firstName: CONFIG.APP_NAME,
      lastName: CONFIG.APP_NAME,
      phoneNumber: config.ADMIN_NUMBER,
      type: CONSTANTS.ACCOUNT_TYPE_OBJ.admin,
      role: CONSTANTS.ACCOUNT_ROLE_OBJ.super,
      userId: `GBX${shortIdGen()}`,
      verified: true
    } 
    let account = await createAccount(info);
    if(!account) return logger.info("Admin Account creation failed", {
      service: META.ACCOUNT,
    })
    if(account.error) return logger.info(account.error, {
      service: META.ACCOUNT,
    });
    logger.info('Admin Account created successfully', {
      service: META.ACCOUNT,
    }); 
    // create admin wallet
    const wallet = await adminWalletUpdate({user: account._id, balance: 0});
    if(!wallet) return logger.info("Admin wallet creation failed", {service: META.ACCOUNT});
    if(wallet?.error) return logger.info(wallet.error, {service: META.ACCOUNT});
    logger.info("Admin wallet created successfully", {service: META.ACCOUNT});
     // email admin login info
     const result = await registrationMailHandler(info.email, "Account creation", CONFIG.APP_NAME, "admin", `Admin Password:${password}`);
     if (result.error) {
       await deleteUser(info.email);
       return logger.info(ERROR_FIELD.REG_FAILED, {
        service: META.ACCOUNT,
      });
     }
     logger.info('Admin login mail sent successfully', {
      service: META.ACCOUNT,
    });  
    const infoPermit = {
      accountType: CONSTANTS.ACCOUNT_ROLE_OBJ.super,
      permission: Array.from(Object.values( CONSTANTS.ADMIN.PERMISSION_OBJ)), createdBy:"default_system", 
      target: CONSTANTS.SETTING_FIELDS_OBJ.TYPE.userManagement
    };
            const update = await updateNotificationSetting(infoPermit);
            if(!update) return logger.info("User management setting failed, try again", { service: META.ACCOUNT})
           if (update?.error) return  logger.error(update.error, {service: META.ACCOUNT});
             logger.info('Admin permissions updated', {
      service: META.ACCOUNT,
    });  
  } catch (error) {
    throw new Error(error);
  }
};

exports.getAdminAccounts = async (req, res, next) => {
  try {
    const {search} = req.query;
    const searchQuery = {
          $or:[
            {email: new RegExp(search, 'i')},
            {phoneNumber: new RegExp(search, 'i')},
            {status: new RegExp(search, 'i')},
            {role: new RegExp(search, 'i')},
            {state: new RegExp(search, 'i')},
            {firstName: new RegExp(search, 'i')},
            {lastName: new RegExp(search, 'i')},
          ],
          $and:[
            {type: CONSTANTS.ACCOUNT_TYPE_OBJ.admin},
           {_id:{$ne:req.user}}

          ]
         }
      const account = await adminAccounts(searchQuery);
      if(account || account.length === 0) return res.status(200).json({success: true, msg: "No record found", account})
      logger.info('Account Found', { service: META.ACCOUNT }); 
      res.status(200).json({success: true, msg: "Found", account});
  } catch (error) {
    next(error)
  }
}
exports.getAccounts = async (req, res, next) => {
  try {
    const {search} = req.query;
    const searchQuery = {
          $or:[
            {email: new RegExp(search, 'i')},
            {phoneNumber: new RegExp(search, 'i')},
            {status: new RegExp(search, 'i')},
            {role: new RegExp(search, 'i')},
            {state: new RegExp(search, 'i')},
            {firstName: new RegExp(search, 'i')},
            {lastName: new RegExp(search, 'i')},
          ],
          $and:[
            {type: CONSTANTS.ACCOUNT_TYPE_OBJ.shopper},
             
          ]
         }
    const account = await getUserAccounts(searchQuery);
    if ( !account || account.length === 0)
      return  res.status(200).json({success: true, msg: "No record found", account})
    logger.info('Account Found', { service: META.ACCOUNT }); 
    res.status(200).json({success: true, msg: "Found", account});
  } catch (error) {
    next(error);
  }
};
exports.getBusinessAccounts = async (req, res, next) => {
  try {
    const {search} = req.query;
    const searchQuery = {
          $or:[
            {email: new RegExp(search, 'i')},
            {phoneNumber: new RegExp(search, 'i')},
            {status: new RegExp(search, 'i')},
            {role: new RegExp(search, 'i')},
            {state: new RegExp(search, 'i')},
            {firstName: new RegExp(search, 'i')},
            {lastName: new RegExp(search, 'i')},
          ],
          $and:[
            {type: CONSTANTS.ACCOUNT_TYPE_OBJ.business},
             
          ]
         }
    const account = await getUserAccounts(searchQuery);
    if ( !account || account.length === 0)
      return  res.status(200).json({success: true, msg: "No record found", account})
    logger.info('Account Found', { service: META.ACCOUNT }); 
    res.status(200).json({success: true, msg: "Found", account});
  } catch (error) {
    next(error);
  }
};
exports.getDriverAccounts = async (req, res, next) => {
  try {
    const {search} = req.query;
    const searchQuery = {
          $or:[
            {email: new RegExp(search, 'i')},
            {phoneNumber: new RegExp(search, 'i')},
            {status: new RegExp(search, 'i')},
            {role: new RegExp(search, 'i')},
            {state: new RegExp(search, 'i')},
            {firstName: new RegExp(search, 'i')},
            {lastName: new RegExp(search, 'i')},
          ],
          $and:[
            {type: CONSTANTS.ACCOUNT_TYPE_OBJ.rider},
             
          ]
         }
    const account = await getUserAccounts(searchQuery);
    if ( !account || account.length === 0)
      return  res.status(200).json({success: true, msg: "No record found", account})
    logger.info('Account Found', { service: META.ACCOUNT }); 
    res.status(200).json({success: true, msg: "Found", account});
  } catch (error) {
    next(error);
  }
};
exports.deleteAccount = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!req.userId) return next(APIError.unauthenticated());
    if (!email)
      return next(APIError.badRequest("Email is required to perform delete"));
    if (!isValidEmail(email)) return next(APIError.badRequest("Invalid email"));
    const account = await deleteUser(email);
    if (!account) return next(APIError.customError("No Account found", 404));
    if (account.error) return next(APIError.customError(account.error, 400));
    logger.info("Delete account successful", { meta:"account-service" });
    res
      .status(200)
      .json({ success: true, msg: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};
exports.deleteAdminAccount = async (req, res, next) => {
  try {
    const { email } = req.query; 
    if (req.userType !== CONSTANTS.ACCOUNT_TYPE[2]) return next(APIError.unauthorized());
    if (!email)
      return next(APIError.badRequest("Email is required to perform delete"));
    if (!isValidEmail(email)) return next(APIError.badRequest("Invalid email"));
    const account = await deleteUser(email.trim());
    if (!account) return next(APIError.customError("No Account found", 404));
    if (account.error) return next(APIError.customError(account.error, 400));
    logger.info("Delete account successful", { meta:"account-service" });
    res
      .status(200)
      .json({ success: true, msg: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports. updateAccountStatus = async (req, res, next) => {
  try {
      const { userId} = req.body;
      const info = {}
      delete req.body.userId;
      for (const field in req.body){
        info[field] = req.body[field];
      }
      if(!info) return next(APIError.badRequest("Update detail is required"))
      if (!userId) return next(APIError.badRequest("Account ID is required"))
      if (!info?.state && !info?.role) return next(APIError.badRequest("Account state value is required"))
      if (userId === req.userId) return next(APIError.unauthorized())
      if (info?.state?.toLowerCase() === "activate") info.state = CONSTANTS.ACCOUNT_STATE_OBJ.active
      if (info?.state?.toLowerCase() === "suspend") info.state = CONSTANTS.ACCOUNT_STATE_OBJ.suspended
      if (info?.state?.toLowerCase() === "deactivate") info.state = CONSTANTS.ACCOUNT_STATE_OBJ.deactivated
      if(info?.role && info.role === CONSTANTS.ACCOUNT_ROLE_OBJ.super) return next(APIError.unauthorized("Super admin account already exist"))
      if (info?.state && !CONSTANTS.ACCOUNT_STATE.includes(info.state)) return next(APIError.badRequest("Invalid account state"))
      const update = await updateUserInfo(userId, info);
    if (!update) return next(APIError.badRequest("Account update failed, try again"));
    if(update?.error) return next(APIError.badRequest(update.error))
    logger.info("Account updated successfully", {service: META.ACCOUNT});
  res.status(200).json({success: true, msg: "Account updated successfully"});
  } catch (error) {
    next (error)
  }
}