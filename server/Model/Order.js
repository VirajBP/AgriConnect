const mongoose = require('mongoose');

// Sub-schema for per-order ratings from each side
const ratingSubSchema = new mongoose.Schema(
  {
    value: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String },
    ratedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    consumer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consumer',
      required: true,
    },
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
    quantity: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    deliveryDate: {
      type: Date,
    },
    // Ratings
    // Rating given by the consumer to the farmer for this order
    consumerRating: ratingSubSchema,
    // Rating given by the farmer to the consumer for this order
    farmerRating: ratingSubSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
