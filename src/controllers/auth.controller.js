const { compareSync, hashSync } = require("bcryptjs");
const { APIError } = require("../utils/apiError"); 
const responseBuilder = require("../utils/responseBuilder");
const { isValidEmail } = require("../utils/validation");
const { 
  defaultAccount,
  emailExist,
} = require("../services"); 
const logger = require("../logger"); 
const { CONSTANTS } = require("../config");
 
exports.defaultAdminAccount = async (req, res, next) => {
  try {
    const { firstName, lastName, password, email } = req.body;
    if (!firstName) return next(APIError.badRequest("First ame is required"));
    if (!lastName) return next(APIError.badRequest("last Name is required"));
    if (!password) return next(APIError.badRequest("Password is required"));
    if (!email) return next(APIError.badRequest("Email is required"));
    if (!isValidEmail(email))
      return next(APIError.badRequest("Email is not valid"));
    const  exist = await emailExist(email);
    if (exist) return next(APIError.customError(`${email} already exist`, 400));
    const details = { firstName, lastName, password, email};
    const hashedPassword = hashSync(password, 12);
    details.password = hashedPassword; 
    details.role = CONSTANTS.ACCOUNT_TYPE_OBJ.admin;
    const register = await defaultAccount(details);
    if (register.error) return next(APIError.customError(register.error, 400));
    logger.info("Default Account successful", { service: META.AUTH});
    const data = responseBuilder.buildUser(register.toObject());
    const response = responseBuilder.commonResponse(
      "Registration successful",
      data,
      "account"
    );
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};