const {z} = require("zod");
exports.ZSettingSchema = z.object({
     notification: z.array(z.object({
        onNewOrder: z.string({
            description: "Notification preference for new orders",
            required_error: "Notification preference for new orders is required",
            invalid_type_error: "Invalid notification preference for new orders"
        }).optional(),
        onOrderUpdate: z.string({
            description: "Notification preference for order updates",
            required_error: "Notification preference for order updates is required",
            invalid_type_error: "Invalid notification preference for order updates"
        }).optional(),
        onOrderRequest: z.string({
            description: "Notification preference for order requests",
            required_error: "Notification preference for order requests is required",
            invalid_type_error: "Invalid notification preference for order requests"
        }).default("email"),
        onCriticalSystemError: z.string({
            description: "Notification preference for critical system errors",
            required_error: "Notification preference for critical system errors is required",
            invalid_type_error: "Invalid notification preference for critical system errors"
        }).optional(),
        onNewUserRegistration: z.string({
            description: "Notification preference for new user registrations",
            required_error: "Notification preference for new user registrations is required",
            invalid_type_error: "Invalid notification preference for new user registrations"
        }).optional(),

    })).optional(),
    general: z.object({
        email: z.string({
            description: "User email address",
            required_error: "Email address is required",
            invalid_type_error: "Invalid email address"
        }),
        phoneNumber: z.string({
            description: "User phone number",
            required_error: "Phone number is required",
            invalid_type_error: "Invalid phone number"
        }),
        legalAddress: z.string({
            description: "Legal address of the business",
            required_error: "Legal address is required",
            invalid_type_error: "Invalid legal address"
        }).min(10, {message: "Legal address must be at least 10 characters"})
        .max(200, {message: "Legal address cannot exceed 200 characters"}),
    }).optional(),
    userManagement: z.object({
        superAdmin: z.array(z.string({
            description: "Super admin role",
            required_error: "Super admin role are required",
    })).optional(),
        admin: z.array(z.string({
            description: "Admin role",
            required_error: "Admin role are required",
        })).optional(),
        service: z.array(z.string({
            description: "Service role",
            required_error: "Service role are required",
        })).optional(),
    }).optional(),
});