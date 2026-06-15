const { Types } = require("mongoose");
const { CONSTANTS } = require("../../config");
const z  = require("zod");

exports.ZShippingAddressSchema = z.object({
   
  account: z.instanceof(Types.ObjectId, {message: "Account ID is required"}),
  userId: z.string({
    description: "User ID for the shipping address",
    required_error: "userId is required",
    invalid_type_error: "userId must be a string",
  })
  .trim()
  .min(10)
  .max(10),
  addressId: z.string({
    description: "Address ID for the shipping address",
    required_error: "Address ID is required",
    invalid_type_error: "Address ID must be a string",
  }).trim()
  .min(10, {message: "Address ID must be at least 10 characters"})
  .max(10, {message: "Address ID must be at most 10 characters"}),
  title: z.string({
    description: "Title for shipping address",
    required_error: "Title is required",
    invalid_type_error: "Title must be a string",
  }).min(2, "title is required")
  .optional(),
  //  phoneNumber: z.string({
  //     description: "Phone Number for the account",
  //     required_error: "Phone Number is required",
  //     invalid_type_error: "Phone Number is invalid"
  //   })
  //   .max(15)
  //   .min(11)
  //   .trim(),
  street: z.string({
    description: "Street for the shipping address",
    required_error: "Street is required",
    invalid_type_error: "Street format is invalid",
  }).min(2, {message: "street must be at least 2 characters"}).optional(),
  houseNumber: z.string({
    description: "House number for the shipping address",
    required_error: "House number is required",
    invalid_type_error: "House number format is invalid",
  }).min(1, {message: "House number must be at least 1 character"}).optional(),
  city: z.string({
    description: "City for the shipping address",
    required_error: "City is required",
    invalid_type_error: "City format is invalid",
  }).min(2, "city is required").optional(),
  state: z.string({
    description: "State for the shipping address",
    required_error: "State is required",
    invalid_type_error: "State format is invalid",
  }).min(2, "state is required").optional(),
   lat: z.number({
    description: "Latitude for the shipping address",
    required_error: "Latitude is required",
    invalid_type_error: "Latitude must be a number",
  }),
  lng: z.number({
    description: "Longitude for the shipping address",
    required_error: "Longitude is required",
    invalid_type_error: "Longitude must be a number",
  }),
});