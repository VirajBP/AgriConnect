const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const Farmer = require('../Model/Farmer');
const Product = require('../Model/Product');
const Order = require('../Model/Order');
const FarmerDashboard = require('../Model/FarmerDashboard');

// Helper function to update dashboard stats
const updateDashboardStats = async (farmerId) => {
    try {
        // Get counts from database
        const activeListings = await Product.countDocuments({ farmer: farmerId });
        const completedOrders = await Order.countDocuments({ 
            farmer: farmerId, 
            status: 'completed' 
        });
        const pendingOrders = await Order.countDocuments({ 
            farmer: farmerId, 
            status: { $in: ['pending', 'confirmed'] } 
        });

        // Calculate total revenue
        const completedOrdersData = await Order.find({ 
            farmer: farmerId, 
            status: 'completed' 
        }).populate('product');
        
        const totalRevenue = completedOrdersData.reduce((sum, order) => {
            // Ensure product and price exist before calculating
            if (order.product && order.product.price !== undefined) {
                return sum + (order.quantity * order.product.price);
            }
            return sum; // Skip if product or price is missing
        }, 0);

        // Get popular products
        const productOrders = await Order.aggregate([
            { $match: { farmer: farmerId } },
            { $group: { 
                _id: '$product', 
                count: { $sum: 1 } 
            }},
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const popularProducts = await Product.find({
            _id: { $in: productOrders.map(p => p._id) }
        }).select('productName');

        // Update dashboard
        await FarmerDashboard.findOneAndUpdate(
            { farmerId },
            {
                stats: {
                    totalRevenue,
                    activeListings,
                    completedOrders,
                    pendingOrders
                },
                popularProducts: popularProducts.map(p => p.productName)
            },
            { new: true, upsert: true }
        );
        console.log(`Dashboard stats updated for farmer: ${farmerId}`); // Add logging
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
        // Consider re-throwing the error or handling it appropriately
        // throw error;
    }
};

// Get farmer profile
router.get('/profile', auth, async (req, res) => {
    try {
        const farmer = await Farmer.findById(req.user.id).select('-password');
        res.json({
            success: true,
            data: farmer
        });
    } catch (error) {
        console.error('Error fetching farmer profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile'
        });
    }
});

// Add a new product
router.post('/products', auth, async (req, res) => {
    try {
        const { productName, productVariety, quantity, price, estimatedDate } = req.body;
        
        const product = new Product({
            farmer: req.user.id,
            productName,
            productVariety,
            quantity,
            price,
            estimatedDate: new Date(estimatedDate)
        });

        await product.save();

        // Add product to farmer's products array
        await Farmer.findByIdAndUpdate(
            req.user.id,
            { $push: { products: product._id } }
        );

        // Update dashboard stats
        await updateDashboardStats(req.user.id);

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding product'
        });
    }
});

// Get all products of a farmer
router.get('/products', auth, async (req, res) => {
    try {
        const products = await Product.find({ farmer: req.user.id });
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

// Get all orders for a farmer
router.get('/orders', auth, async (req, res) => {
    try {
        console.log('Fetching orders for farmer:', req.user.id);
        const orders = await Order.find({ farmer: req.user.id })
            .populate('product', 'productName price') // Populate product details
            .populate('consumer', 'name'); // Populate consumer details
            console.log('Fetched orders:', orders);
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching orders'
        });
    }
});

// Get farmer dashboard data
router.get('/dashboard', auth, async (req, res) => {
    try {
        console.log('Fetching dashboard for user:', req.user.id);
        
        const farmer = await Farmer.findById(req.user.id);
        if (!farmer) {
            console.log('Farmer not found for ID:', req.user.id);
            return res.status(404).json({ success: false, message: 'Farmer not found' });
        }

        // Update dashboard stats before fetching
        await updateDashboardStats(req.user.id);

        // Get dashboard data
        const dashboard = await FarmerDashboard.findOne({ farmerId: req.user.id });
        if (!dashboard) {
            console.log('Dashboard data not found for farmer ID:', req.user.id);
            return res.status(404).json({ success: false, message: 'Dashboard data not found' });
        }

        // Get today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.find({
            farmer: req.user.id,
            createdAt: { $gte: today },
            status: { $in: ['pending', 'confirmed'] }
        }).populate('consumer', 'name').populate('product', 'productName');

        // Get upcoming orders
        const upcomingOrders = await Order.find({
            farmer: req.user.id,
            deliveryDate: { $gt: today },
            status: { $in: ['pending', 'confirmed'] }
        }).populate('consumer', 'name').populate('product', 'productName');

        // Get inventory (products)
        const inventory = await Product.find({ farmer: req.user.id });

        console.log('Dashboard data fetched successfully:', {
            stats: dashboard.stats,
            monthlyRevenue: dashboard.monthlyRevenue,
            popularProducts: dashboard.popularProducts,
            todayOrdersCount: todayOrders.length,
            upcomingOrdersCount: upcomingOrders.length,
            inventoryCount: inventory.length
        });

        res.json({
            success: true,
            data: {
                stats: dashboard.stats,
                monthlyRevenue: dashboard.monthlyRevenue,
                popularProducts: dashboard.popularProducts,
                todayOrders: todayOrders.map(order => ({
                    _id: order._id,
                    productName: order.product.productName,
                    quantity: order.quantity,
                    customerName: order.consumer.name
                })),
                upcomingOrders: upcomingOrders.map(order => ({
                    _id: order._id,
                    productName: order.product.productName,
                    quantity: order.quantity,
                    deliveryDate: order.deliveryDate,
                    customerName: order.consumer.name
                })),
                inventory: inventory.map(product => ({
                    productId: product._id,
                    productName: product.productName,
                    quantity: product.quantity,
                    unit: 'kg'
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

module.exports = router; 