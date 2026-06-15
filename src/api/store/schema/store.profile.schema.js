const { z } = require("zod");
const { CONSTANTS } = require("../../../config");
const { Types } = require("mongoose");

exports.ZStoreProfileSchema = z.object({
  storeId: z.string({
    description: "Store ID",
    required_error: "Store ID is required",
    invalid_type_error: "Store ID is invalid",
  })
  .min(15,{message: "Store ID must be 15 characters"})
  .max(15, {message: "Store ID cannot exceed 15 characters"})
  .trim(),
  description: z.string({
    description: "Description for store",
    required_error: "Store description is required",
    invalid_type_error: "Store description  is invalid",
  })
  .trim()
  .min(5,{message: "store description must be at least 5 characters"})
  .max(200, {message: "Store description cannot exceed 200 characters"}), 
  state: z.string({
    description: "Store resident state",
    required_error: "Store resident state is required"
  })
  .trim()
  .min(3, {message: "State name must be at least 3 characters"})
  .max(30, {message: "State name cannot exceed 30 characters"}),
  city: z.string({
    description: "Store city",
    required_error: "Store city is required"
  })
  .trim()
  .min(2,{message: "City name must be at least 2 characters"} )
  .max(30, {message: "City name cannot exceed 30 characters"}),
  lga: z.string({
    description: "Store LGA",
    required_error: "Store LGA is required"
  })
  .trim()
  .min(2, {message: "LGA name must be at least 2 characters"} )
  .max(30, {message: "LGA name cannot exceed 30 characters"}),
  town: z.string({
    description: "Store resident town",
    required_error: "Store resident town is required"
  })
  .trim()
  .min(2)
  .max(30),
  street: z.string({
    description: "Store resident street",
    required_error: "Store resident street is required"
  })
  .trim()
  .min(2,  {message: "Town name must be at least 2 characters"} )
  .max(30, {message: "Town name cannot exceed 30 characters"}),
  houseNo: z.string({
    description: "Store resident number",
    required_error: "Store resident number is required"
  })
  .trim()
  .min(2,  {message: "House number must be at least 2 characters"})
  .max(30, {message: "House number cannot exceed 30 characters"}),
  landMark: z.string({
    description: "Closes and popular place to the store location",
    required_error: "Closes and popular place to the store is required"
  })
  .trim()
  .min(2,  {message: "Land Mark must be at least 2 characters"})
  .max(30, {message: "Land Mark cannot exceed 30 characters"}),
  kyc: z.enum(CONSTANTS.KYC_TYPE)
  .default(CONSTANTS.KYC_TYPE_INFO.profile),
  user: z.instanceof(Types.ObjectId),
   

})