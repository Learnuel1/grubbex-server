const { Schema , model} = require("mongoose"); 
const { CONSTANTS } = require("../config");

const ProductSchema = new Schema({
  prodId: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  storeId: {
    type: String,
    required: true,
    index: true,
  },
  store: {
    type: Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },
  title: {
    type: String,
    require: [true, "Product title is required"],
    index: true,
    trim: true,
  },
  description: {
    type: String,
    require: true,
    trim: true,
  },
  media: {
    type: [],
    minLength: [1, "Product must have at at least 1 image"]
  },
  status: {
    type: String,
    required: true,
    enum: CONSTANTS.CATEGORY_STATUS,
    default: CONSTANTS.CATEGORY_STATUS_OBJ.published,
  },
  category: [],
  subcategory: {
    type: String,
    // required: true,
  },
  brand: {
    type: String,
    required: [true, "Brand name is required"],
    index: true,
  },
  tags: {
    type: [String],
  },
  pricing: {
    price: {
      type: Number,
      required: true,
    },
    discountRate: {
      type: Number,
    },
    discountCode: {
      type: String,
    },
     
  },
  additionalInfo: [ {
      author: {
        type: String,
      },
      isbn: {
        type: String,
      },
      genre: {
        type: String,
      },
      edition: {
        type: String,
      },
      model: {
        type: String,
      },
      screenSize: {
        type: String,
      },
      storageCapacity: {
        type: String,
      },
      warranty: {
        type: String,
      },
      operatingSystem: {
        type: String,
      },

  }],
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],

  },
  barcodeValue: {
    type: String,
  },
  barcode: {
    type: [{
      id: {
        type: String,
      },
      url: {
        type: String,
      }
    }]
  },
  weight: {
    type: String,
    required: [true, "Product weight is required"],
    index: true,
  },
  variation:  [{
    type: {
      type: String,
      min: [3, "variation type should be at least 3 characters"],
      max: [30, "variation type cannot exceed 30 characters"]
    },
    size: {
      type: String,
      min: 3,
      max: 30,
    },
    price: {
      type: Number,
      min: [1, "Price cannot be zero"]

    },
    quantity: {
      type: Number,
      min: [0, "quantity cannot be less than zero"]
    }
  }],
  rating: {
    type: Number,
    default: 0.0,
  },
  likes: {
    type: Number,
    required: true,
    default: 0,
  },
  likers: [{
    type: Schema.Types.ObjectId,
    ref: "Like",
  }],
  raters: [{
    type: Schema.Types.ObjectId,
    ref: "Like",
  }],
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: "Review",
  }],
  vat: {
    type: Number,
    required: true,
    default:0,

  }
}, {timesStamps: true});

const ProductModel = model("Product", ProductSchema);
 
module.exports = ProductModel;
