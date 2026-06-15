const {z} = require ("zod");
const { CONSTANTS } = require("../../config");

exports.ZTemporalAccountSchema = z.object({
  email: z.string({
    description: "Email to receive otp",
    required_error:"Email is required",
  })
  .email("Invalid Email supplied"),
  phone: z.string({
    description: "Email to receive otp",
    required_error:"Email is required",
  })
  .min(11)
  .max(15)
  .optional(),
  otp: z.string({
    description: "OTP value",
    required_error: "OTP value is required",
  }),
  refreshToken: z.string({
    description: "Temporal Account Token",
    required_error: "Temporal Account Token is required"
  }),
});

