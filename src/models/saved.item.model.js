const {Schema, model} = require('mongoose');

const savedItemSchema = new  Schema(
  {
    prodId: {
      type: String, 
    },
    product: {
      type:  Schema.Types.ObjectId,
      ref: 'Product', 
    },
    storeId: {
      type: String, 
    },
    store: {
      type:  Schema.Types.ObjectId,
      ref: 'Store', 
    }, 
    shopper: {
      type:  Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    }, 
    shopperId: {
      type:  String, 
      required: true,
    } 
  },
  {
    timestamps: true,
  }
);

const SavedItemModel = model('SavedItem', savedItemSchema);

module.exports = SavedItemModel;
