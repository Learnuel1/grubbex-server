const {z} = require("zod");
exports.ZProfileSchema = z.object({
    state: z.string({
      description: "State for the account",
      require_error: "State of residence is required",
    })
    .min(2),
    street: z.string({
      description: "Street address for the account",
      require_error: "Street address is required",
    })
    .min(2,{message: "Street name should be at least 2 characters"}),
    landMark: z.string({
      description: "Nearest junction the Address",
      require_error: "Nearest junction is required",
    })
    .min(2),
    workingHours: z.array(z.object({
      day: z.string({
        description: "Working Days",
        require_error: "Working Days are required",
      }),
      time: z.string({
        description: "Working Hours",
        require_error: "Working Hour is required",
      })
    }))
    .optional(),
    logo: z.object({
      id: z.string({
        description: "Logo for the store",
        require_error: "Logo ID is required",
      })
      .trim(),
      url: z.string({
        description: "Logo for the store",
        require_error: "Logo URL is required",
      })
      .trim()
      .url("Invalid Logo URL supplied") 
      .min(1)
      .max(1),
    })
    .optional(),
    emergencyContact: z.object({
      firstName: z.string({
        description: "Emergency First name",
        required_error: "Emergency First name is required",
      }),
      lastName: z.string({
        description: "Emergency Last name",
        required_error: "Emergency Last name is required",
      }),
      email: z.string({
        description: "Emergency email",
        required_error: "Emergency email is required"
      })
      .email("Invalid email supplied"),
      phoneNumber: z.string({
        description: "Emergency phone number",
      required_error: "Emergency phone number is required",
      })
      .min(11)
      .max(15)
      .trim(),
    })
    .optional(),
    otherAddress: z.array(z.string({
      description: "Delivery address",
      required_error: "Delivery address is required",
    }))
    .optional(),
    birthDate: z.date({
      description: "Rider's birth date",
      required_error: "Date of birth is required",
      invalid_type_error: "Invalid date format"
    }),
    description: z.string({
      description: "Profile description",
      required_error: "Profile description is required",
      invalid_type_error: "Profile description is invalid",
    })
    .min(3, {message: "Profile description must be at least 3 character"})
    .max(200, {message: "Profile description cannot exceed 200 characters"})
    .trim()
    .optional(),
    // user: z.instanceof(Types.ObjectId),
});