const Product = require('../Model/Product');
const Order = require('../Model/Order');

// Create a new upcoming harvest listing
exports.createProduct = async (req, res) => {
    try {
        const { name, category, expectedHarvestDate, estimatedQuantity, unit, pricePerUnit } = req.body;
        
        const product = new Product({
            farmer: req.user.id,
            name,
            category,
            expectedHarvestDate,
            estimatedQuantity,
            remainingQuantity: estimatedQuantity, // Initially same as estimated
            unit,
            pricePerUnit,
            status: 'upcoming'
        });

        await product.save();
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update harvest details
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        if (product.farmer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Don't allow certain updates after pre-orders have started
        if (product.estimatedQuantity !== product.remainingQuantity) {
            delete req.body.estimatedQuantity;
            delete req.body.pricePerUnit;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.json(updatedProduct);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Mark harvest as completed
exports.markHarvestComplete = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        if (product.farmer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        product.status = 'harvested';
        await product.save();

        // Update all pending orders
        await Order.updateMany(
            { product: product._id, status: 'pending' },
            { $set: { status: 'confirmed' } }
        );

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get farmer's products
exports.getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ farmer: req.user.id })
            .sort({ expectedHarvestDate: -1 });
        
        // Add additional information for each product
        const enhancedProducts = products.map(product => ({
            ...product._doc,
            totalOrders: product.status === 'upcoming' ? 
                (product.estimatedQuantity - product.remainingQuantity) : 
                product.estimatedQuantity
        }));

        res.json(enhancedProducts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get farmer's orders
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ farmer: req.user.id })
            .populate('consumer', 'name phoneNumber type')
            .populate('product', 'name category expectedHarvestDate')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: orders
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching orders'
        });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id)
            .populate('product');

        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Verify the order belongs to the farmer's product
        if (order.product.farmer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Validate status update
        const validStatusTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['completed', 'cancelled'],
            'cancelled': [],
            'completed': []
        };

        if (!validStatusTransitions[order.status].includes(status)) {
            return res.status(400).json({ 
                msg: `Cannot change status from ${order.status} to ${status}` 
            });
        }

        order.status = status;
        await order.save();

        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}; 