const {z} = require("zod")
const { CONSTANTS } = require("../../../config")
exports.ZStoreCategorySchema = z.object({
  id: z.string({
    description: "Category ID",
    required_error: "Category id is required",
    validation_type_error: "Category name is invalid",
  }),
  name: z.string({
    description: "Category name",
    required_error: "Category name is required",
    validation_type_error: "Category name is invalid",
  })
  .trim()
  .min(3, {message: "Category name must be at least 3 characters"})
  .max(30,  {message: "Category name must not exceed 30 characters"}),
  description: z.string({
    description: " Description",
    required_error: "Description is required",
    validation_type_error: "Description is invalid",
  }),
  parentId: z.string({
    description: "Subcategory parent id",
    required_error: "Subcategory parent id is required",
    validation_type_error: "Subcategory parent id is invalid",
  })
  .optional(),
  status: z.enum(CONSTANTS.CATEGORY_STATUS)
  .default(CONSTANTS.CATEGORY_STATUS_OBJ.published)
})