const jwt = require('jsonwebtoken');
const Farmer = require('../Model/Farmer');
const Consumer = require('../Model/Consumer');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token, authorization denied' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.user || !decoded.user.type) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token format' 
            });
        }

        // Find user based on type
        let user;
        if (decoded.user.type === 'farmer') {
            user = await Farmer.findById(decoded.user.id).select('-password');
        } else if (decoded.user.type === 'consumer') {
            user = await Consumer.findById(decoded.user.id).select('-password');
        }

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Add user and type to request object
        req.user = user;
        req.userType = decoded.user.type;
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid' 
        });
    }
};

module.exports = auth;
