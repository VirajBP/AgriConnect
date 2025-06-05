const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, verifyOTP } = require('../Controllers/authController');
const { passwordResetLimiter } = require('../Middleware/rateLimiter');

// Register routes
router.post('/farmer/register', register);
router.post('/consumer/register', register);

// Login route
router.post('/farmer/login', login);
router.post('/consumer/login', login);

// Forgot password routes (with rate limiting)
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/verify-otp', passwordResetLimiter, verifyOTP);

module.exports = router; 