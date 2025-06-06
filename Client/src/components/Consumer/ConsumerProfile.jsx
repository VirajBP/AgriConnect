import React, { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaLock, FaMapMarkerAlt, FaShoppingBag, FaMoon, FaSun, FaEdit, FaCheck, FaTimes, FaEye, FaEyeSlash, FaEnvelope, FaCity } from 'react-icons/fa';
import Sidebar from '../Sidebar/Sidebar';
import axios from '../../utils/axios';
import { CircularProgress } from '@mui/material';
import { useTheme } from '../../Context/ThemeContext';
import './ConsumerProfile.css';
import '../../index.css'

const ConsumerProfile = () => {
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState({});
    const [tempData, setTempData] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isDarkMode, toggleTheme } = useTheme();

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await axios.get('/api/consumer/profile');
                console.log(response.data)
                if (response.data.success) {
                    setProfile(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch profile data');
                }
            } catch (err) {
                console.error('Error fetching profile data:', err);
                setError(err.response?.data?.message || 'Error fetching profile data');
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const editableFields = {
        name: {
            label: 'Full Name',
            type: 'text',
            icon: <FaUser />,
            validation: value => value?.length >= 2
        },
        email: {
            label: 'Email Address',
            type: 'email',
            icon: <FaEnvelope />,
            validation: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        },
        phoneNumber: {
            label: 'Contact Number',
            type: 'tel',
            icon: <FaPhone />,
            validation: value => /^\+?[\d\s-]{10,}$/.test(value)
        },
        location: {
            label: 'City',
            type: 'text',
            icon: <FaCity />,
            validation: value => value?.length >= 2
        },
        address: {
            label: 'Delivery Address',
            type: 'text',
            icon: <FaMapMarkerAlt />,
            validation: value => value?.length >= 3
        },
        password: {
            label: 'Password',
            type: 'password',
            icon: <FaLock />,
            validation: value => {
                // Password must be at least 6 characters long and contain at least one number
                return value?.length >= 6 && /\d/.test(value);
            }
        }
    };

    const handleInputChange = (field, value) => {
        setTempData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEdit = (field) => {
        setEditMode({ ...editMode, [field]: true });
        setTempData({ ...tempData, [field]: profile ? profile[field] : '' });
    };

    const handleCancel = (field) => {
        setEditMode({ ...editMode, [field]: false });
        setTempData({ ...tempData, [field]: '' });
    };

    const handleSave = async (field) => {
        // Special handling for password field
        if (field === 'password') {
            if (!editableFields.password.validation(tempData.password)) {
                alert('Password must be at least 6 characters long and contain at least one number');
                return;
            }

            try {
                const response = await axios.put('/api/consumer/profile/update-password', {
                    password: tempData.password
                });
                
                if (response.data.success) {
                    setEditMode({ ...editMode, password: false });
                    setTempData({ ...tempData, password: '' });
                    alert('Password updated successfully!');
                } else {
                    alert(response.data.message || 'Failed to update password');
                }
            } catch (error) {
                console.error('Error updating password:', error);
                alert(error.response?.data?.message || 'Failed to update password');
            }
            return;
        }

        // Handle other fields
        if (editableFields[field].validation(tempData[field])) {
            try {
                const response = await axios.put('/api/consumer/profile/update', {
                    [field]: tempData[field]
                });
                
                if (response.data.success) {
                    setProfile({ ...profile, [field]: tempData[field] });
                    setEditMode({ ...editMode, [field]: false });
                    setTempData({ ...tempData, [field]: '' });
                    alert('Profile updated successfully!');
                } else {
                    alert(response.data.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert(error.response?.data?.message || 'Failed to update profile');
            }
        } else {
            alert('Please enter valid information');
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <CircularProgress />
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-error">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="consumer-profile">
            <Sidebar 
                userType="consumer" 
                onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
            />
            <div className={`profile-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDarkMode ? 'dark' : ''}`}>
                {loading ? (
                    <div className="profile-loading">
                        <CircularProgress />
                    </div>
                ) : error ? (
                    <div className="profile-error">
                        <p>{error}</p>
                    </div>
                ) : profile && (
                    <>
                        <div className="profile-header">
                            <div className="profile-cover">
                                <div className="profile-avatar">
                                    <FaUser />
                                </div>
                            </div>
                            <div className="profile-info">
                                <h1>{profile.name}</h1>
                                <p className="profile-role">Consumer</p>
                                <p className="profile-join-date">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="profile-main">
                            {/* Theme Settings Section */}
                            <div className={`${isDarkMode ? 'profile-section-dark theme-section-dark' : 'profile-section theme-section'}`}>
                                <div className="section-header">
                                    <h2>Theme Settings</h2>
                                </div>
                                <div className={`${isDarkMode ? 'theme-toggle-dark' : 'theme-toggle'}`}>
                                    <div className="theme-info">
                                        <div className="theme-icon">
                                            {isDarkMode ? <FaMoon /> : <FaSun />}
                                        </div>
                                        <div className="theme-text">
                                            <h3>Current Theme</h3>
                                            <p>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</p>
                                        </div>
                                    </div>
                                    <button 
                                        className="theme-switch-btn"
                                        onClick={toggleTheme}
                                    >
                                        Switch to {isDarkMode ? 'Light' : 'Dark'} Mode
                                    </button>
                                </div>
                            </div>

                            {/* Personal Information Section */}
                            <div className={`${isDarkMode ? 'profile-section-dark' : 'profile-section'}`}>
                                <div className="section-header">
                                    <h2>Personal Information</h2>
                                </div>
                                <div className="profile-fields">
                                    {/* Name Field */}
                                    <div className={`${isDarkMode ? 'profile-field-dark' : 'profile-field'}`}>
                                        <div className="field-content">
                                            <div className="field-icon">
                                                <FaUser />
                                            </div>
                                            <div className="field-info">
                                                <label>Full Name</label>
                                                {editMode.name ? (
                                                    <div className="field-edit">
                                                        <input
                                                            type="text"
                                                            value={tempData.name || profile.name}
                                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                                        />
                                                        <div className="edit-actions">
                                                            <button className="action-btn save" onClick={() => handleSave('name')}>
                                                                <FaCheck />
                                                            </button>
                                                            <button className="action-btn cancel" onClick={() => handleCancel('name')}>
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`field-value ${isDarkMode? "text-white":"text-black"}`}>
                                                        <span className={`${isDarkMode?"text-white" : "text-black"}`}>{profile.name}</span>
                                                        <button className="edit-btn" onClick={() => handleEdit('name')}>
                                                            <FaEdit />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Email Field */}
                                    <div className={`${isDarkMode ? 'profile-field-dark' : 'profile-field'}`}>
                                        <div className="field-content">
                                            <div className="field-icon">
                                                <FaEnvelope />
                                            </div>
                                            <div className="field-info">
                                                <label>Email Address</label>
                                                {editMode.email ? (
                                                    <div className="field-edit">
                                                        <input
                                                            type="email"
                                                            value={tempData.email || profile.email}
                                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                                        />
                                                        <div className="edit-actions">
                                                            <button className="action-btn save" onClick={() => handleSave('email')}>
                                                                <FaCheck />
                                                            </button>
                                                            <button className="action-btn cancel" onClick={() => handleCancel('email')}>
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`field-value `}>
                                                        <span className={`${isDarkMode?"text-white" : "text-black"}`}>{profile.email}</span>
                                                        <button className="edit-btn" onClick={() => handleEdit('email')}>
                                                            <FaEdit />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phone Number Field */}
                                    <div className={`${isDarkMode ? 'profile-field-dark' : 'profile-field'}`}>
                                        <div className="field-content">
                                            <div className="field-icon">
                                                <FaPhone />
                                            </div>
                                            <div className="field-info">
                                                <label>Contact Number</label>
                                                {editMode.phoneNumber ? (
                                                    <div className="field-edit">
                                                        <input
                                                            type="tel"
                                                            value={tempData.phoneNumber || profile.phoneNumber}
                                                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                                        />
                                                        <div className="edit-actions">
                                                            <button className="action-btn save" onClick={() => handleSave('phoneNumber')}>
                                                                <FaCheck />
                                                            </button>
                                                            <button className="action-btn cancel" onClick={() => handleCancel('phoneNumber')}>
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`field-value ${isDarkMode? "text-white":"text-black"}`}>
                                                        <span className={`${isDarkMode?"text-white" : "text-black"}`}>{profile.phoneNumber}</span>
                                                        <button className="edit-btn" onClick={() => handleEdit('phoneNumber')}>
                                                            <FaEdit />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* City/Location Field */}
                                    <div className={`${isDarkMode ? 'profile-field-dark' : 'profile-field'}`}>
                                        <div className="field-content">
                                            <div className="field-icon">
                                                <FaCity />
                                            </div>
                                            <div className="field-info">
                                                <label>City</label>
                                                {editMode.location ? (
                                                    <div className="field-edit">
                                                        <input
                                                            type="text"
                                                            value={tempData.location || profile.location}
                                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                                        />
                                                        <div className="edit-actions">
                                                            <button className="action-btn save" onClick={() => handleSave('location')}>
                                                                <FaCheck />
                                                            </button>
                                                            <button className="action-btn cancel" onClick={() => handleCancel('location')}>
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`field-value ${isDarkMode? "text-white":"text-black"}`}>
                                                        <span className={`${isDarkMode?"text-white" : "text-black"}`}>{profile.location}</span>
                                                        <button className="edit-btn" onClick={() => handleEdit('location')}>
                                                            <FaEdit />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Field */}
                                    <div className={`${isDarkMode ? 'profile-field-dark' : 'profile-field'}`}>
                                        <div className="field-content">
                                            <div className="field-icon">
                                                <FaMapMarkerAlt />
                                            </div>
                                            <div className="field-info">
                                                <label>Delivery Address</label>
                                                {editMode.address ? (
                                                    <div className="field-edit">
                                                        <input
                                                            type="text"
                                                            value={tempData.address || profile.address}
                                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                                        />
                                                        <div className="edit-actions">
                                                            <button className="action-btn save" onClick={() => handleSave('address')}>
                                                                <FaCheck />
                                                            </button>
                                                            <button className="action-btn cancel" onClick={() => handleCancel('address')}>
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`field-value ${isDarkMode? "text-white":"text-black"}`}>
                                                        <span className={`${isDarkMode?"text-white" : "text-black"}`}>{profile.address}</span>
                                                        <button className="edit-btn" onClick={() => handleEdit('address')}>
                                                            <FaEdit />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div className={`${isDarkMode ? 'profile-field-dark' : 'profile-field'}`}>
                                        <div className="field-content">
                                            <div className="field-icon">
                                                <FaLock />
                                            </div>
                                            <div className="field-info">
                                                <label>Password</label>
                                                {editMode.password ? (
                                                    <div className="field-edit">
                                                        <div className="password-input">
                                                            <input
                                                                type={showPassword ? "text" : "password"}
                                                                value={tempData.password || ''}
                                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                                            />
                                                            <button 
                                                                className="toggle-password"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                            >
                                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                            </button>
                                                        </div>
                                                        <div className="edit-actions">
                                                            <button className="action-btn save" onClick={() => handleSave('password')}>
                                                                <FaCheck />
                                                            </button>
                                                            <button className="action-btn cancel" onClick={() => handleCancel('password')}>
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`field-value ${isDarkMode? "text-white":"text-black"    }`}>
                                                        <span className={`${isDarkMode?"text-white" : "text-black"}`}>••••••••</span>
                                                        <button className="edit-btn" onClick={() => handleEdit('password')}>
                                                            <FaEdit />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConsumerProfile; 