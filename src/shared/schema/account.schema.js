const {z} = require("zod");
const { CONSTANTS } =require("../../config");

exports.ZAccountSchema = z.object({
  email: z
    .string({
      description: "Email for the account",
      required_error: "Email is required",
      invalid_type_error: "Email is invalid"
    })
    .email("Invalid Email supplied")
    .toLowerCase()
    .trim(),
  firstName: z.string({
    description: "First Name for the account",
    required_error: "Account First Name is required",
    invalid_type_error: "First Name format is invalid",
  }),
  lastName: z.string({
    description: "Last Name for the account",
    required_error: "Account Last Name is required",
  }),
  otherName: z.string({
    description: "Last Name for the account",
    required_error: "Account Last Name is required",
  })
  .optional(),
  password: z.string({
    description: "Last Name for the account",
    required_error: "Account Last Name is required",
  }),
  phoneNumber: z.string({
    description: "Phone Number for the account",
    required_error: "Phone Number is required",
    invalid_type_error: "Phone Number is invalid"
  })
  .max(15)
  .min(11)
  .trim(),
  picture: z
    .array(z.object({
     id: z.string({
        description: "Photo ID for the account",
     }),
     url: z.string({
      description: "Photo URL for the account",
     })
     .url("Invalid Picture URL supplied")
     .min(1)
     .max(1),
    }))
    .optional(),
  type: z.enum(CONSTANTS.ACCOUNT_TYPE, {
    description: "Account type",
    required_error: "Account type is required",
    invalid_type_error: "Invalid account type",
  }),
  role: z.enum(CONSTANTS.ACCOUNT_ROLE,{
    description: "Account role",
    required_error: "Account role is required",
    invalid_type_error: "Invalid account role",
  }), 
  state: z.enum(CONSTANTS.ACCOUNT_STATE,{
    description: "Account state",
    required_error: "Account state is required",
    invalid_type_error: "Invalid account state",
  })
  .default(CONSTANTS.ACCOUNT_STATE_OBJ.active),
  verified: z.boolean()
  .default(false),
  userId: z.string({
    description: "User ID for the account",
    required_error: "User ID is required",
    invalid_type_error: "Invalid ID generated, try again",
    validation_error: "Invalid ID generated, try again",
  })
  .trim()
  .min(10)
  .max(10),
  balance: z.number({
    description: "Wallet balance",
    validation_error: "Account Balance is invalid",
  })
  .min(0)
  .nonnegative()
  .default(0),
  mFA : z.boolean({
    description: "Multi-factor Authentication",
    required_error: "Multi-factor Authentication status is required",
    validation_error: "Invalid 2FA status",
  })
  .default(false),
  countryCode: z.string({
    description: "Contact country code",
    required_error: "Country code is required",
  })
  .min(4)
  .max(4)
  .optional(),
  birthDate: z.date({
    description: "Birth date of the user",
    invalid_type_error: "Invalid data for date of birth"
  }).optional(),
});

exports.ZLoginSchema = z.object({
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
});

exports.ZInvitationSchema = z.object({
  email: z.string({
    description: "Email to receive otp",
    required_error:"Email is required",
  })
  .trim()
  .email("Invalid Email supplied"), 
  role: z.enum(CONSTANTS.ACCOUNT_ROLE)
});