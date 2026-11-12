const { default: z } = require("zod");
const { CONSTANTS } = require("../../../config");

exports.ZLoginSchemaV2 = z.object({
  email: z.string({
    description: "Email for login",
    required_error: "Email is bbbbbb",
    validation_error: "Invalid email",
  })
  .email(),
  password: z.string({
    description: "Password for login",
    required_error: "Password is required",
    validation_error: "Password must be at least 6 character",
  })
  .min(6)
  .trim(),
  accountType: z.enum(CONSTANTS.ACCOUNT_TYPE)
});
