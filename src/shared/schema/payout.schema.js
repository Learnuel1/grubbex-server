const {z} = require("zod")
const { CONSTANTS } = require("../../config")
const { Types } = require("mongoose")

 exports.ZPayoutSchema = z.object({
    id: z.string({
        description: "Payout ID",
        required_error: "Payout ID is required"
    })
    .trim()
    .min(6, {message: "Payout ID must be at least 6 characters"})
    .max(30, {message: "Payout ID cannot exceed 30 characters"}),
    accountType: z.enum(CONSTANTS.ACCOUNT_TYPE,{
        description: "Account Type",
        required_error: "Account type is required",
        invalid_type_error: "Invalid account type",
      }),
    amount: z.number({
        description: "Payout Amount",
        required_error: "Payout amount is required",
        invalid_type_error: "Invalid payout amount"
    })
    .positive({message: "Payout amount cannot be negative"}),
    status: z.enum(Array.from(Object.values(CONSTANTS.PAYOUT_STATUS)))
   .default(CONSTANTS.PAYOUT_STATUS.pending),
    paidBy: z.object({
        role: z.string({
            description: "paid user role",
            required_error: "Paid user role is required"
        }),
        accountId: z.string({
            description: "Paid user ID",
            required_error: "Paid user ID is required"
        }),
        account:  z.instanceof(Types.ObjectId),
    })
    .optional(),
    account:  z.instanceof(Types.ObjectId),
    store: z.instanceof(Types.ObjectId).optional(),
    storeName: z.string().optional(),
    storeId: z.string().optional(),
    method: z.string({
        description: "Payout method",
        required_error: "Payout method is required",
        invalid_type_error: "Invalid payout method"
    }),
    bankDetails: z.object({
        accountName: z.string({
            description: "Bank account name",
            required_error: "Bank account name is required",
            invalid_type_error: "Invalid bank account name"
        }),
        accountNumber: z.string({
            description: "Bank account number",
            required_error: "Bank account number is required",
            invalid_type_error: "Invalid bank account number"
        })
        .length(10, {message: "Bank account number must be exactly 10 characters"}),
        bankName: z.string({
            description: "Bank name",
            required_error: "Bank name is required",
            invalid_type_error: "Invalid bank name"
        }),
    }),
    fee: z.number({
        description: "Payout fee",
        required_error: "Payout fee is required",
        invalid_type_error: "Invalid payout fee"
    })
    .nonnegative({message: "Payout fee cannot be negative"})
    .default(0),

})