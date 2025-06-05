const nodemailer = require('nodemailer');

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail email
        pass: process.env.EMAIL_PASS  // Your Gmail app password
    }
});

// Function to send OTP email
const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP - AgriConnect',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a73e8; text-align: center;">AgriConnect Password Reset</h2>
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
                        <p>Hello,</p>
                        <p>You have requested to reset your password. Please use the following OTP to verify your identity:</p>
                        <h1 style="text-align: center; color: #1a73e8; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
                        <p>This OTP will expire in 10 minutes.</p>
                        <p style="color: #666;">If you didn't request this password reset, please ignore this email.</p>
                    </div>
                    <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
                        This is an automated email. Please do not reply.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendOTPEmail
}; 