const ACTIONS = {  
  MESSAGE: "msg",
  EMAIL: "email",
  COMPLETED: { success: true, msg: "Operation Successful" },
  RESET_PASSWORD: "Password Recovery",
  INCOMPLETE_REG: "Existing incomplete registration",
};

 

const ERROR_FIELD = {
  INVALID_EMAIL: "Email is Invalid",
  JWT_EXPIRED: "jwt expired",
  EXPIRED_TOKEN: "Token has expired",
  NOT_FOUND: "No Record Found",
  ACCOUNT_NOT_FOUND: "Account was not found",
  INVALID_LINK: "Invalid Link",
  INVITE_EXPIRED: "Invitation have expire",
  INVALID_INVITE: "Invite link is invalid",
  REG_FAILED: "Registration Mail Failed",
  INVALID_OTP: "Invalid OTP",
  INVALID_TOKEN: "Invalid Token",
  TOKEN_NOT_FOUND: "Token not found", 
};

const META = { 
  PAYSTACK_SERVICE: "paystack",
  PAYSTACK_PLAN_SERVICE: "paystack",
  FLUTTER_WAVE_SERVICE: "flutter-wave",
  MAIL:'mail-service',
  AUTH: "authentication",
  ACCOUNT: "account",
  ITEM: "item",
  CLOUDINARY: "cloudinary",
  BOOKING: "booking",
  PAYMENT:"payment",
  KYC:"kyc",
  TEMPORAL_REF: "temporal_reference",
  ORDER: "order",
  SUBSCRIPTION: "subscription",
}

module.exports = {
  ERROR_FIELD,
  ACTIONS,
  META,
};
