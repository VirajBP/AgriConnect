const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const Farmer = require('../Model/Farmer');
const Product = require('../Model/Product');
const Order = require('../Model/Order');
const FarmerDashboard = require('../Model/FarmerDashboard');
const { updateDashboardStats } = require('../Utils/farmerUtils');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Get farmer profile with active listings count
router.get('/profile', auth, async (req, res) => {
    try {
        const farmer = await Farmer.findById(req.user.id).select('-password');
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: 'Farmer not found'
            });
        }

        // Fetch dashboard stats to get active listings count
        const dashboard = await FarmerDashboard.findOne({ farmerId: req.user.id });
        const activeListingsCount = dashboard ? dashboard.stats.activeListings : 0;

        res.json({
            success: true,
            data: { ...farmer.toObject(), activeListings: activeListingsCount }
        });
    } catch (error) {
        console.error('Error fetching farmer profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile'
        });
    }
});

// Update farmer profile
router.put('/profile', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'phoneNumber', 'location', 'password'];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ success: false, message: 'Invalid updates!' });
        }

        const farmer = await Farmer.findById(req.user.id);

        if (!farmer) {
            return res.status(404).json({ success: false, message: 'Farmer not found' });
        }

        // Handle password update separately
        if (req.body.password) {
            const salt = await bcrypt.genSalt(12);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        updates.forEach((update) => { farmer[update] = req.body[update]; });
        await farmer.save();

        // If location is updated, consider if product locations need sync (depends on schema)
        // For now, assuming product location is separate or derived.

        res.json({ success: true, message: 'Profile updated successfully!' });
    } catch (error) {
        console.error('Error updating farmer profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
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
            .populate({
                path: 'product',
                select: 'productName price'
            })
            .populate({
                path: 'consumer',
                select: 'name'
            })
            .sort({ createdAt: -1 });

        console.log('Raw orders data:', JSON.stringify(orders, null, 2));

        // Auto-complete confirmed orders whose delivery date has passed
        const now = new Date();
        await Order.updateMany(
          { farmer: req.user.id, status: 'confirmed', deliveryDate: { $lt: now } },
          { $set: { status: 'completed' } }
        );

        // Transform orders to match frontend expectations
        const transformedOrders = orders.map(order => {
            const formatDate = (date) => {
                if (!date) return '';
                try {
                    const d = new Date(date);
                    if (isNaN(d.getTime())) return '';
                    return d.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                } catch (e) {
                    console.error('Error formatting date:', e);
                    return '';
                }
            };

            // Ensure all fields are properly populated with actual values
            const orderData = {
                _id: order._id,
                orderId: order.orderId ? `#${order.orderId}` : '',
                product: order.product?.productName || '',
                quantity: order.quantity ? `${order.quantity} kg` : '',
                price: order.totalPrice ? `₹${order.totalPrice}` : '',
                customer: order.consumer?.name || '',
                orderDate: formatDate(order.orderDate || order.createdAt),
                deliveryDate: formatDate(order.deliveryDate),
                status: order.status || 'pending'
            };

            // Log the transformed order for debugging
            console.log('Transformed order:', orderData);

            return orderData;
        });

        console.log('All transformed orders:', JSON.stringify(transformedOrders, null, 2));

        res.json({
            success: true,
            data: transformedOrders
        });
    } catch (error) {
        console.error('Error fetching orders:', {
            error: error.message,
            stack: error.stack,
            userId: req.user.id
        });
        res.status(500).json({
            success: false,
            message: 'Server error while fetching orders',
            error: error.message
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
        const dashboard = await FarmerDashboard.findOne({ farmerId: req.user.id })
            .populate({
                path: 'popularProducts',
                select: 'productName price quantity'
            });

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
        })
        .populate('consumer', 'name')
        .populate('product', 'productName');

        // Get upcoming orders
        const upcomingOrders = await Order.find({
            farmer: req.user.id,
            deliveryDate: { $gt: today },
            status: { $in: ['pending', 'confirmed'] }
        })
        .populate('consumer', 'name')
        .populate('product', 'productName');

        // Get inventory (products)
        const inventory = await Product.find({ farmer: req.user.id });

        // Transform orders to handle both old and new formats
        const transformOrder = (order) => {
            return {
                _id: order._id,
                productName: order.product?.productName || 'Product Removed',
                quantity: order.quantity,
                deliveryDate: order.deliveryDate,
                customerName: order.consumer?.name || 'Customer Unavailable'
            };
        };

        // Ensure monthlyRevenue is sorted by date
        const sortedMonthlyRevenue = [...(dashboard.monthlyRevenue || [])].sort((a, b) => {
            return new Date(a.month) - new Date(b.month);
        });

        console.log('Dashboard data fetched successfully:', {
            stats: dashboard.stats,
            monthlyRevenue: sortedMonthlyRevenue,
            popularProducts: dashboard.popularProducts,
            todayOrdersCount: todayOrders.length,
            upcomingOrdersCount: upcomingOrders.length,
            inventoryCount: inventory.length
        });

        res.json({
            success: true,
            data: {
                stats: dashboard.stats,
                monthlyRevenue: sortedMonthlyRevenue,
                popularProducts: dashboard.popularProducts.map(product => ({
                    _id: product._id,
                    productName: product.productName,
                    quantity: product.quantity,
                    price: product.price
                })),
                todayOrders: todayOrders.map(transformOrder),
                upcomingOrders: upcomingOrders.map(transformOrder),
                inventory: inventory.map(product => ({
                    _id: product._id,
                    productName: product.productName,
                    quantity: product.quantity,
                    price: product.price
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

// Update a product
router.put('/products/:id', auth, async (req, res) => {
    try {
        const { productName, productVariety, quantity, price, estimatedDate } = req.body;
        const product = await Product.findOne({ _id: req.params.id, farmer: req.user.id });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Update product fields
        product.productName = productName;
        product.productVariety = productVariety;
        product.quantity = quantity;
        product.price = price;
        product.estimatedDate = new Date(estimatedDate);

        await product.save();

        // Update dashboard stats
        await updateDashboardStats(req.user.id);

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating product'
        });
    }
});

// Delete a product
router.delete('/products/:id', auth, async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, farmer: req.user.id });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Remove product from farmer's products array
        await Farmer.findByIdAndUpdate(
            req.user.id,
            { $pull: { products: product._id } }
        );

        // Delete the product
        await product.deleteOne();

        // Update dashboard stats
        await updateDashboardStats(req.user.id);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting product'
        });
    }
});

// Update order status
router.put('/orders/:id/status', auth, async (req, res) => {
    try {
        const { status, deliveryDate } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Convert order ID to ObjectId
        let orderId;
        try {
            orderId = new mongoose.Types.ObjectId(req.params.id);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        const order = await Order.findOne({ _id: orderId, farmer: req.user.id });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order can be updated
        if (order.status === 'completed' || order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Cannot update order status. Current status is ${order.status}`
            });
        }

        // Validate delivery date if status is being set to confirmed
        if (status === 'confirmed') {
            if (!deliveryDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Delivery date is required when confirming an order'
                });
            }

            const deliveryDateObj = new Date(deliveryDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (deliveryDateObj < today) {
                return res.status(400).json({
                    success: false,
                    message: 'Delivery date cannot be in the past'
                });
            }
        }

        // Update order status and delivery date
        order.status = status;
        order.deliveryDate = status === 'confirmed' ? deliveryDate : null;
        await order.save();

        // Try to update dashboard stats, but don't fail if it doesn't work
        try {
            await updateDashboardStats(req.user.id);
        } catch (dashboardError) {
            console.error('Error updating dashboard stats:', dashboardError);
            // Continue with the response even if dashboard update fails
        }

        // Return the updated order with populated fields
        const updatedOrder = await Order.findById(order._id)
            .populate('product', 'productName price')
            .populate('consumer', 'name');

        // Transform the order to match frontend expectations
        const transformedOrder = {
            _id: updatedOrder._id,
            orderId: updatedOrder.orderId || updatedOrder._id.toString().slice(-6),
            product: updatedOrder.product?.productName || 'Unknown Product',
            quantity: updatedOrder.quantity || 0,
            price: updatedOrder.totalPrice || 0,
            customer: updatedOrder.consumer?.name || 'Unknown Customer',
            status: updatedOrder.status,
            orderDate: updatedOrder.orderDate,
            deliveryDate: updatedOrder.deliveryDate
        };

        res.json({
            success: true,
            data: transformedOrder
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating order status'
        });
    }
});

module.exports = router; 