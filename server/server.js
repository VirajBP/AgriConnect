const express = require("express");
require("dotenv").config();
const app = express();
const connectDB = require("./Config/Database");
const cors = require('cors');
const mongoose = require("mongoose");

// Connect to MongoDB
(async () => {
    try {
        await connectDB();
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }
})();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log requests
app.use((req, res, next) => {
    console.log('Request received:', {
        method: req.method,
        path: req.path,
        body: req.body,
        headers: req.headers
    });
    next();
});

// Routes
app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/farmer', require('./Routes/farmerRoutes'));
app.use('/api/consumer', require('./Routes/consumerRoutes'));
app.use('/api/chatbot', require('./Routes/chatbotRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        code: err.code
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'MongoServerError' && err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate key error',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    // Default error response
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

const PORT = process.env.PORT || 5000;

// Error handling for MongoDB connection
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        process.exit(1);
    }
});

// Start server with error handling
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try these steps:`);
        console.error('1. Stop any other servers running on this port');
        console.error('2. Wait a few seconds');
        console.error('3. Try starting the server again');
        process.exit(1);
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});