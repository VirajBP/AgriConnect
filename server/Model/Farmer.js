const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    // Aggregate rating from consumers across all completed orders
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
    inventory: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        estimatedHarvestDate: {
          type: Date,
          required: true,
        },
        isAvailable: {
          type: Boolean,
          default: true,
        },
        qualityGrade: {
          type: String,
          enum: ['A', 'B', 'C'],
          default: 'A',
        },
        addedDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Farmer', farmerSchema);
