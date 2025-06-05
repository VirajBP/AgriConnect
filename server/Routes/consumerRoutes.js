const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const Consumer = require('../Model/Consumer');
const Product = require('../Model/Product');
const Order = require('../Model/Order');
const ConsumerDashboard = require('../Model/ConsumerDashboard');
const Farmer = require('../Model/Farmer');
const bcrypt = require('bcryptjs');

// Helper function to update monthly spending data
const updateMonthlySpending = async (consumerId) => {
    try {
        // Get all completed orders for this consumer
        const completedOrders = await Order.find({
            consumer: consumerId,
            status: 'completed'
        }).populate('product');

        // Group orders by month and calculate total spending
        const monthlySpending = {};
        completedOrders.forEach(order => {
            const monthYear = new Date(order.createdAt).toLocaleString('en-US', { month: 'long', year: 'numeric' });
            const amount = order.product ? (order.quantity * order.product.price) : 0;
            monthlySpending[monthYear] = (monthlySpending[monthYear] || 0) + amount;
        });

        // Convert to array format required by schema
        const monthlySpendingArray = Object.entries(monthlySpending).map(([month, amount]) => ({
            month,
            amount
        }));

        // Sort by date (most recent first)
        monthlySpendingArray.sort((a, b) => {
            const dateA = new Date(a.month);
            const dateB = new Date(b.month);
            return dateB - dateA;
        });

        // Update dashboard with monthly spending data
        await ConsumerDashboard.findOneAndUpdate(
            { consumerId },
            { monthlySpending: monthlySpendingArray },
            { new: true }
        );
    } catch (error) {
        console.error('Error updating monthly spending:', error);
    }
};

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

        // Update monthly spending data
        await updateMonthlySpending(consumerId);

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
router.get('/consumer/dashboard', auth, async (req, res) => {
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

        // Get today's orders with error handling for null products/farmers
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.find({
            consumer: req.user.id,
            createdAt: { $gte: today },
            status: { $in: ['pending', 'confirmed'] }
        })
        .populate('farmer', 'name')
        .populate('product', 'productName')
        .lean(); // Use lean() for better performance

        // Get upcoming orders with error handling
        const upcomingOrders = await Order.find({
            consumer: req.user.id,
            deliveryDate: { $gt: today },
            status: { $in: ['pending', 'confirmed'] }
        })
        .populate('farmer', 'name')
        .populate('product', 'productName')
        .lean();

        // Get recent orders with error handling
        const recentOrders = await Order.find({ consumer: req.user.id })
            .populate('farmer', 'name')
            .populate('product', 'productName')
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();

        // Filter out orders with missing product or farmer data
        const validTodayOrders = todayOrders.filter(order => order.product && order.farmer);
        const validUpcomingOrders = upcomingOrders.filter(order => order.product && order.farmer);
        const validRecentOrders = recentOrders.filter(order => order.product && order.farmer);

        console.log('Dashboard data fetched successfully:', {
            stats: dashboard.stats,
            monthlySpending: dashboard.monthlySpending,
            favoriteProducts: dashboard.favoriteProducts,
            todayOrdersCount: validTodayOrders.length,
            upcomingOrdersCount: validUpcomingOrders.length,
            recentOrdersCount: validRecentOrders.length
        });

        res.json({
            success: true,
            data: {
                stats: dashboard.stats,
                monthlySpending: dashboard.monthlySpending,
                favoriteProducts: dashboard.favoriteProducts,
                todayOrders: validTodayOrders.map(order => ({
                    _id: order._id,
                    productName: order.product?.productName || 'Product Removed',
                    quantity: order.quantity,
                    farmerName: order.farmer?.name || 'Farmer Unavailable'
                })),
                upcomingOrders: validUpcomingOrders.map(order => ({
                    _id: order._id,
                    productName: order.product?.productName || 'Product Removed',
                    quantity: order.quantity,
                    deliveryDate: order.deliveryDate,
                    farmerName: order.farmer?.name || 'Farmer Unavailable'
                })),
                recentOrders: validRecentOrders.map(order => ({
                    _id: order._id,
                    productName: order.product?.productName || 'Product Removed',
                    quantity: order.quantity,
                    status: order.status,
                    farmerName: order.farmer?.name || 'Farmer Unavailable',
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

// Get consumer orders
router.get('/orders', auth, async (req, res) => {
    try {
        const consumer = await Consumer.findById(req.user.id);
        if (!consumer) {
            return res.status(404).json({
                success: false,
                message: 'Consumer not found'
            });
        }

        const orders = await Order.find({ consumer: req.user.id })
            .populate('product', 'productName variety unit price imageUrl')
            .populate('farmer', 'name location phoneNumber email')
            .sort({ createdAt: -1 });

        if (!orders) {
            return res.json({
                success: true,
                data: []
            });
        }

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Error fetching consumer orders:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching orders'
        });
    }
});

// Cancel an order
router.put('/orders/:orderId/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            consumer: req.user.id,
            status: 'pending'
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or cannot be cancelled'
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while cancelling order'
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

// Get all available products for market
router.get('/market/products', auth, async (req, res) => {
    try {
        // console.log('Fetching market products for consumer:', req.user.id);
        
        // First get the consumer's location
        const consumer = await Consumer.findById(req.user.id);
        // console.log('Consumer data:', {
        //     id: consumer._id,
        //     location: consumer.location
        // });
        
        if (!consumer) {
            return res.status(404).json({
                success: false,
                message: 'Consumer not found'
            });
        }

        // Find farmers in the same location
        const localFarmers = await Farmer.find({ location: consumer.location });
            // console.log('Found local farmers:', {
            //     count: localFarmers.length,
            //     location: consumer.location,
            //     farmerIds: localFarmers.map(f => f._id)
            // });

        // Find all available products from local farmers
        const availableProducts = await Product.find({ 
            farmer: { $in: localFarmers.map(f => f._id) },
            quantity: { $gt: 0 }  // Only get products with quantity > 0
        })
        .populate('farmer', 'name location phoneNumber email')
        .sort({ createdAt: -1 });

        // console.log('Available products:', {
        //     count: availableProducts.length,
        //     products: availableProducts.map(p => ({
        //         id: p._id,
        //         name: p.productName,
        //         farmer: p.farmer?.name,
        //         location: p.farmer?.location,
        //         quantity: p.quantity
        //     }))
        // });

        res.json({
            success: true,
            data: availableProducts
        });
    } catch (error) {
        console.error('Error fetching market products:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Server error while fetching market products'
        });
    }
});

// Update consumer profile
router.put('/profile/update', auth, async (req, res) => {
    try {
        const updates = req.body;
        
        // Remove password from updates if present
        delete updates.password;

        const consumer = await Consumer.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            data: consumer
        });
    } catch (error) {
        console.error('Error updating consumer profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
});

// Update consumer password
router.put('/profile/update-password', auth, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        // Validate password
        if (password.length < 6 || !/\d/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long and contain at least one number'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password
        await Consumer.findByIdAndUpdate(
            req.user.id,
            { $set: { password: hashedPassword } }
        );

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating password'
        });
    }
});

// Create a new order
router.post('/orders', auth, async (req, res) => {
    try {
        const { product: productId, quantity, farmer: farmerId } = req.body;

        // Validate required fields
        if (!productId || !quantity || !farmerId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if product exists and has sufficient quantity
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient product quantity'
            });
        }

        // Create new order
        const order = new Order({
            orderId: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`, // Generate unique orderId
            consumer: req.user.id,
            farmer: farmerId,
            product: productId,
            quantity: quantity,
            status: 'pending',
            orderDate: new Date(),
            totalPrice: product.price * quantity
        });

        // Save the order
        await order.save();

        // Update product quantity
        product.quantity -= quantity;
        await product.save();

        // Update consumer dashboard stats
        await updateDashboardStats(req.user.id);

        // Return the created order with populated fields
        const populatedOrder = await Order.findById(order._id)
            .populate('product', 'productName price')
            .populate('farmer', 'name');

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: populatedOrder
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating order'
        });
    }
});

module.exports = router; 