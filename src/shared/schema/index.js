const { ZProductSchema } = require("../../api/store/schema/product.schema");
const { ZStoreCategorySchema } = require("../../api/store/schema/store.category.schema");
const { ZStoreProfileSchema } = require("../../api/store/schema/store.profile.schema");
const { ZStoreSchema, ZCategoryPreferenceSchema } = require("../../api/store/schema/store.schema"); 
const { ZAccountSchema, ZLoginSchema , ZInvitationSchema} = require("./account.schema");
const { ZBankSchema, ZSubscription, ZLogisticsSchema } = require("./bank.schema");
const { ZNotificationSchema } = require("./notification.schema");
const { ZProfileSchema } = require("./profile.schema");
const { ZTemporalAccountSchema } = require("./temporal.schema");
const { ZChatSchema } = require("./chat.schema");  
const { ZTicketSchema } = require("./ticket.schema");
const { ZTicketChatSchema } = require("./ticket.chat.schema");
const { ZFaqSchema } = require("./faq.schema");
const { ZLikeRatingSchema } = require("./like.schema");
const { ZReviewSchema } = require("./review.schema");
const { ZPromotionSchema } = require("./promotion.schema");
const { ZShippingAddressSchema } = require("./shipping.address.schema");
const { ZOrderSchema } = require("./order.schema");
const { ZPayoutSchema } = require("./payout.schema");
const { ZShopperUpdateSchema } = require("./shopper.update.schema");

module.exports = {
  ZAccountSchema,
  ZProfileSchema,
  ZTemporalAccountSchema,
  ZLoginSchema,
  ZStoreSchema,
  ZBankSchema,
  ZSubscription,
  ZStoreCategorySchema,
  ZInvitationSchema,
  ZStoreSchema,
  ZStoreProfileSchema,
  ZProductSchema,
  ZNotificationSchema,
  ZChatSchema,
  ZProductSchema,
  ZCategoryPreferenceSchema,
  ZTicketSchema,
  ZTicketChatSchema,
  ZFaqSchema,
  ZLogisticsSchema,
  ZLikeRatingSchema, 
  ZReviewSchema,
  ZPromotionSchema,
  ZShippingAddressSchema,
  ZOrderSchema,
  ZPayoutSchema,
  ZShopperUpdateSchema
}