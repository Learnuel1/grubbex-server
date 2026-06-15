const { isValidObjectId, Types } = require("mongoose");
const { z } = require("zod");
const { CONSTANTS } = require("../../../config");

exports.ZProductSchema = z.object({
    prodId: z.string({
        description: "Product ID",
        required_error: "Product ID is required",
        invalid_type_error: "Production ID is invalid",
    })
        .trim()
        .min(20, { message: "Product ID must be 20 characters" })
        .max(20, { message: "Product ID cannot exceed 20 characters" }),
    title: z.string({
        description: "Product title",
        required_error: "Product title is required",
        invalid_type_error: "Product title is invalid",
    })
        .min(3, { message: "Product name must be at least 3 characters" })
        .max(50, { message: "Product name must be less than 50 characters" })
        .trim(),
    description: z.string({
        description: "Product description",
        required_error: "Product description is required",
        invalid_type_error: "Product description is invalid",
    })
        .trim()
        .min(10, { message: "Product description is too short" })
        .max(200, { message: "Product description cannot exceed 200 characters" }),
    pricing: z.object({
        price: z.number({
            description: "Product price",
            required_error: "Product price is required",
            invalid_type_error: "Product price must be a number",
        })
            .positive({ message: "Product price cannot be negative" })
            .nullable(false, { message: "Product price cannot be null" }),
        discountPrice: z.number({
            description: "Discounted price",
            required_error: "Discounted price is required",
            invalid_type_error: "Discounted price must be a number",
        })
            .positive({ message: "Discounted price must be positive" })
            .nullable(true)
            .optional(),
        discountCode: z.string({
            description: "Discount code",
            required_error: "Discount code is required",
            invalid_type_error: "Discount code must be a string",
        })
            .trim()
            .min(5, { message: "Discount code must be at least 5 characters" })
            .max(20, { message: "Discount code cannot exceed 20 characters" })
            .nullable(true)
            .optional(),
        discountRate: z.number({
            description: "Discount rate",
            required_error: "Discount rate is required",
            invalid_type_error: "Discount rate must be a number",
        })
            .nonnegative({ message: "Discount rate cannot be negative" })
            .min(0, { message: "Discount rate cannot be less than 0" })
            .max(100, { message: "Discount rate cannot exceed 100" })
            .optional(),
    }),
    status: z.enum(CONSTANTS.CATEGORY_STATUS, {
        required_error: "Product status is required",
        invalid_type_error: "Product status is invalid",
    }),
    category: z.array(z.object({
        id: z.string({
            description: "Product category ID",
            required_error: "Product category ID is required",
            invalid_type_error: "Product category ID is invalid"
        })
            .trim()
            .min(7, { message: "Category ID should be 7 characters" })
            .max(7, { message: "Category ID must be 7 characters" }),
        name: z.string({
            description: "Product category name",
            required_error: "Product category name is required",
            invalid_type_error: "Product category name is invalid"
        })
            .trim()
            .min(3, { message: "Product category name should at least 3 characters" })
    })),
    subcategory: z.string({
        description: "Product subcategory",
        required_error: "Product subcategory is required",
        invalid_type_error: "subcategory is invalid"
    })
        .trim()
        .min(3, { message: "Subcategory should be at least 3 characters" })
        .max(50, { message: "subcategory cannot exceed 50 characters" }),
    brand: z.string({
        description: "Product brand",
        required_error: "Product brand is required",
        invalid_type_error: "Product brand is invalid"
    })
        .trim()
        .min(2, { message: "Product brand should be at least 2 characters" })
        .max(30, { message: "Product brand cannot exceed 30 characters" }),
    tags: z.array(z.string()).optional(),
    quantity: z.number({
        description: "Product quantity",
        required_error: "Product quantity is required",
        invalid_type_error: "Product quantity is invalid",
    })
        .positive({ message: "Product quantity must be positive" })
        .min(1, { message: "Product quantity cannot be less than 1" }),
    weight: z.string({
        description: "Product weight",
        required_error: "Product weight is required",
    })
        .trim()
        .optional(),
    media: z.object({
        mainImage: z.object({
            id: z.string({
                description: "Product image ID",
                required_error: "Product image ID is required",
                invalid_type_error: "Product image ID is invalid"
            })
                .trim(),
            url: z.string({
                description: "Product Image URL",
                required_error: "Product image URL is required",
                invalid_type_error: "Product image URL is invalid",
            })
                .trim()
                .url({ message: "Product image url is not a valid url" })
        }),
        others: z.array(z.object({
            id: z.string({
                description: "Other product image ID",
                required_error: "Other images for product is required",
                invalid_type_error: "Other image of product is invalid",
            })
                .trim()
                .url()
        }))
            .max(5, { message: "Other images for product cannot exceed 5" })
            .optional(),
    }),
    barcode: z.object({
        id: z.string({
            description: "Product barcode ID"
        })
            .trim()
            .url({ message: "barcode should be a valid URL" })
    }).optional(),
    barcodeValue: z.string({
        description: "Product barcode value",
        required_error: "Product barcode value is required",
        invalid_type_error: "Product barcode value is invalid"
    })
        .trim()
        .min(3, { message: "Product barcode value should be at least 3 characters" })
        .max(20, { message: "Product barcode value cannot exceed 20 characters" })
        .optional(),
    sku: z.string({
        description: "Product SKU value",
        required_error: "Product SKU value is required",
        invalid_type_error: "Product SKU is invalid"
    })
        .trim()
        .min(3, { message: "Product SKU value should be at least 3 characters" })
        .max(20, { message: "Product SKU should not exceed 20 characters" })
        .optional(),
    variation: z.array(z.object({
        type: z.string({
            description: "Product variation type",
            required_error: "Product variation is required",
        })
            .min(3, { message: "Product variation type must be at least 3 characters" })
            .max(30, { message: "Product variation type cannot exceed 30 characters" }),
        size: z.string().min(2).max(30),
        price: z.number().positive(),
        quantity: z.number().positive().min(1)
    })).optional(),
    additionalInfo: z.array(z.object({
        author: z.string().min(3, { message: "author name must be at least 3 characters" }).max(60, { message: "Author name cannot exceed 60 characters" }).trim().optional(),
        isbn: z.string({
            description: "ISBN",
            required_error: "ISBN is required",
            invalid_type_error: "ISBN must be a string",
        })
            .trim()
            .min(10, { message: "ISBN must be at least 10 characters" })
            .max(13, { message: "ISBN cannot exceed 13 characters" })
            .optional(),
        genre: z.string({
            description: "Genre",
            required_error: "Genre is required",
            invalid_type_error: "Genre must be a string",
        })
            .trim()
            .min(3, { message: "Genre must be at least 3 characters" })
            .max(30, { message: "Genre cannot exceed 30 characters" })
            .optional(),
        edition: z.string({
            description: "Edition",
            required_error: "Edition is required",
            invalid_type_error: "Edition must be a string",
        })
            .trim()
            .min(1, { message: "Edition must be at least 1 character" })
            .max(20, { message: "Edition cannot exceed 20 characters" })
            .optional(),
        model:
            z.string({
                description: "Model",
                required_error: "Model is required",
                invalid_type_error: "Model must be a string",
            })
                .trim()
                .min(1, { message: "Model must be at least 1 character" })
                .max(30, { message: "Model cannot exceed 30 characters" })
                .optional(),
        screenSize:
            z.string({
                description: "Screen size",
                required_error: "Screen size is required",
                invalid_type_error: "Screen size must be a string",
            })
                .trim()
                .min(1, { message: "Screen size must be at least 1 character" })
                .max(10, { message: "Screen size cannot exceed 10 characters" })
                .optional(),
        storageCapacity:
            z.string({
                description: "Storage capacity",
                required_error: "Storage capacity is required",
                invalid_type_error: "Storage capacity must be a string",
            })
                .trim()
                .min(1, { message: "Storage capacity must be at least 1 character" })
                .max(20, { message: "Storage capacity cannot exceed 20 characters" })
                .optional(),
        operatingSystem:
            z.string({
                description: "Operating system",
                required_error: "Operating system is required",
                invalid_type_error: "Operating system must be a string",
            })
                .trim()
                .min(1, { message: "Operating system must be at least 1 character" })
                .max(30, { message: "Operating system cannot exceed 30 characters" })
                .optional(),
        warranty:
            z.string({
                description: "Warranty",
                required_error: "Warranty is required",
                invalid_type_error: "Warranty must be a string",
            })
                .trim()
                .min(1, { message: "Warranty must be at least 1 character" })
                .max(50, { message: "Warranty cannot exceed 50 characters" })
                .optional(),
    })).max(1, "Additional information can contain just one record")
    .optional(),
    store: z.custom < Types.ObjectId > ((val) => isValidObjectId(val), {
        message: "Store ID",
        invalid_type_error: "Store ID is invalid",
    }),
});
