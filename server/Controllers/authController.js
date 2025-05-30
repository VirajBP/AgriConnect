const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Farmer = require('../Model/Farmer');
const Consumer = require('../Model/Consumer');
const FarmerDashboard = require('../Model/FarmerDashboard');
const ConsumerDashboard = require('../Model/ConsumerDashboard');

// Helper function to generate token
const generateToken = (user, type) => {
    try {
        return jwt.sign(
            { user: { id: user.id, type } },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    } catch (err) {
        console.error('Token generation error:', err);
        throw new Error('Failed to generate authentication token');
    }
};

// Helper function to create farmer dashboard
const createFarmerDashboard = async (farmerId) => {
    try {
        const dashboard = new FarmerDashboard({
            farmerId,
            stats: {
                totalRevenue: 0,
                activeListings: 0,
                completedOrders: 0,
                pendingOrders: 0
            },
            monthlyRevenue: [],
            popularProducts: []
        });
        await dashboard.save();
        return dashboard;
    } catch (error) {
        console.error('Error creating farmer dashboard:', error);
        throw error;
    }
};

// Helper function to create consumer dashboard
const createConsumerDashboard = async (consumerId) => {
    try {
        const dashboard = new ConsumerDashboard({
            consumerId,
            stats: {
                totalSpent: 0,
                totalOrders: 0,
                completedOrders: 0,
                pendingOrders: 0
            },
            favoriteProducts: [],
            monthlySpending: []
        });
        await dashboard.save();
        return dashboard;
    } catch (error) {
        console.error('Error creating consumer dashboard:', error);
        throw error;
    }
};

exports.register = async (req, res, next) => {
    try {
        console.log('Registration request body:', req.body);
        const userType = req.path.includes('farmer') ? 'farmer' : 'consumer';
        console.log('User type:', userType);

        if (userType === 'farmer') {
            const { name, phoneNumber, password, location } = req.body;
            console.log('Farmer registration data:', { 
                name, 
                phoneNumber, 
                location, 
                passwordLength: password?.length 
            });

            // Validate required fields
            if (!name || !phoneNumber || !password || !location) {
                const missingFields = [];
                if (!name) missingFields.push('name');
                if (!phoneNumber) missingFields.push('phoneNumber');
                if (!password) missingFields.push('password');
                if (!location) missingFields.push('location');
                
                return res.status(400).json({
                    success: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`
                });
            }

            // Validate phone number format (10 digits)
            if (!/^\d{10}$/.test(phoneNumber)) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number must be exactly 10 digits'
                });
            }

            // Validate password length
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters long'
                });
            }

            try {
                // Check if farmer exists
                const existingFarmer = await Farmer.findOne({ phoneNumber });
                if (existingFarmer) {
                    return res.status(400).json({
                        success: false,
                        message: 'Phone number already registered'
                    });
                }

                // Hash password
                const salt = await bcrypt.genSalt(12);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Create new farmer
                const farmer = new Farmer({
                    name,
                    phoneNumber,
                    password: hashedPassword,
                    location
                });

                await farmer.save();
                console.log('Farmer registered successfully:', farmer._id);

                // Create dashboard for the farmer
                await createFarmerDashboard(farmer._id);

                // Generate token
                const token = generateToken(farmer, 'farmer');

                // Send response without sensitive info
                return res.status(201).json({
                    success: true,
                    token,
                    user: {
                        id: farmer._id,
                        name: farmer.name,
                        phoneNumber: farmer.phoneNumber,
                        location: farmer.location,
                        type: 'farmer'
                    }
                });
            } catch (err) {
                console.error('Database operation error:', err);
                if (err.code === 11000) {
                    return res.status(400).json({
                        success: false,
                        message: 'Phone number already registered'
                    });
                }
                throw err;
            }
        } else {
            const { name, email, password, location, phoneNumber, type } = req.body;
            console.log('Consumer registration data:', { 
                name, 
                email, 
                phoneNumber, 
                location, 
                type,
                passwordLength: password?.length 
            });

            // Validate required fields
            const requiredFields = {
                name,
                email,
                password,
                location,
                phoneNumber,
                type
            };

            const missingFields = Object.entries(requiredFields)
                .filter(([_, value]) => !value)
                .map(([field]) => field);

            if (missingFields.length > 0) {
                console.log('Missing fields:', missingFields);
                return res.status(400).json({
                    success: false,
                    message: 'Validation Error',
                    errors: [`Missing required fields: ${missingFields.join(', ')}`]
                });
            }

            // Validate email format
            if (!/\S+@\S+\.\S+/.test(email)) {
                console.log('Invalid email format:', email);
                return res.status(400).json({
                    success: false,
                    message: 'Validation Error',
                    errors: ['Invalid email format']
                });
            }

            // Validate phone number format (10 digits)
            if (!/^\d{10}$/.test(phoneNumber)) {
                console.log('Invalid phone number format:', phoneNumber);
                return res.status(400).json({
                    success: false,
                    message: 'Validation Error',
                    errors: ['Phone number must be exactly 10 digits']
                });
            }

            // Validate password length
            if (password.length < 6) {
                console.log('Password too short:', password.length);
                return res.status(400).json({
                    success: false,
                    message: 'Validation Error',
                    errors: ['Password must be at least 6 characters long']
                });
            }

            try {
                // Check if consumer exists by email
                const existingConsumer = await Consumer.findOne({ email });
                if (existingConsumer) {
                    console.log('Email already registered:', email);
                    return res.status(400).json({
                        success: false,
                        message: 'Validation Error',
                        errors: ['Email already registered']
                    });
                }

                // Check if consumer exists by phone
                const existingConsumerByPhone = await Consumer.findOne({ phoneNumber });
                if (existingConsumerByPhone) {
                    console.log('Phone number already registered:', phoneNumber);
                    return res.status(400).json({
                        success: false,
                        message: 'Validation Error',
                        errors: ['Phone number already registered']
                    });
                }

                // Validate consumer type
                const validTypes = [
                    'Restaurant',
                    'Supermarket',
                    'Food Processing',
                    'Healthcare',
                    'Events',
                    'NGO',
                    'Hotel',
                    'Catering',
                    'Educational Institution',
                    'Corporate Cafeteria'
                ];

                if (!validTypes.includes(type)) {
                    console.log('Invalid consumer type:', type);
                    return res.status(400).json({
                        success: false,
                        message: 'Validation Error',
                        errors: [`Invalid consumer type. Must be one of: ${validTypes.join(', ')}`]
                    });
                }

                // Hash password
                const salt = await bcrypt.genSalt(12);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Create new consumer
                const consumer = new Consumer({
                    name,
                    email,
                    password: hashedPassword,
                    location,
                    phoneNumber,
                    type
                });

                await consumer.save();
                console.log('Consumer registered successfully:', consumer._id);

                // Create dashboard for the consumer
                await createConsumerDashboard(consumer._id);

                // Generate token
                const token = generateToken(consumer, 'consumer');

                // Send response without sensitive info
                return res.status(201).json({
                    success: true,
                    token,
                    user: {
                        id: consumer._id,
                        name: consumer.name,
                        email: consumer.email,
                        phoneNumber: consumer.phoneNumber,
                        location: consumer.location,
                        type: consumer.type
                    }
                });
            } catch (err) {
                console.error('Database operation error:', err);
                if (err.code === 11000) {
                    const field = Object.keys(err.keyPattern)[0];
                    return res.status(400).json({
                        success: false,
                        message: 'Validation Error',
                        errors: [`${field} already registered`]
                    });
                }
                throw err;
            }
        }
    } catch (err) {
        console.error('Registration error:', err);
        next(err);
    }
};

exports.login = async (req, res) => {
    try {
        const userType = req.path.includes('farmer') ? 'farmer' : 'consumer';

        if (userType === 'farmer') {
            const { phoneNumber, password } = req.body;

            // Validate required fields
            if (!phoneNumber || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide phone number and password'
                });
            }

            // Find farmer
            const farmer = await Farmer.findOne({ phoneNumber });
            if (!farmer) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, farmer.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check if dashboard exists, if not create one
            let dashboard = await FarmerDashboard.findOne({ farmerId: farmer._id });
            if (!dashboard) {
                console.log('Creating dashboard for farmer:', farmer._id);
                dashboard = await createFarmerDashboard(farmer._id);
            }

            // Generate token
            const token = generateToken(farmer, 'farmer');

            // Send response
            res.json({
                success: true,
                token,
                user: {
                    id: farmer._id,
                    name: farmer.name,
                    phoneNumber: farmer.phoneNumber,
                    location: farmer.location,
                    type: 'farmer'
                }
            });

        } else {
            const { email, password } = req.body;

            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide email and password'
                });
            }

            // Find consumer
            const consumer = await Consumer.findOne({ email });
            if (!consumer) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, consumer.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate token
            const token = generateToken(consumer, 'consumer');

            // Send response
            res.json({
                success: true,
                token,
                user: {
                    id: consumer._id,
                    name: consumer.name,
                    email: consumer.email,
                    location: consumer.location,
                    phoneNumber: consumer.phoneNumber,
                    type: 'consumer'
                }
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = exports;
