exports.CONFIG = {
  APP_NAME: "Grubbex",
};

// exports.CORS_WHITELISTS = [`https://grubby-frontend.vercel.app`, `https://grubbex.vercel.app/`, `${process.env.FRONTEND_ORIGIN_URL}`,`http://127.0.0.1:3000`,`localhost:${process.env.PORT || 8001}`,  `http://localhost:3001`, `http://localhost:5173`, `http://localhost:5501`,`http://localhost:4000`];
// exports.CORS_WHITELISTS =  [`${process.env.FRONTEND_ORIGIN_URL}`];
exports.CORS_WHITELISTS = [ `${process.env.FRONTEND_ORIGIN_URL}`,`http://localhost:4000`,`http://127.0.0.1:4000`, `http://127.0.0.1:3000`, `https://grubbex-dev.netlify.app`, `https://grubbex.netlify.app`,'https://potential-space-guacamole-q4wr7xx65v92vpx-4000.app.github.dev'];

exports.CONSTANTS = {
  ACCOUNT_TYPE: ["shopper", "admin","rider","business", "dev"],
  ACCOUNT_STATUS: ["verified", "unverified"], 
  ACCOUNT_STATUS_OBJ: {
    verified: "verified",
    unverified: "unverified",
  },
  ACCOUNT_STATE: ["active", "suspended", "deactivated"],
  ACCOUNT_STATE_OBJ: {
    active: "active",
    suspended: "suspended",
    deactivated: "deactivated",
  },
  ACCOUNT_ROLE: ["shopper", "rider", "service", "super", "business", "admin", "dev"],
  KYC_STATUS: ["pending", "rejected", "approved"],
  KYC_FORMAT: [ ".jpg", ".jpeg", ".pdf", ".doc", ".docx", ".png", "application/pdf", "application/doc", "application/docx", "application/png","application/jpeg", "application/jpg", 'image/jpeg', 'image/jpg','image/png', 'text/plain', 'application/octet-stream'], 
  
  IMAGE_FORMAT: [".jpg", ".jpeg", ".png", "application/jpeg", "application/jpg", "application/png", 'image/jpeg', 'image/jpg','image/png','application/octet-stream'], 
  ITEM_CATEGORY: ["document", "glassware", "fabric", "electronic", "furniture", "food"],
  TRANSPORT_MODE: ["bike", "van", "truck"],
  BOOK_STATUS: ["active", "cancelled","paid", "accept", "reject", "completed"],
  BOOKING_EVENT_TYPE: ["fund","checkout"],
  TRANSACTION_DESC: ["Wallet creation", "funded wallet", "paid for order"],
  KYC_TYPE: ["store", "profile", "document", "bank"],
  KYC_DOCUMENT_TYPE: ["VIRTUAL NIN", "VOTER'S CARD", "DRIVER'S LICENSE", "INTERNATIONAL PASSPORT", "CAC", "PASSPORT","NATIONAL ID"],
  MOBILE_DEVICE_TYPE:["tablet", "mobile", "phone"],
  TEST_EMAIL: ["testbrubbex@gmail.com", "testdriver@gmail.com", "testbusiness@gmail.com"],
  TEST_EMAIL_OBJ : {
    testshopper: "testbrubbex@gmail.com",
    testrider: "testdriver@gmail.com",
    testbusiness: "testbusiness@gmail.com"
  },
  TEST_PASSWORD: "Grubbextest00",
  KYC_TYPE_INFO: {
   virtualNIN: "Virtual NIN", 
   votersCard: "Voter's Card", 
   driversLicense: "Driver's License", 
   internationalPassport: "International Passport",
   profile: "profile",
   bankDetails: "bank details",
   document: "document",
   documents: "documents",
   cac: "cac",
   store:"store",
   tin: "tin",
   nationalId: "National ID",
   passport: "Passport",
   logistics: "logistics",
  vehicleRegistration: "vehicle registration",
  insurance: "insurance",
   location: "location",
  },
  CATEGORY_STATUS: ["published", "draft", "publish"],
  CATEGORY_STATUS_OBJ: {
    draft: "draft",
    published: "published"
  },
  ACCOUNT_ROLE_OBJ: { 
    shopper: "shopper",
    rider: "rider",
    service: "service",
    super: "super",
    business: "business",
    dev: "dev",
    admin: "admin",
  },
  ACCOUNT_TYPE_OBJ: { 
    shopper: "shopper",
    admin: "admin",
    rider: "rider",
    business: "business",
    dev: "dev",
  },
  KYC_STATUS_OBJ: {
    pending: "pending",
    rejected: "rejected",
    approved: "approved",
  },
   
  NOTIFICATION_TYPE : ["transaction", "services", "activities"],
  NOTIFICATION_TYPE_OBJ :  {
  transaction: "Transaction",
  services: "Services",
  activities: "Activities",
  order: "Order",
  system: "System",
  },
  CHAT_STATUS : ["sent", "delivered", "read"],
  CHAT_STATUS_OBJ : {
    sent: "sent",
    delivered: "delivered",
    read: "read",
  },
  VEHICLE_TYPE: ["bicycle", "motorcycle", "car", " tricycle", "truck"],
  VEHICLE_TYPE_OBJ: {
    bicycle: "bicycle",
    motorcycle: "motorcycle",
    car: "car",
    tricycle: "tricycle",
    truck: "truck",
  },
  TICKET_STATUS : ["open", "closed"],
  TICKET_STATUS_OBJ: {
    open: "open",
    closed: "closed",
  },
  TICKET_PRIORITY : ["low", "high"],
  TICKET_PRIORITY_OBJ: {
    low: "low",
    high: "high",
  },
  ENDORSEMENT_TYPE: [ "rating", "like","review"],
  ENDORSEMENT_TYPE_OBJ: {
    rating: "rating",
    like: "like",
    review: "review",
  },
  PROMOTION_STATUS: ["active", "inactive"],
  PROMOTION_STATUS_OBJ: {
    active: "active",
    inactive: "inactive",
  },
  SHIPPING_ADDRESS_STATUS_OBJ: {
    primary: "primary",
    other: "other",
  },
  ORDER_TYPE_OBJ: {
    pickup: "pickup",
    delivery: "delivery",
  },
  ORDER_STATUS_OBJ: {
    pending: "pending",
    pickup: "pickup",
    inProcess: "inProcess",
    delivered: "delivered",
    cancelled: "cancelled",
    draft: "draft",
    ready: "ready",
    completed: "completed",
    failed: "failed",
    open: "open",
    closed: "closed",
    accepted: "accepted",
  },
  PAYMENT_TYPE_OBJ: { 
    card: "card",
    wallet: "wallet",
    transfer: "transfer",
  },
  CARD_TYPE_OBJ: {
    visa: "Visa",
    mastercard: "Mastercard", 
  },

  TRANSACTION_TYPE: {
    funding: "funding",
    withdrawal: "withdrawal",
    checkout: "checkout",
    refund: 'refund',
    credit: 'credit',
    debit: 'debit',
    transfer: 'transfer',
    deposit: 'deposit'
  },
  LOCATION_STATUS: {
    set: "set",
    unset: "unset",
  },
  PAYOUT_STATUS: {
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    issue: "Issue"
  },
  NOTIFICATION_CHANNELS: {
    email: "email",
    sms: "sms",
    push: "push",
  },
  SETTING_FIELDS_OBJ: {
    NOTIFICATION: {
      onNewUserRegistration: "NewUserRegistration",
      onCriticalSystemError: "CriticalSystemError",
      onOrderRequest: "OrderRequest",
      onOrderUpdate: "OrderUpdate",
      onOrderStatusUpdate: "OrderStatusUpdate",
      onNewOrder: "NewOrder"
    },
    TYPE: {
      notification: "notification",
      userManagement: "userManagement",
      emailTemplates: "emailTemplates",
      payoutDuration: "payoutDuration"
    },
    payoutDuration: {
       weekly:"weekly",
       biWeekly: "biweekly",
      monthly: "monthly",
    }
  },
  ADMIN: {
    ACCOUNT_TYPE_OBJ: {
    super: "super",
    admin: "admin",
    support: "support",
    service: "service",
  },
  PERMISSION_OBJ: {
    manageVendors: "manageVendors",
    manageOrders: "manageOrders",
    manageRiders: "manageRiders",
    manageCustomers: "manageCustomers",
    manageSettings: "manageSettings",
    managePromotions: "managePromotions",
    manageReportsAndAnalytics: "manageReportsAndAnalytics",
    manageSupportTickets: "manageSupportTickets",
    managePlatform: "managePlatform",
}
  },
  EMAIL_TEMPLATES_OBJ: {  
    welcomeEmail: "welcomeEmail",
    deliveryEmail: "deliveryEmail",
    orderEmail: "orderEmail",
  },
  APP_ROUTE: {
    mobile: "mobile",
    web:"web",
  },
  RIDER: {
    ACC_STATUS_OBJ: {
      online: "online",
      offline: "offline",
    }
  }, 
  FAQ_TARGET_OBJ: {
    vendors: "vendors",
    riders: "riders",
    shopper: "shoppers",
    all: "all",
  },
  DELIVERY_TYPE_OBJ: {
    delivery: "delivery",
    pickup: "pickup",
  },
   TRANSPORTATION_MODE: {
    driving: "driving",
    bicycle: "bicycle",
    tricycle: "tricycle",
    straight: "straight",
   },
   PAYOUT_TYPE_OBJ: {
    weekly: {
      name: "weekly",
      numberOfDays: 7
    },
    biweekly: {
      name: "biweekly",
      numberOfDays: 14
    },
    monthly: {
      name: "monthly",
      numberOfDays: 30
    }
   },
   ORDER_PAYMENT_STATUS: {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    success: 'success',
    failed: 'failed',
    reversed: 'reversed'
   }
};  