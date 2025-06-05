import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

// Define API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                `${API_URL}/api/auth/forgot-password`,
                { email },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.success) {
                setStep(2);
            } else {
                setError(response.data.message || 'Failed to send OTP');
            }
        } catch (err) {
            console.error('Forgot password error:', err.response || err);
            setError(err.response?.data?.message || 'Error sending OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                `${API_URL}/api/auth/verify-otp`,
                { email, otp },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.success) {
                localStorage.setItem('resetToken', response.data.resetToken);
                setStep(3);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(response.data.message || 'Invalid OTP');
            }
        } catch (err) {
            console.error('OTP verification error:', err.response || err);
            setError(err.response?.data?.message || 'Error verifying OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-content">
                <div className="forgot-password-header">
                    <h2>Reset Password</h2>
                    <p>
                        {step === 1 && 'Enter your email to receive a verification code'}
                        {step === 2 && 'Enter the verification code sent to your email'}
                        {step === 3 && 'Success! You can now login and change your password'}
                    </p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="forgot-password-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-control"
                                placeholder="Enter your registered email"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Verification Code'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="forgot-password-form">
                        <div className="form-group">
                            <label>Verification Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="form-control"
                                placeholder="Enter 6-digit code"
                                maxLength="6"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <div className="success-message">
                        <p>Password reset process completed successfully!</p>
                        <p>Redirecting to login page...</p>
                    </div>
                )}

                <div className="back-to-login">
                    <button 
                        onClick={() => navigate('/login')}
                        className="btn-link"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword; 