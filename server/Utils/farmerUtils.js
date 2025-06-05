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

        // Get counts from database
        const activeListings = await Product.countDocuments({ 
            farmer: farmerObjectId,
            quantity: { $gt: 0 }  // Only count products with available quantity
        });
        
        const completedOrders = await Order.countDocuments({ 
            farmer: farmerObjectId, 
            status: 'completed' 
        });
        
        const pendingOrders = await Order.countDocuments({ 
            farmer: farmerObjectId, 
            status: { $in: ['pending', 'confirmed'] } 
        });

        // Calculate total revenue and monthly revenue from completed orders
        const completedOrdersData = await Order.find({ 
            farmer: farmerObjectId, 
            status: 'completed' 
        }).populate('product', 'price');
        
        const totalRevenue = completedOrdersData.reduce((sum, order) => {
            // Calculate total price for this order: quantity * price per unit
            const pricePerUnit = order.product?.price || 0;
            const quantity = order.quantity || 0;
            const orderTotal = pricePerUnit * quantity;
            return sum + orderTotal;
        }, 0);

        // Calculate monthly revenue for the last 4 months
        const fourMonthsAgo = new Date();
        fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
        
        const monthlyOrders = await Order.find({
            farmer: farmerObjectId,
            status: 'completed',
            createdAt: { $gte: fourMonthsAgo }
        }).populate('product', 'price');

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

        // Add revenue from orders
        monthlyOrders.forEach(order => {
            const date = new Date(order.createdAt);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            // Calculate total price for this order: quantity * price per unit
            const pricePerUnit = order.product?.price || 0;
            const quantity = order.quantity || 0;
            const orderTotal = pricePerUnit * quantity;

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

// Helper function to sync farmer product array and dashboard stats
const syncFarmerProducts = async (farmerId) => {
    try {
        // Convert farmerId to ObjectId
        const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

        // Find all product IDs for the given farmer
        const products = await Product.find({ farmer: farmerObjectId }).select('_id');
        const productIds = products.map(product => product._id);

        // Update the farmer's products array
        await Farmer.findByIdAndUpdate(
            farmerObjectId,
            { products: productIds },
            { new: true }
        );
        console.log(`Synced product array for farmer: ${farmerId}`);

        // Update dashboard stats
        await updateDashboardStats(farmerId);
        console.log(`Synced dashboard stats for farmer: ${farmerId}`);

    } catch (error) {
        console.error(`Error syncing products for farmer ${farmerId}:`, error);
        throw error; // Re-throw the error to be handled by the caller
    }
};

module.exports = {
    updateDashboardStats,
    syncFarmerProducts
}; 