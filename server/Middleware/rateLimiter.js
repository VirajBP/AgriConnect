const rateLimit = require('express-rate-limit');

// Rate limiter for password reset attempts
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 3, // limit each IP to 3 requests per windowMs
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again after an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    passwordResetLimiter
}; 