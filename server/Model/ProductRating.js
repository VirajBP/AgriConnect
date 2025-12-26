const mongoose = require('mongoose');

const ProductRatingSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

// Compound index to ensure one rating record per farmer-product combination
ProductRatingSchema.index({ farmer: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('ProductRating', ProductRatingSchema);
