const { z } = require("zod");

const ZBankSchema = z.object({
  bankName: z.string({
    description: "Name on the Bank",
    required_error: " Bank Name is required",
    validation_error: "Invalid bank name",
  }),
  accountNumber: z.string({
    description: "Account number of the Bank",
    required_error: " Bank account number is required",
    validation_error: "Invalid bank account number",
  }) 
  .min(10, {message: "Account number must be at least 10 characters"})
  .max(10, {message: "Account number must be at most 10 characters"})
  .regex(/^[0-9]+$/, "Account number must be numbers"),
  bankCode: z.string({
    description: "Bank code",
    required_error: " Bank code is required",
    validation_error: "Invalid bank code",
  })
  .min(3)
  .regex(/^[0-9]+$/, "Bank Code must be numbers"),
  bvn: z.string({
    description: "Bank BVN",
    required_error: "BVN is required",
    validation_error: "Invalid BVN"
  })
  .length({max: 11, min: 11})
  .startsWith("22",{message: "BVN must start with 22"})
  .regex(/^[0-9]+$/, "BVN must be numbers")
  .optional(),
})

const ZSubscription = z.object({
  email: z.string({
    description: "Email for subscription",
    required_error: "Email is required",
    validation_error: "Invalid email",
  })
  .email(),
});

const carPlateSchema = z
  .string({
    description: "Vehicle license plate number",
    required_error: "Plate number is required",
    invalid_type_error: "Plate number must be a string",
  })
  .trim()
  .toUpperCase()
  .regex(
    /^(?:[A-Z]{3}-?\d{3}[A-Z]{2}|(FG|SG)\d{2,3}[A-Z]{1,2}|[A-Z0-9]{1,8})$/,
    { message: "Invalid car plate number format (e.g., KJA-123AB)" }
  );

const ZLogisticsSchema = z.object({
  vehicleType: z
    .string({
      description: "Type of logistics",
      required_error: "Logistics type is required",
      invalid_type_error: "Logistics type must be a string",
    })
    .trim()
    .min(3, { message: "Logistics type should be at least 3 characters" })
    .max(20, { message: "Logistics type cannot exceed 20 characters" }),

  model: z
    .string({
      description: "Logistics model",
      required_error: "Logistics model is required",
      invalid_type_error: "Logistics model must be a string",
    })
    .trim()
    .min(5, { message: "Logistics model must be at least 5 characters" })
    .max(30, { message: "Logistics model cannot exceed 30 characters" }),

  plateNumber: carPlateSchema,

  color: z
    .string({
      description: "Logistics color",
      required_error: "Logistics color is required",
      invalid_type_error: "Logistics color must be a string",
    })
    .trim()
    .min(3, { message: "Logistics color should be at least 3 characters" })
    .max(15, { message: "Logistics color cannot exceed 15 characters" }),
});
module.exports = {
  ZBankSchema,
  ZSubscription,
  ZLogisticsSchema
}