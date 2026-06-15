const {z} = require("zod")
const { Types } = require("mongoose")

 
exports.ZStoreSchema = z.object({
    storeId: z.string({
      description: "Store ID",
      required_error: "Store ID is required",
      validation_type_error: "Store ID must be 15 characters"
    })
    .trim() 
    .length(15),
    name: z.string({
      description: "Store category",
      required_error: "Store category is required",
      validation_type_error: "Store category should not exceed 10 characters"
    })
    .trim()
    .min(5)
    .max(30),
    categoryId: z.array(z.string({
      description: "Store sub category",
      required_error: "Store type is required",
      validation_type_error: "Store sub category should not exceeds 30 characters"
    }))
    .min(1), 
    user: z.instanceof(Types.ObjectId),
}) ;

exports.ZCategoryPreferenceSchema =z.object({
  category: z.array(z.string().trim().min(3,{message: "Item must be at least three character "}).max(50, {message:"Item cannot exceed 50 characters"})).min(1, {message: "Category preference must contain an item"}).max(30, {message: "Items cannot exceed 30"})
})



