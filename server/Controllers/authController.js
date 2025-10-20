const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Farmer = require('../Model/Farmer');
const Consumer = require('../Model/Consumer');
const FarmerDashboard = require('../Model/FarmerDashboard');
const ConsumerDashboard = require('../Model/ConsumerDashboard');
const { syncFarmerInventory } = require('../Utils/farmerUtils');
const { sendOTPEmail } = require('../Utils/emailService');

// Store OTP temporarily (in production, use Redis or similar)
const otpStore = new Map();

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

// Helper function to generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

exports.login = async (req, res, next) => {
    try {
        console.log('Login attempt received:', { method: req.method, path: req.path, body: req.body });

        const userType = req.path.includes('farmer') ? 'farmer' : 'consumer';
        const { phoneNumber, email, password } = req.body;

        // Validate required fields based on user type
        if (userType === 'farmer') {
            if (!phoneNumber || !password) {
                console.log('Farmer login validation failed: Missing phone or password');
                return res.status(400).json({ success: false, message: 'Please enter both phone number and password' });
            }
        } else if (userType === 'consumer') { // Explicitly check for consumer
             if (!email || !password) {
                console.log('Consumer login validation failed: Missing email or password');
                return res.status(400).json({ success: false, message: 'Please enter both email and password' });
            }
        } else { // Handle unexpected userType
             console.log('Login failed: Invalid user type derived from path', req.path);
             return res.status(400).json({ success: false, message: 'Invalid user type' });
        }

        let user = null;
        let Model = null;
        let query = {};

        if (userType === 'farmer') {
            Model = Farmer;
            query = { phoneNumber: phoneNumber };
        } else { // Assuming valid userType is either farmer or consumer after validation
            Model = Consumer;
             query = { email: email };
        }

        console.log(`Attempting to find ${userType}:`, query);
        user = await Model.findOne(query);

        if (!user) {
            console.log(`${userType} not found:`, query);
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        console.log(`${userType} found:`, user._id);

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log('Password mismatch for user:', user._id);
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('Password matched for user:', user._id);

        // Generate token
        const token = generateToken(user, userType);
        console.log('Token generated for user:', user._id);

        // If farmer, sync inventory and dashboard stats upon successful login
        if (userType === 'farmer') {
            console.log('Syncing farmer inventory for user:', user._id);
            await syncFarmerInventory(user._id);
            console.log('Farmer inventory synced successfully for user:', user._id);
        }

        console.log(`Login successful for ${userType}:`, user._id, 'Responding with token and user data.');
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                location: user.location,
                type: userType,
                ...(userType === 'consumer' && { email: user.email })
            }
        });

    } catch (error) {
        console.error('Login error in catch block:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email, userType } = req.body;

        if (!email || !userType) {
            return res.status(400).json({
                success: false,
                message: 'Email and user type are required'
            });
        }

        let user = null;
        
        // Find user based on userType
        if (userType === 'consumer') {
            user = await Consumer.findOne({ email });
        } else if (userType === 'farmer') {
            user = await Farmer.findOne({ email });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid user type'
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `No ${userType} account found with this email`
            });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP with timestamp (expires in 10 minutes)
        otpStore.set(email, {
            otp,
            timestamp: Date.now(),
            userId: user._id,
            userType
        });

        try {
            // Send OTP via email
            await sendOTPEmail(email, otp);
            
            return res.json({
                success: true,
                message: 'OTP sent successfully to your email'
            });
        } catch (sendError) {
            console.error('Error sending OTP:', sendError);
            otpStore.delete(email);
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP. Please try again.'
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp, userType } = req.body;

        if (!email || !otp || !userType) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP, and user type are required'
            });
        }

        // Get stored OTP data
        const storedData = otpStore.get(email);
        
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired or not found'
            });
        }

        // Verify user type matches
        if (storedData.userType !== userType) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user type'
            });
        }

        // Check if OTP is expired (10 minutes)
        if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
            otpStore.delete(email);
            return res.status(400).json({
                success: false,
                message: 'OTP expired'
            });
        }

        // Verify OTP
        if (otp !== storedData.otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { 
                userId: storedData.userId,
                userType: storedData.userType
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Clear OTP
        otpStore.delete(email);

        return res.json({
            success: true,
            message: 'OTP verified successfully',
            resetToken,
            userType: storedData.userType
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = exports;
