const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require('../Controllers/authController');
const { passwordResetLimiter } = require('../Middleware/rateLimiter');
const {
  getAllStates,
  getCitiesForState,
} = require('../Utils/statesCitiesData');

// Register routes
router.post('/farmer/register', register);
router.post('/consumer/register', register);

// Login route
router.post('/farmer/login', login);
router.post('/consumer/login', login);

// Forgot password routes (with rate limiting)
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/verify-otp', passwordResetLimiter, verifyOTP);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Get all states
router.get('/states', (req, res) => {
  try {
    const states = getAllStates();
    res.json({
      success: true,
      data: states,
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching states',
    });
  }
});

// Get cities for a specific state
router.get('/cities/:state', (req, res) => {
  try {
    const { state } = req.params;
    const cities = getCitiesForState(state);

    if (cities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'State not found or no cities available',
      });
    }

    res.json({
      success: true,
      data: cities,
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cities',
    });
  }
});

module.exports = router;
