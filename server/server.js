const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const app = express();
const server = http.createServer(app);

// Load CORS immediately
const cors = require('cors');

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    // origin: 'https://agri-connect-gamma.vercel.app',
    origin: 'http://localhost:3000',
    credentials: true,
  },
});

// Lazy load dependencies
let connectDB, mongoose;

const loadDependencies = () => {
  if (!connectDB) {
    connectDB = require('./Config/Database');
    mongoose = require('mongoose');

    // Lazy load models only when needed
    require('./Model/Farmer.js');
    require('./Model/Consumer.js');
    require('./Model/Product.js');
    require('./Model/Order.js');
  }
};

// Setup CORS middleware immediately
app.use(
  cors({
    // origin: 'https://agri-connect-gamma.vercel.app',
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  })
);

// Parse JSON bodies with increased limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log('Request received:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers,
  });
  next();
});

// Register routes immediately (before DB connection)
app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/farmer', require('./Routes/farmerRoutes'));
app.use('/api/consumer', require('./Routes/consumerRoutes'));
app.use('/api/chatbot', require('./Routes/chatbotRoutes'));
app.use('/api/chat', require('./Routes/chatRoutes'));

// Connect to MongoDB and initialize routes
let isConnected = false;

const initializeServer = async () => {
  if (isConnected) return;

  try {
    // Load dependencies only when initializing
    loadDependencies();
    
    // Load chat models
    require('./Model/Chat');
    require('./Model/Message');

    await connectDB();
    isConnected = true;
    console.log('MongoDB connected successfully');
    
    // Initialize Socket.IO after DB connection
    const { handleConnection } = require('./Utils/socketHandler');
    handleConnection(io);

    // Set up mongoose event listeners after mongoose is loaded
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    // Routes are now loaded outside this function

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message),
    });
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate key error',
      field: Object.keys(err.keyPattern)[0],
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
});

process.on('SIGINT', async () => {
  try {
    if (mongoose && mongoose.connection) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB connection closure:', err);
    process.exit(1);
  }
});

// Initialize the server
initializeServer();
