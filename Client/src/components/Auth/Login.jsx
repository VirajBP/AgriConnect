import React, { useState, useEffect } from 'react';
// import axios from '../../utils/axios';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import PasswordChangeAlert from './PasswordChangeAlert';
import './Login.css';

// Define API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Login = () => {
    const navigate = useNavigate();
    const [userType, setUserType] = useState('farmer');
    const [formData, setFormData] = useState({
        phoneNumber: '',
        email: '',
        password: '',
        rememberMe: false
    });
    const [error, setError] = useState('');
    const [showPasswordAlert, setShowPasswordAlert] = useState(false);

    useEffect(() => {
        // Check if user just completed password reset
        const resetToken = localStorage.getItem('resetToken');
        if (resetToken) {
            setShowPasswordAlert(true);
            localStorage.removeItem('resetToken');
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleUserTypeChange = (type) => {
        setUserType(type);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Basic validation
            if (userType === 'farmer') {
                if (!formData.phoneNumber || !formData.password) {
                    setError('Please fill in all fields');
                    return;
                }

                if (!/^\d{10}$/.test(formData.phoneNumber)) {
                    setError('Phone number must be exactly 10 digits');
                    return;
                }
            } else {
                if (!formData.email || !formData.password) {
                    setError('Please fill in all fields');
                    return;
                }

                if (!/\S+@\S+\.\S+/.test(formData.email)) {
                    setError('Please enter a valid email address');
                    return;
                }
            }

            const loginData = userType === 'farmer' 
                ? {
                    phoneNumber: formData.phoneNumber.trim(),
                    password: formData.password
                }
                : {
                    email: formData.email.trim(),
                    password: formData.password
                };

            console.log('Attempting login with:', { ...loginData, userType });

            const response = await axios.post(
                `${API_URL}/auth/${userType}/login`,
                loginData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Login response:', response.data);

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userType', userType);
                
                // Force a full page reload after setting localStorage
                window.location.href = `/${userType}/dashboard`;
            }
        } catch (err) {
            console.error('Login error:', err.response || err);
            
            const errorMessage = err.response?.data?.message || 
                               err.message || 
                               'Login failed. Please try again.';
            setError(errorMessage);
        }
    };

    return (
        <>
            <div className="login-container">
                <div className="login-content">
                    <div className="login-left">
                        <h1>Welcome to AgriConnect</h1>
                        <p>Connect with farmers and consumers to make agricultural trade more efficient and sustainable.</p>
                        <ul className="login-benefits">
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                Streamlined Trading Process
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="3" y1="9" x2="21" y2="9"></line>
                                    <line x1="9" y1="21" x2="9" y2="9"></line>
                                </svg>
                                Real-time Market Updates
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                Location-based Matching
                            </li>
                        </ul>
                    </div>
                    
                    <div className="login-right">
                        <div className="login-header">
                            <h2>Welcome Back</h2>
                            <p>Sign in to continue to your account</p>
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <div className="user-type-selector">
                            <button
                                type="button"
                                className={`user-type-button ${userType === 'farmer' ? 'active' : ''}`}
                                onClick={() => handleUserTypeChange('farmer')}
                            >
                                Farmer
                            </button>
                            <button
                                type="button"
                                className={`user-type-button ${userType === 'consumer' ? 'active' : ''}`}
                                onClick={() => handleUserTypeChange('consumer')}
                            >
                                Consumer
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="login-form">
                            {userType === 'farmer' ? (
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="form-control"
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="form-control"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            <div className="remember-forgot">
                                <label className="remember-me">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                    />
                                    Remember me
                                </label>
                                <Link to="/forgot-password" className="forgot-password">
                                    Forgot Password?
                                </Link>
                            </div>

                            <button type="submit" className="btn-login">
                                Sign In
                            </button>

                            <div className="signup-link">
                                Don't have an account?
                                <Link to={`/signup/${userType}`}>
                                    Create Account
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {showPasswordAlert && (
                <PasswordChangeAlert onClose={() => setShowPasswordAlert(false)} />
            )}
        </>
    );
};

export default Login;