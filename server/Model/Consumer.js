const mongoose = require('mongoose');

const consumerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'Restaurant',
        'Supermarket',
        'Food Processing',
        'Healthcare',
        'Events',
        'NGO',
        'Hotel',
        'Catering',
        'Educational Institution',
        'Corporate Cafeteria',
        'Wholesaler',
      ],
    },
    address: {
      type: String,
      required: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    // Aggregate rating that farmers give to this consumer
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
    settings: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      emailNotifications: {
        orderConfirmed: {
          type: Boolean,
          default: true,
        },
        orderCompleted: {
          type: Boolean,
          default: true,
        },
      },
      privacy: {
        whoCanMessage: {
          type: String,
          enum: ['anyone', 'orders-only'],
          default: 'anyone',
        },
        blockedUsers: [{
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'blockedUsers.role',
        }],
      },
    },
    preferredFarmers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consumer', consumerSchema);
