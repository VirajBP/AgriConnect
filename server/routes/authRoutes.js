const express = require('express');
const router = express.Router();
const { register, login } = require('../Controllers/authController');

// Register routes
router.post('/farmer/register', register);
router.post('/consumer/register', register);

// Login route
router.post('/farmer/login', login);
router.post('/consumer/login', login);

module.exports = router; 