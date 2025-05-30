const Product = require('../Model/Product');
const Order = require('../Model/Order');
const Consumer = require('../Model/Consumer');

// Get all products (upcoming, harvested, and completed)
exports.getAllProducts = async (req, res) => {
    try {
        // Get current date for reference
        const currentDate = new Date();

        const products = await Product.find()
            .populate('farmer', 'name location phoneNumber')
            .sort({ expectedHarvestDate: -1 }) // Sort by harvest date, newest first
            .lean(); // Convert to plain JavaScript object for modification

        // Enhance products with additional information
        const enhancedProducts = products.map(product => ({
            ...product,
            canOrder: product.status === 'upcoming' && product.remainingQuantity > 0,
            timeUntilHarvest: product.status === 'upcoming' ? 
                Math.ceil((new Date(product.expectedHarvestDate) - currentDate) / (1000 * 60 * 60 * 24)) : // Days until harvest
                null,
            harvestStatus: getHarvestStatus(product.status, product.expectedHarvestDate)
        }));

        // Group products by status for easier frontend display
        const groupedProducts = {
            upcoming: enhancedProducts.filter(p => p.status === 'upcoming'),
            harvested: enhancedProducts.filter(p => p.status === 'harvested'),
            completed: enhancedProducts.filter(p => p.status === 'completed')
        };
        
        res.json(groupedProducts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Helper function to get user-friendly harvest status
function getHarvestStatus(status, harvestDate) {
    switch (status) {
        case 'upcoming':
            const daysUntilHarvest = Math.ceil((new Date(harvestDate) - new Date()) / (1000 * 60 * 60 * 24));
            return `Harvesting in ${daysUntilHarvest} days`;
        case 'harvested':
            return 'Recently harvested';
        case 'completed':
            return 'Harvest completed';
        default:
            return status;
    }
}

exports.createOrder = async (req, res) => {
    try {
        const { productId, quantity, specialInstructions } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        if (product.status !== 'upcoming') {
            return res.status(400).json({ msg: 'This product is no longer accepting orders' });
        }

        if (product.remainingQuantity < quantity) {
            return res.status(400).json({ 
                msg: `Only ${product.remainingQuantity} ${product.unit} available` 
            });
        }

        const order = new Order({
            consumer: req.user.id,
            product: productId,
            quantity,
            totalPrice: quantity * product.pricePerUnit,
            status: 'pending',
            specialInstructions
        });

        // Update product remaining quantity
        product.remainingQuantity -= quantity;
        
        await Promise.all([order.save(), product.save()]);
        
        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ consumer: req.user.id })
            .populate('product')
            .populate('farmer', 'name phoneNumber')
            .sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        if (order.consumer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ msg: 'Can only cancel pending orders' });
        }

        const product = await Product.findById(order.product);
        
        order.status = 'cancelled';
        product.remainingQuantity += order.quantity;

        await Promise.all([order.save(), product.save()]);

        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}; 