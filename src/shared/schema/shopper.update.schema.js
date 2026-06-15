const { z } = require('zod');

// Schema for updating a shopper
const ZShopperUpdateSchema = z.object({
    lastName: z.string().min(2, 'lastName is required').max(100, 'lastName too long')
    .trim()
    .optional(),
    firstName: z.string().min(2, 'firstName is required').max(100, 'firstName too long')
    .trim()
    .optional(),
  phoneNumber: z
    .string()
    .min(11, 'phoneNumber must be at least 11 characters')
    .max(14, 'phoneNumber must be at most 14 characters')
    .trim()
    .optional(),
});

module.exports = {
  ZShopperUpdateSchema,
};
