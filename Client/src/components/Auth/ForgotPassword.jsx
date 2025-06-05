import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../utils/axios';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [userType, setUserType] = useState('consumer');

    useEffect(() => {
        // Get user type from URL state or default to 'consumer'
        const stateUserType = location.state?.userType;
        if (stateUserType) {
            setUserType(stateUserType);
        }
    }, [location]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                '/api/auth/forgot-password',
                { email, userType },
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
                '/api/auth/verify-otp',
                { email, otp, userType },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.success) {
                localStorage.setItem('resetToken', response.data.resetToken);
                localStorage.setItem('userType', response.data.userType);
                setStep(3);
                // Redirect to the appropriate dashboard after 2 seconds
                setTimeout(() => {
                    navigate(`/${response.data.userType}/dashboard`);
                }, 2000);
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
                        {step === 3 && `Success! Redirecting to your ${userType} dashboard...`}
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
                        <p>Redirecting to your dashboard...</p>
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