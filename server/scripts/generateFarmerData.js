const mongoose = require('mongoose');
const Order = require('../Model/Order');
const Product = require('../Model/Product');
const Consumer = require('../Model/Consumer');
require('dotenv').config();

const generateOrders = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        // Nitin's ID
        const nitinId = '6835761e5096b6e565fdf0e6';

        // Sample consumers (you'll need to replace these with actual consumer IDs from your database)
        const consumers = await Consumer.find().limit(3);
        if (consumers.length < 3) {
            console.error('Need at least 3 consumers in the database');
            return;
        }

        // Sample products (you'll need to replace these with actual product IDs from your database)
        const products = await Product.find({ farmer: nitinId }).limit(3);
        if (products.length < 3) {
            console.error('Need at least 3 products in the database for Nitin');
            return;
        }

        // Sample orders data
        const orders = [
            // Pending Orders
            {
                orderId: 'ORD001',
                consumer: consumers[0]._id,
                farmer: nitinId,
                product: products[0]._id,
                quantity: 50,
                totalPrice: 2500,
                status: 'pending',
                orderDate: new Date(),
                deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            },
            {
                orderId: 'ORD002',
                consumer: consumers[1]._id,
                farmer: nitinId,
                product: products[1]._id,
                quantity: 75,
                totalPrice: 3750,
                status: 'pending',
                orderDate: new Date(),
                deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
            },

            // Completed Orders
            {
                orderId: 'ORD003',
                consumer: consumers[2]._id,
                farmer: nitinId,
                product: products[2]._id,
                quantity: 100,
                totalPrice: 5000,
                status: 'completed',
                orderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
                deliveryDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
            },
            {
                orderId: 'ORD004',
                consumer: consumers[0]._id,
                farmer: nitinId,
                product: products[0]._id,
                quantity: 60,
                totalPrice: 3000,
                status: 'completed',
                orderDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
                deliveryDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) // 13 days ago
            },

            // Confirmed/Active Orders
            {
                orderId: 'ORD005',
                consumer: consumers[1]._id,
                farmer: nitinId,
                product: products[1]._id,
                quantity: 80,
                totalPrice: 4000,
                status: 'confirmed',
                orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days from now
            },
            {
                orderId: 'ORD006',
                consumer: consumers[2]._id,
                farmer: nitinId,
                product: products[2]._id,
                quantity: 90,
                totalPrice: 4500,
                status: 'confirmed',
                orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
            }
        ];

        // Insert orders
        await Order.insertMany(orders);
        console.log('Sample orders created successfully');

    } catch (error) {
        console.error('Error generating orders:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};

// Run the script
generateOrders(); 