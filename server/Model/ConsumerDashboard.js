const mongoose = require('mongoose');

const monthlySpendingSchema = new mongoose.Schema({
  month: String,
  amount: Number,
});

const consumerDashboardSchema = new mongoose.Schema(
  {
    consumerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consumer',
      required: true,
    },
    stats: {
      activeOrders: Number,
      totalSpent: Number,
      totalOrders: Number,
      completedOrders: Number,
      pendingOrders: Number,
    },
    recentOrders: [String],
    favoriteProducts: [String],
    monthlySpending: [monthlySpendingSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ConsumerDashboard', consumerDashboardSchema);
