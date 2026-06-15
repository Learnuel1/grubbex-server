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

const carPlateSchema = z.string().toUpperCase().regex(
  /^(?:[A-Z0-9]{3}-[A-Z0-9]{3}[A-Z]{3}|[A-Z]{1,3}[0-9]{1,4}-[A-Z]{1,3}|[A-Z0-9]{1,7}|(FG|SG)[0-9]{2,3}[A-Z]{1,2})$/,
  // /^(?:[A-Z0-9]{5}[A-Z0-9]{3}[0-9]{1,3}|[A-Z0-9]{1,7}|(FG|SG)[0-9]{2,3}[A-Z]{1,2})$/,
  'Invalid car plate number format'
);

const ZLogisticsSchema = z.object({
  vehicleType: z.string({
    description: "Type of logistics",
    required_error: "Logistics type is required"
  }).trim().min(3, {message : "Logistics type should be at least 3 characters"}).max(20, {message: "Logistics type cannot exceed 20 characters"}),
  model: z.string({
    description: "Logistics model",
    required_error: "Logistic model is required",
  }).trim().min(5, {message: "Logistics m model must be at least 5 characters"}).max(30, {message: "logistics model cannot exceed 30 characters"}),
  plateNumber: carPlateSchema,
  color: z.string({
    description: "Logistics color",
    required_error: "Logistics color is required",
  }).trim().min(3, {message: "Logistics color should be at least 3 characters"}).max(15, {message: "Logistics color cannot exceed 15 characters"}),
})
module.exports = {
  ZBankSchema,
  ZSubscription,
  ZLogisticsSchema
}