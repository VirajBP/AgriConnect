const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const Consumer = require('../Model/Consumer');
const Product = require('../Model/Product');
const Order = require('../Model/Order');
const ConsumerDashboard = require('../Model/ConsumerDashboard');

// Helper function to update dashboard stats
const updateDashboardStats = async (consumerId) => {
    try {
        // Get counts from database
        const totalOrders = await Order.countDocuments({ consumer: consumerId });
        const completedOrders = await Order.countDocuments({ 
            consumer: consumerId, 
            status: 'completed' 
        });
        const pendingOrders = await Order.countDocuments({ 
            consumer: consumerId, 
            status: { $in: ['pending', 'confirmed'] } 
        });

        // Calculate total spent
        const completedOrdersData = await Order.find({ 
            consumer: consumerId, 
            status: 'completed' 
        }).populate('product');
        
        const totalSpent = completedOrdersData.reduce((sum, order) => {
            // Ensure product and price exist before calculating
            if (order.product && order.product.price !== undefined) {
                return sum + (order.quantity * order.product.price);
            }
            return sum; // Skip if product or price is missing
        }, 0);

        // Get favorite products
        const productOrders = await Order.aggregate([
            { $match: { consumer: consumerId } },
            { $group: { 
                _id: '$product', 
                count: { $sum: 1 } 
            }},
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const favoriteProducts = await Product.find({
            _id: { $in: productOrders.map(p => p._id) }
        }).select('productName');

        // Update dashboard
        await ConsumerDashboard.findOneAndUpdate(
            { consumerId },
            {
                stats: {
                    totalSpent,
                    totalOrders,
                    completedOrders,
                    pendingOrders
                },
                favoriteProducts: favoriteProducts.map(p => p.productName)
            },
            { new: true, upsert: true }
        );
        console.log(`Dashboard stats updated for consumer: ${consumerId}`);
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
};

// Get consumer profile
router.get('/profile', auth, async (req, res) => {
    try {
        const consumer = await Consumer.findById(req.user.id).select('-password');
        res.json({
            success: true,
            data: consumer
        });
    } catch (error) {
        console.error('Error fetching consumer profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile'
        });
    }
});

// Get consumer dashboard data
router.get('/dashboard', auth, async (req, res) => {
    try {
        console.log('Fetching dashboard for consumer:', req.user.id);
        
        const consumer = await Consumer.findById(req.user.id);
        if (!consumer) {
            console.log('Consumer not found for ID:', req.user.id);
            return res.status(404).json({ success: false, message: 'Consumer not found' });
        }

        // Update dashboard stats before fetching
        await updateDashboardStats(req.user.id);

        // Get dashboard data
        const dashboard = await ConsumerDashboard.findOne({ consumerId: req.user.id });
        if (!dashboard) {
            console.log('Dashboard data not found for consumer ID:', req.user.id);
            return res.status(404).json({ success: false, message: 'Dashboard data not found' });
        }

        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.find({
            consumer: req.user.id,
            createdAt: { $gte: today },
            status: { $in: ['pending', 'confirmed'] }
        }).populate('farmer', 'name').populate('product', 'productName');

        // Get upcoming orders
        const upcomingOrders = await Order.find({
            consumer: req.user.id,
            deliveryDate: { $gt: today },
            status: { $in: ['pending', 'confirmed'] }
        }).populate('farmer', 'name').populate('product', 'productName');

        // Get recent orders
        const recentOrders = await Order.find({ consumer: req.user.id })
            .populate('farmer', 'name')
            .populate('product', 'productName')
            .sort({ createdAt: -1 })
            .limit(5);

        console.log('Dashboard data fetched successfully:', {
            stats: dashboard.stats,
            monthlySpending: dashboard.monthlySpending,
            favoriteProducts: dashboard.favoriteProducts,
            todayOrdersCount: todayOrders.length,
            upcomingOrdersCount: upcomingOrders.length,
            recentOrdersCount: recentOrders.length
        });

        res.json({
            success: true,
            data: {
                stats: dashboard.stats,
                monthlySpending: dashboard.monthlySpending,
                favoriteProducts: dashboard.favoriteProducts,
                todayOrders: todayOrders.map(order => ({
                    _id: order._id,
                    productName: order.product.productName,
                    quantity: order.quantity,
                    farmerName: order.farmer.name
                })),
                upcomingOrders: upcomingOrders.map(order => ({
                    _id: order._id,
                    productName: order.product.productName,
                    quantity: order.quantity,
                    deliveryDate: order.deliveryDate,
                    farmerName: order.farmer.name
                })),
                recentOrders: recentOrders.map(order => ({
                    _id: order._id,
                    productName: order.product.productName,
                    quantity: order.quantity,
                    status: order.status,
                    farmerName: order.farmer.name,
                    createdAt: order.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// Get all available products
router.get('/products', auth, async (req, res) => {
    try {
        const products = await Product.find()
            .populate('farmer', 'name location phoneNumber');
            
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching products'
        });
    }
});

module.exports = router; 