const Farmer = require('../Model/Farmer');
const Product = require('../Model/Product');
const Order = require('../Model/Order');
const FarmerDashboard = require('../Model/FarmerDashboard');
const mongoose = require('mongoose');

// Helper function to update dashboard stats
const updateDashboardStats = async (farmerId) => {
    try {
        // Convert farmerId to ObjectId
        const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

        // Get counts from farmer's inventory
        const farmer = await Farmer.findById(farmerObjectId);
        const activeListings = farmer ? farmer.inventory.filter(item => 
            item.isAvailable && item.quantity > 0
        ).length : 0;
        
        const completedOrders = await Order.countDocuments({ 
            farmer: farmerObjectId, 
            status: 'completed' 
        });
        
        const pendingOrders = await Order.countDocuments({ 
            farmer: farmerObjectId, 
            status: { $in: ['pending', 'confirmed'] } 
        });

        // Calculate total revenue from completed orders using totalPrice field
        const completedOrdersData = await Order.find({ 
            farmer: farmerObjectId, 
            status: 'completed' 
        });
        
        const totalRevenue = completedOrdersData.reduce((sum, order) => {
            return sum + (order.totalPrice || 0);
        }, 0);

        // Calculate monthly revenue for the last 4 months
        const fourMonthsAgo = new Date();
        fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
        
        const monthlyOrders = await Order.find({
            farmer: farmerObjectId,
            status: 'completed',
            createdAt: { $gte: fourMonthsAgo }
        });

        // Initialize last 4 months with 0 revenue
        const monthlyRevenue = [];
        const monthlyData = new Map();

        // Initialize all months in the range with 0
        for (let i = 0; i < 4; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            monthlyData.set(monthKey, 0);
        }

        // Add revenue from orders using totalPrice
        monthlyOrders.forEach(order => {
            const date = new Date(order.createdAt);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            const orderTotal = order.totalPrice || 0;

            if (monthlyData.has(monthKey)) {
                monthlyData.set(monthKey, monthlyData.get(monthKey) + orderTotal);
            }
        });

        // Convert to array and format dates
        for (const [key, revenue] of monthlyData) {
            const [year, month] = key.split('-');
            monthlyRevenue.push({
                month: new Date(year, month - 1).toLocaleString('en-US', { 
                    month: 'long',
                    year: 'numeric'
                }),
                revenue: Math.round(revenue * 100) / 100 // Round to 2 decimal places
            });
        }

        // Sort by date (most recent first)
        monthlyRevenue.sort((a, b) => {
            return new Date(b.month) - new Date(a.month);
        });

        // Keep only the last 4 months
        const last4MonthsRevenue = monthlyRevenue.slice(0, 4).reverse();

        // Get recent orders
        const recentOrders = await Order.find({ farmer: farmerObjectId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('_id');

        // Get popular products based on order frequency
        const popularProducts = await Order.aggregate([
            { $match: { farmer: farmerObjectId } },
            { $group: { _id: '$product', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Update dashboard
        const dashboard = await FarmerDashboard.findOne({ farmerId });
        if (!dashboard) {
            // Create new dashboard if it doesn't exist
            const newDashboard = new FarmerDashboard({
                farmerId,
                stats: {
                    totalRevenue,
                    activeListings,
                    completedOrders,
                    pendingOrders
                },
                recentOrders: recentOrders.map(order => order._id),
                popularProducts: popularProducts.map(p => p._id),
                monthlyRevenue: last4MonthsRevenue
            });
            await newDashboard.save();
        } else {
            // Update existing dashboard
            dashboard.stats = {
                totalRevenue,
                activeListings,
                completedOrders,
                pendingOrders
            };
            dashboard.recentOrders = recentOrders.map(order => order._id);
            dashboard.popularProducts = popularProducts.map(p => p._id);
            dashboard.monthlyRevenue = last4MonthsRevenue;
            await dashboard.save();
        }

        return true;
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
        throw error;
    }
};

// Helper function to sync farmer inventory and dashboard stats
const syncFarmerInventory = async (farmerId) => {
    try {
        // Update dashboard stats (inventory is already in farmer document)
        await updateDashboardStats(farmerId);
        console.log(`Synced dashboard stats for farmer: ${farmerId}`);

    } catch (error) {
        console.error(`Error syncing inventory for farmer ${farmerId}:`, error);
        throw error;
    }
};

module.exports = {
    updateDashboardStats,
    syncFarmerInventory
}; 