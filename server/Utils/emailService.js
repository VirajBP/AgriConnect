const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOrderNotification = async (userEmail, userName, orderDetails, type) => {
  const subject = type === 'confirmed' ? 'Order Confirmed' : 'Order Completed';
  const message = type === 'confirmed' 
    ? `Your order for ${orderDetails.productName} has been confirmed.`
    : `Your order for ${orderDetails.productName} has been completed.`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `AgriConnect - ${subject}`,
    html: `
      <h2>Hello ${userName},</h2>
      <p>${message}</p>
      <p><strong>Order Details:</strong></p>
      <ul>
        <li>Product: ${orderDetails.productName}</li>
        <li>Quantity: ${orderDetails.quantity}</li>
        <li>Total: ₹${orderDetails.total}</li>
      </ul>
      <p>Thank you for using AgriConnect!</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`${type} notification sent to ${userEmail}`);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'AgriConnect - Password Reset OTP',
    html: `
      <h2>Password Reset OTP</h2>
      <p>Your OTP for password reset is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Thank you for using AgriConnect!</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('OTP email sending failed:', error);
    throw error;
  }
};

module.exports = { sendOrderNotification, sendOTPEmail };