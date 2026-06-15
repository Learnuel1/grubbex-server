const { isValidObjectId, Types  } = require("mongoose");
const { referenceGen } = require("../../../shared/utils/Generator");

exports.ZStoreSchema = z.object({
  storeId: z.string({
    description: "Store ID ",
    required_error: "Store ID is required",
    validation_error: "Invalid Store ID",
  })
  .min(15, { message: "Store ID must be at least 15 characters long" })
  .max(15, { message: "Store ID must be at most 15 characters long" })
  .default(referenceGen()),
  type: z.string({
    description: "Store category ",
    required_error: "Store type is required",
    validation_error: "Invalid Store ID",
  })
  .min(5, { message: "Store type must be at least 5 characters long" })
  .max(40, { message: "Store type must be at most 40 characters long" }),
  user: z.custom<Types.ObjectId>((val) => isValidObjectId(val),{
    message: "Invalid User ID",
  }),
})

 