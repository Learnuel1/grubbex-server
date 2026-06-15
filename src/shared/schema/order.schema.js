const { z } = require("zod");
const { CONSTANTS } = require("../../config");
const { Types } = require("mongoose");

// Replace with your actual Product schema
const ZProductSchema = z.object({
    prodId: z.string({
        description: "Product ID",
        required_error: "Product ID is required",
        validation_error: "Product ID is invalid",
    }).trim()
        .min(20, { message: "Product ID must be 20 characters" })
        .max(20, { message: "Product ID cannot exceed 20 characters" })
        .min(1),
    name: z.string({
        description: "Product name",
        required_error: "Product name is required",
    }).min(1).optional(), 
    quantity: z.number({
        description: "Quantity of the product",
        required_error: "Product quantity is required",
    }).int().positive(),
    price: z.number({
        description: "Product price",
        required_error: "Product price is required",
        validation_error: "Product price must be a positive number",
    }).nonnegative(),
    promoCode: z.string({
        description: "Product promotion code",
        required_error: "Promo code is required",
    }).min(5, {message: "Promotion code must be at least 5 characters"})
    .max(30, {message: "promotion code cannot exceed 30 characters"})
    .optional(),
});
 
exports.ZOrderSchema = z.object({
    orderId: z.string({
        description: "Order ID",
        required_error: "Order ID is required",
        validation_error: "Order ID is invalid",
    }).trim()
        .min(20, { message: "Order ID must be 20 characters" })
        .max(20, { message: "Order ID cannot exceed 20 characters"
    }),
     storeId: z.string({
        description: "Store ID",
        required_error: "Product store ID  is required",
        invalid_type_error: "Store ID is invalid",
    }).min(15, {message: "Store ID must be 15 characters"})
    .max(15, {message: "Store ID must be 15 characters"}).trim(),
    items: z.array(ZProductSchema).min(1),
    rider: z.instanceof(Types.ObjectId).optional(),
    riderId: z.string({
         description: "Rider ID",
        required_error: "Provide Rider ID",
        invalid_type_error: "Invalid Rider ID"
    }).min(10).max(10).optional(),
    isAvailable: z.boolean().default(true),
    phoneNumber: z.string({
             description: "Phone Number for the account",
             required_error: "Phone Number is required",
             invalid_type_error: "Phone Number is invalid"
           })
           .max(15)
           .min(11)
           .trim(),
    destinationAddress: z.object({
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
         }).min(2, "title is required").optional(),
         
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
         }).min(2,{message: "State must be at two character"}).optional(),
         status: z.enum(Array.from(Object.values(CONSTANTS.SHIPPING_ADDRESS_STATUS_OBJ))).optional(),  
    }).optional(),
    store: z.array(z.object({
    })).min(1, {message: "Provide pickup address"}).max(2, {message: "pickup address cannot exceed 1"}).optional(),
    shopperId: z.string({
        description: "User ID",
        required_error: "Provide user ID",
        invalid_type_error: "Invalid User ID"
    })
    .trim()
  .min(10)
  .max(10),
  subTotal: z.number({
        description: "Subtotal amount",
        required_error: "Subtotal is required",
        validation_error: "Subtotal must be a positive number",
    }).nonnegative(),
    total: z.number({
        description: "Total amount",
        required_error: "Total is required",
        validation_error: "Total must be a positive number",
    }).nonnegative(),
    vat: z.number({
        description: "VAT amount",
        required_error: "VAT is required",
        validation_error: "VAT must be a positive number",
    }).nonnegative().default(0),
    promoCode: z.array(z.string({
        description: "Promo code applied to the order",
        required_error: "Promo code is required",
        validation_error: "Promo code must be a string",
    })).min(1, {message: "At least one promo code is required"}).max(5, {message: "Cannot apply more than 5 promo codes"}).optional(),
    discount: z.number({
        description: "Discount amount", 
        validation_error: "Discount must be a positive number",
    }).nonnegative().default(0),
    shopper: z.instanceof(Types.ObjectId,{
        description: "Shopper ID",
        required_error: "Shopper ID is required",
        validation_error: "Shopper ID is invalid",
        invalid_type_error: "Shopper ID is not in correct Format",
    }),
    paymentType: z.enum(Array.from(Object.values(CONSTANTS.PAYMENT_TYPE_OBJ)), {
        description: "Payment type",
        required_error: "Payment type is required",
        invalid_type_error: "Invalid payment type",
    }),
    cardDetails: z.object({
        name: z.string({
            description: "Cardholder name",
            required_error: "Cardholder name is required",
            invalid_type_error: "Cardholder name must be a string",
        }).min(1, { message: "Cardholder name must be at least 1 character" }),
        cardNumber: z.string({
            description: "Card number",
            required_error: "Card number is required",
            validation_error: "Invalid card number format",
        }).min(16, { message: "Card number must be 16 digits" })
          .max(16, { message: "Card number cannot exceed 16 digits" }),
        expiryDate: z.string({
            description: "Card expiry date",
            required_error: "Card expiry date is required",
            validation_error: "Invalid expiry date format",
        }).regex(/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/, {
            message: "Expiry date must be in MM/YY or MM/YYYY format",
        }),
        cvv: z.string({
            description: "Card CVV",
            required_error: "Card CVV is required",
            validation_error: "Invalid CVV format",
        }).min(3, { message: "CVV must be at least 3 digits" })
          .max(3, { message: "CVV cannot exceed 3 digits" }),
          cardType: z.enum(Array.from(Object.values(CONSTANTS.CARD_TYPE_OBJ)), {
              description: "Card type",
              required_error: "Card type is required",
              invalid_type_error: "Invalid card type",
          }),
          saveCard: z.enum(["yes", "no"], {
            description: "Save card option",
        }).default("no")
    }).optional(),
    status: z.enum(Array.from(Object.values(CONSTANTS.ORDER_STATUS_OBJ))).default(CONSTANTS.ORDER_STATUS_OBJ.pending, {
        description: "Order status"}),
    type: z.enum(Array.from(Object.values(CONSTANTS.ORDER_TYPE_OBJ)), {
        description: "Order type",
        required_error: "Order type is required",
        invalid_type_error: "Invalid order type",
    }),
    note: z.string({
        description: "Order note",
        required_error: "Order note is required",
        invalid_type_error: "Order note must be a string",
    }).max(500, { message: "Order note cannot exceed 500 characters" }).optional(),    
}); 