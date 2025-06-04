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
        totalRevenue: {
            type: Number,
            default: 0
        },
        activeListings: {
            type: Number,
            default: 0
        },
        completedOrders: {
            type: Number,
            default: 0
        },
        pendingOrders: {
            type: Number,
            default: 0
        }
    },
    recentOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    popularProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    monthlyRevenue: [monthlyRevenueSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('FarmerDashboard', farmerDashboardSchema); 