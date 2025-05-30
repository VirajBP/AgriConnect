const mongoose = require('mongoose');

const monthlyRevenueSchema = new mongoose.Schema({
    month: String,
    revenue: Number
});

const farmerDashboardSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    },
    stats: {
        totalRevenue: Number,
        activeListings: Number,
        completedOrders: Number,
        pendingOrders: Number
    },
    recentOrders: [String],
    popularProducts: [String],
    monthlyRevenue: [monthlyRevenueSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('FarmerDashboard', farmerDashboardSchema); 