const { z } = require("zod");
const { CONSTANTS } = require("../../config");

exports.ZNotificationSchema = z.object({
  id: z.string({
    description: "ID of notification",
    required_error: "Notification ID is required",
    validation_error: "Notification ID is invalid"
  })
  .trim(),
  userId: z.string({
    description: "User ID of notification",
    required_error: "User ID is required",
    validation_error: "User ID is invalid"
  })
  .min(10)
  .max(10) 
  .trim(),
  title: z.string({
    description: "Notification Title",
    required_error: "Notification title is required",
  })
  .trim()
  .min(10)
  .max(80),
  info: z.string({
    description: "Notification message",
    required_error: "Notification Message is required",
  })
  .min(10)
  // .max(500)
  .trim(),
 viewed: z.boolean({
    description: "Notification status",
    required_error: "Notification status is required",
    validation_error: "Invalid notification status",
  })
  .default(false),
  category: z.enum(CONSTANTS.NOTIFICATION_TYPE)
})