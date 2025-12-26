import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './Signup.css';

// Define API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Signup = () => {
  const navigate = useNavigate();
  const { userType } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: userType === 'consumer' ? '' : undefined,
    password: '',
    confirmPassword: '',

    type: userType === 'consumer' ? 'Restaurant' : undefined,
    state: '',
    city: '',
    address: userType === 'consumer' ? '' : undefined,
  });
  const [error, setError] = useState('');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const consumerTypes = [
    'Restaurant',
    'Supermarket',
    'Food Processing',
    'Healthcare',
    'Events',
    'NGO',
    'Hotel',
    'Catering',
    'Educational Institution',
    'Corporate Cafeteria',
  ];

  // Fetch states on component mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.state) {
      fetchCities(formData.state);
    } else {
      setCities([]);
      setFormData(prev => ({ ...prev, city: '' }));
    }
  }, [formData.state]);

  const fetchStates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/states`);
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchCities = async state => {
    try {
      setLoadingCities(true);
      const response = await axios.get(
        `${API_URL}/api/auth/cities/${encodeURIComponent(state)}`
      );
      if (response.data.success) {
        setCities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    try {
      // Validation logic...
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      if (!/^\d{10}$/.test(formData.phoneNumber)) {
        setError('Phone number must be exactly 10 digits');
        return;
      }

      if (!formData.state) {
        setError('Please select a state');
        return;
      }

      if (!formData.city) {
        setError('Please select a city');
        return;
      }

      if (userType === 'consumer') {
        if (!formData.email) {
          setError('Email is required for consumer registration');
          return;
        }
        if (!formData.type) {
          setError('Please select a consumer type');
          return;
        }
        if (!formData.state) {
          setError('Please select a state');
          return;
        }
        if (!formData.city) {
          setError('Please select a city');
          return;
        }
        if (!formData.address) {
          setError('Address is required');
          return;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
          setError('Please enter a valid email address');
          return;
        }
      }

      const signupData = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        location: `${formData.city}, ${formData.state}`,
        state: formData.state,
        city: formData.city,
      };

      if (userType === 'consumer') {
        signupData.email = formData.email.trim();
        signupData.type = formData.type;
        signupData.state = formData.state;
        signupData.city = formData.city;
        signupData.address = formData.address.trim();
      }

      console.log('Attempting signup with:', signupData);

      const response = await axios.post(
        `${API_URL}/api/auth/${userType}/register`,
        signupData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Server response:', response.data);

      if (response.data.success) {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('userType', userType);
        }
        navigate('/login');
      }
    } catch (err) {
      console.error('Signup error details:', {
        data: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        message: err.message,
      });

      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join('\n'));
      } else {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'Registration failed. Please try again.';
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-content">
        <div className="signup-left">
          <h1>Welcome to AgriConnect</h1>
          <p>
            Join our platform to connect with farmers and consumers, making
            agricultural trade more efficient and sustainable.
          </p>
          <ul className="signup-features">
            <li>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Direct access to fresh produce
            </li>
            <li>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Fair pricing and transparency
            </li>
            <li>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Community-driven marketplace
            </li>
          </ul>
        </div>
        <div className="signup-right">
          <div className="signup-header">
            <h2>
              {userType === 'farmer' ? 'Farmer' : 'Consumer'} Registration
            </h2>
            <p>Create your account to get started</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-control"
                    required
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="form-control"
                    required
                    placeholder="10-digit phone number"
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label>State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select your state</option>
                    {states.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label>City</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="form-control"
                    required
                    disabled={!formData.state || loadingCities}
                  >
                    <option value="">
                      {loadingCities
                        ? 'Loading cities...'
                        : !formData.state
                          ? 'Select state first'
                          : 'Select your city'}
                    </option>
                    {cities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {userType === 'consumer' && (
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                  required
                  placeholder="Enter your email"
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-control"
                    required
                    placeholder="Min. 6 characters"
                  />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-control"
                    required
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>

            {userType === 'consumer' && (
              <>
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label>State</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="form-control"
                        required
                      >
                        <option value="">Select your state</option>
                        {states.map(state => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group">
                      <label>City</label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="form-control"
                        required
                        disabled={!formData.state || loadingCities}
                      >
                        <option value="">
                          {loadingCities
                            ? 'Loading cities...'
                            : !formData.state
                              ? 'Select state first'
                              : 'Select your city'}
                        </option>
                        {cities.map(city => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="form-control"
                    required
                    placeholder="Enter your complete address"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Consumer Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select your organization type</option>
                    {consumerTypes.map(type => (
                      <option key={type} value={type}>
                        {type.split(/(?=[A-Z])/).join(' ')}
                      </option>
                    ))}
                  </select>
                  <small className="form-text">
                    Select the type that best describes your organization
                  </small>
                </div>
              </>
            )}

            <button type="submit" className="btn-signup">
              Create Account
            </button>

            <div className="login-link">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
