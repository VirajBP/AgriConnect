import React, { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaLock, FaMapMarkerAlt, FaShoppingBag, FaMoon, FaSun, FaEdit, FaCheck, FaTimes, FaEye, FaEyeSlash, FaEnvelope, FaCity, FaGlobe, FaCamera } from 'react-icons/fa';
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
    const [profileComplete, setProfileComplete] = useState(true);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const { isDarkMode, toggleTheme } = useTheme();

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await axios.get('/api/consumer/profile');
                console.log(response.data)
                if (response.data.success) {
                    setProfile(response.data.data);
                    
                    // Check if profile is complete
                    const requiredFields = ['name', 'email', 'phoneNumber', 'address', 'type', 'state', 'city'];
                    const isComplete = requiredFields.every(field => 
                        response.data.data[field] && response.data.data[field].toString().trim() !== ''
                    );
                    setProfileComplete(isComplete);
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

        const fetchStates = async () => {
            try {
                const response = await axios.get('/api/auth/states');
                if (response.data.success) {
                    setStates(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching states:', error);
            }
        };

        fetchProfileData();
        fetchStates();
    }, []);

    // Fetch cities when state changes in edit mode
    useEffect(() => {
        if (editMode.state && tempData.state) {
            fetchCities(tempData.state);
        }
        // Also fetch cities when editing city and we have a current state
        if (editMode.city && !editMode.state && profile?.state) {
            fetchCities(profile.state);
        }
    }, [tempData.state, editMode.state, editMode.city, profile?.state]);

    const fetchCities = async (state) => {
        try {
            setLoadingCities(true);
            const response = await axios.get(`/api/auth/cities/${encodeURIComponent(state)}`);
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

        state: {
            label: 'State',
            type: 'select',
            icon: <FaGlobe />,
            validation: value => states.includes(value)
        },
        city: {
            label: 'City',
            type: 'select',
            icon: <FaCity />,
            validation: value => cities.includes(value)
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
        },
        type: {
            label: 'Consumer Type',
            type: 'select',
            icon: <FaShoppingBag />,
            validation: value => {
                const validTypes = [
                    'Restaurant', 'Supermarket', 'Food Processing', 'Healthcare',
                    'Events', 'NGO', 'Hotel', 'Catering', 'Educational Institution', 'Corporate Cafeteria'
                ];
                return validTypes.includes(value);
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
        
        // If editing state, also load cities for current state
        if (field === 'state' && profile?.state) {
            fetchCities(profile.state);
        }
        // If editing city, load cities for current state
        if (field === 'city' && profile?.state) {
            fetchCities(profile.state);
            // Set tempData.state to current profile state so city dropdown works
            setTempData(prev => ({ ...prev, state: profile.state, [field]: profile[field] || '' }));
        }
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
                    const updatedProfile = { ...profile, [field]: tempData[field] };
                    setProfile(updatedProfile);
                    setEditMode({ ...editMode, [field]: false });
                    setTempData({ ...tempData, [field]: '' });
                    
                    // Check if profile is now complete
                    const requiredFields = ['name', 'email', 'phoneNumber', 'address', 'type', 'state', 'city'];
                    const isComplete = requiredFields.every(field => 
                        updatedProfile[field] && updatedProfile[field].toString().trim() !== ''
                    );
                    setProfileComplete(isComplete);
                    
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

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const photoData = e.target.result;
                
                const response = await axios.post('/api/consumer/profile/upload-photo', {
                    photoData
                });
                
                if (response.data.success) {
                    setProfile(response.data.data);
                    alert('Profile photo updated successfully!');
                } else {
                    alert(response.data.message || 'Failed to upload photo');
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert(error.response?.data?.message || 'Failed to upload photo');
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
                                <div className="profile-avatar" onClick={() => setPhotoModalOpen(true)} style={{ cursor: 'pointer' }}>
                                    {profile.profilePhoto ? (
                                        <img 
                                            src={profile.profilePhoto} 
                                            alt="Profile" 
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '50%'
                                            }}
                                        />
                                    ) : (
                                        <FaUser />
                                    )}
                                </div>
                            </div>
                            <div className="profile-info">
                                <h1 style={{ color: isDarkMode ? '#fff' : '#000' }}>{profile.name}</h1>
                                <p className="profile-role" style={{ color: isDarkMode ? '#fff' : '#000' }}>Consumer</p>
                                <p className="profile-join-date" style={{ color: isDarkMode ? '#fff' : '#000' }}>Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
                                {profile.rating && profile.rating.count > 0 && (
                                    <div className="profile-rating" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <span
                                                    key={star}
                                                    style={{
                                                        color: star <= Math.round(profile.rating.average) ? '#ffc107' : '#ddd',
                                                        fontSize: '18px'
                                                    }}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <span style={{ color: isDarkMode ? '#ffffff' : '#000000', fontSize: '16px', fontWeight: '500' }}>
                                            {profile.rating.average.toFixed(1)} ({profile.rating.count} reviews)
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="profile-main">
                            {/* Profile Completion Banner */}
                            {!profileComplete && (
                                <div className={`${isDarkMode ? 'profile-section-dark' : 'profile-section'}`} style={{
                                    background: isDarkMode ? 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)' : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                                    color: 'white',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div className="section-header" style={{ borderBottom: 'none', marginBottom: '1rem' }}>
                                        <h2 style={{ color: 'white', margin: 0 }}>Complete Your Profile</h2>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
                                        Please complete all required fields in your profile to access the full features of AgriConnect.
                                        Missing information may prevent you from placing orders or accessing certain services.
                                    </p>
                                </div>
                            )}
                            
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



                                    {/* State Field */}
                                    <div className={`${isDarkMode ? 'profile-field-dark' : 'profile-field'}`}>
                                        <div className="field-content">
                                            <div className="field-icon">
                                                <FaGlobe />
                                            </div>
                                            <div className="field-info">
                                                <label>State</label>
                                                {editMode.state ? (
                                                    <div className="field-edit">
                                                        <select
                                                            value={tempData.state || profile.state}
                                                            onChange={(e) => {
                                                                handleInputChange('state', e.target.value);
                                                                // Reset city when state changes
                                                                handleInputChange('city', '');
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.75rem',
                                                                border: '1px solid var(--border-color)',
                                                                borderRadius: '6px',
                                                                fontSize: '1rem',
                                                                color: 'var(--text-color)',
                                                                backgroundColor: isDarkMode ? '#2c2c2c' : '#fff'
                                                            }}
                                                        >
                                                            <option value="">Select State</option>
                                                            {states.map(state => (
                                                                <option key={state} value={state}>
                                                                    {state}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="edit-actions">
                                                            <button className="action-btn save" onClick={() => handleSave('state')}>
                                                                <FaCheck />
                                                            </button>
                                                            <button className="action-btn cancel" onClick={() => handleCancel('state')}>
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`field-value ${isDarkMode? "text-white":"text-black"}`}>
                                                        <span className={`${isDarkMode?"text-white" : "text-black"}`}>{profile.state || 'Not set'}</span>
                                                        <button className="edit-btn" onClick={() => handleEdit('state')}>
                                                            <FaEdit />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* City Field */}
                                    <div className={`${isDarkMode ? 'profile-field-dark' : 'profile-field'}`}>
                                        <div className="field-content">
                                            <div className="field-icon">
                                                <FaCity />
                                            </div>
                                            <div className="field-info">
                                                <label>City</label>
                                                {editMode.city ? (
                                                    <div className="field-edit">
                                                        <select
                                                            value={tempData.city || profile.city}
                                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                                            disabled={(!tempData.state && !profile?.state) || loadingCities}
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.75rem',
                                                                border: '1px solid var(--border-color)',
                                                                borderRadius: '6px',
                                                                fontSize: '1rem',
                                                                color: 'var(--text-color)',
                                                                backgroundColor: isDarkMode ? '#2c2c2c' : '#fff'
                                                            }}
                                                        >
                                                            <option value="">
                                                                {loadingCities ? 'Loading cities...' : 
                                                                 (!tempData.state && !profile?.state) ? 'Select state first' : 
                                                                 'Select City'}
                                                            </option>
                                                            {cities.map(city => (
                                                                <option key={city} value={city}>
                                                                    {city}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="edit-actions">
                                                            <button className="action-btn save" onClick={() => handleSave('city')}>
                                                                <FaCheck />
                                                            </button>
                                                            <button className="action-btn cancel" onClick={() => handleCancel('city')}>
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`field-value ${isDarkMode? "text-white":"text-black"}`}>
                                                        <span className={`${isDarkMode?"text-white" : "text-black"}`}>{profile.city || 'Not set'}</span>
                                                        <button className="edit-btn" onClick={() => handleEdit('city')}>
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

                                    {/* Consumer Type Field */}
                                    <div className={`${isDarkMode ? 'profile-field-dark' : 'profile-field'}`}>
                                        <div className="field-content">
                                            <div className="field-icon">
                                                <FaShoppingBag />
                                            </div>
                                            <div className="field-info">
                                                <label>Consumer Type</label>
                                                {editMode.type ? (
                                                    <div className="field-edit">
                                                        <select
                                                            value={tempData.type || profile.type}
                                                            onChange={(e) => handleInputChange('type', e.target.value)}
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.75rem',
                                                                border: '1px solid var(--border-color)',
                                                                borderRadius: '6px',
                                                                fontSize: '1rem',
                                                                color: 'var(--text-color)',
                                                                backgroundColor: isDarkMode ? '#2c2c2c' : '#fff'
                                                            }}
                                                        >
                                                            <option value="">Select Consumer Type</option>
                                                            <option value="Restaurant">Restaurant</option>
                                                            <option value="Supermarket">Supermarket</option>
                                                            <option value="Food Processing">Food Processing</option>
                                                            <option value="Healthcare">Healthcare</option>
                                                            <option value="Events">Events</option>
                                                            <option value="NGO">NGO</option>
                                                            <option value="Hotel">Hotel</option>
                                                            <option value="Catering">Catering</option>
                                                            <option value="Educational Institution">Educational Institution</option>
                                                            <option value="Corporate Cafeteria">Corporate Cafeteria</option>
                                                        </select>
                                                        <div className="edit-actions">
                                                            <button className="action-btn save" onClick={() => handleSave('type')}>
                                                                <FaCheck />
                                                            </button>
                                                            <button className="action-btn cancel" onClick={() => handleCancel('type')}>
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`field-value ${isDarkMode? "text-white":"text-black"}`}>
                                                        <span className={`${isDarkMode?"text-white" : "text-black"}`}>{profile.type}</span>
                                                        <button className="edit-btn" onClick={() => handleEdit('type')}>
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

                {/* Photo Modal */}
                {photoModalOpen && (
                    <div className="photo-modal-overlay" onClick={() => setPhotoModalOpen(false)}>
                        <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Profile Photo</h3>
                            {profile.profilePhoto && (
                                <div className="photo-preview">
                                    <img src={profile.profilePhoto} alt="Profile" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '10px' }} />
                                </div>
                            )}
                            <div className="photo-actions">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => { handlePhotoUpload(e); setPhotoModalOpen(false); }}
                                    style={{ display: 'none' }}
                                    id="photo-upload-modal"
                                />
                                <label htmlFor="photo-upload-modal" className="change-btn">
                                    {profile.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                                </label>
                                <button onClick={() => setPhotoModalOpen(false)} className="cancel-btn">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsumerProfile; 