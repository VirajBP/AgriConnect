import React, { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaLock, FaMapMarkerAlt, FaTractor, FaMoon, FaSun, FaEdit, FaCheck, FaTimes, FaEye, FaEyeSlash, FaGlobe, FaCity, FaCamera } from 'react-icons/fa';
import Sidebar from '../Sidebar/Sidebar';
import axios from '../../utils/axios';
import { CircularProgress } from '@mui/material';
import { useTheme } from '../../Context/ThemeContext';
import './FarmerProfile.css';

// Product Ratings Component
const ProductRatingsSection = ({ farmerId, isDarkMode }) => {
    const [productRatings, setProductRatings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProductRatings = async () => {
            if (!farmerId) return;
            try {
                const response = await axios.get(`/api/farmer/product-ratings`);
                if (response.data.success) {
                    setProductRatings(response.data.data);
                }
            } catch (error) {
                // console.error('Error fetching product ratings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductRatings();
    }, [farmerId]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '20px' }}><CircularProgress size={24} /></div>;
    }

    if (productRatings.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '20px', color: isDarkMode ? '#b0b0b0' : '#666' }}>
                No product ratings yet. Start selling to receive ratings!
            </div>
        );
    }

    return (
        <div className="product-ratings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {productRatings.map((rating) => (
                <div 
                    key={rating._id} 
                    className={`product-rating-card ${isDarkMode ? 'dark' : ''}`}
                    style={{
                        padding: '16px',
                        border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`,
                        borderRadius: '8px',
                        backgroundColor: isDarkMode ? '#2c2c2c' : '#f9f9f9'
                    }}
                >
                    <h4 style={{ margin: '0 0 8px 0', color: isDarkMode ? '#fff' : '#333' }}>
                        {rating.productName}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    style={{
                                        color: star <= Math.round(rating.rating.average) ? '#ffc107' : '#ddd',
                                        fontSize: '16px'
                                    }}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <span style={{ color: isDarkMode ? '#000000' : '#ffffff', fontSize: '14px' }}>
                            {rating.rating.average.toFixed(1)} ({rating.rating.count} reviews)
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const FarmerProfile = () => {
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState({});
    const [tempData, setTempData] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const { isDarkMode, toggleTheme } = useTheme();

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await axios.get('/api/farmer/profile');
                if (response.data.success) {
                    setProfile(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch profile data');
                }
            } catch (err) {
                // console.error('Error fetching profile data:', err);
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
                // console.error('Error fetching states:', error);
            }
        };

        fetchProfileData();
        fetchStates();
    }, []);

    const fetchCities = async (state) => {
        try {
            setLoadingCities(true);
            const response = await axios.get(`/api/auth/cities/${encodeURIComponent(state)}`);
            if (response.data.success) {
                setCities(response.data.data);
            }
        } catch (error) {
            // console.error('Error fetching cities:', error);
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
        phoneNumber: {
            label: 'Contact Number',
            type: 'tel',
            icon: <FaPhone />,
            validation: value => /^\+?[\d\s-]{10,}$/.test(value)
        },
        password: {
            label: 'Password',
            type: 'password',
            icon: <FaLock />,
            validation: value => value?.length >= 6
        },
        location: {
            label: 'Farm Location',
            type: 'text',
            icon: <FaMapMarkerAlt />,
            validation: value => value?.length >= 3
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
        }
    };

    const handleEdit = (field) => {
        setEditMode({ ...editMode, [field]: true });
        setTempData({ ...tempData, [field]: profile ? profile[field] : '' });
        
        // Load cities when editing state or city
        if (field === 'state' && profile?.state) {
            fetchCities(profile.state);
        }
        if (field === 'city' && profile?.state) {
            fetchCities(profile.state);
            setTempData(prev => ({ ...prev, state: profile.state, [field]: profile[field] || '' }));
        }
    };

    const handleCancel = (field) => {
        setEditMode({ ...editMode, [field]: false });
        setTempData({ ...tempData, [field]: '' });
    };

    const handleSave = async (field) => {
        if (editableFields[field].validation(tempData[field])) {
            try {
                const response = await axios.put('/api/farmer/profile', {
                    [field]: tempData[field]
                });
                if (response.data.success) {
                    // Update local state with saved data
                    setProfile({ ...profile, [field]: tempData[field] });
                    setEditMode({ ...editMode, [field]: false });
                    setTempData({ ...tempData, [field]: '' });
                    // Optionally show a success message
                    // console.log(response.data.message);
                } else {
                    // Handle save error
                    // console.error('Failed to save profile data:', response.data.message);
                    alert('Failed to save profile data');
                }
            } catch (error) {
                // console.error('Error saving profile data:', error);
                alert('Error saving profile data');
            }
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
                
                const response = await axios.post('/api/farmer/profile/upload-photo', {
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
            // console.error('Error uploading photo:', error);
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
        <div className="farmer-profile">
            <Sidebar 
                userType="farmer" 
                onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
            />
            <div className={`profile-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isDarkMode ? 'dark' : ''}`}>
                <div className="profile-header">
                    <div className="profile-cover">
                        <div className="profile-avatar" onClick={() => setPhotoModalOpen(true)} style={{ cursor: 'pointer' }}>
                            {profile?.profilePhoto ? (
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
                                <FaTractor />
                            )}
                        </div>
                    </div>
                    <div className="profile-info">
                        <h1 style={{ color: isDarkMode ? '#fff' : '#000' }}>{profile?.name || 'Loading...'}</h1>
                        <p className="profile-role" style={{ color: isDarkMode ? '#fff' : '#000' }}>Farmer</p>
                        {profile?.activeListings !== undefined && (
                            <p className="profile-products" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                                {profile.activeListings} Active Product Listings
                            </p>
                        )}
                        <p className="profile-join-date" style={{ color: isDarkMode ? '#fff' : '#000' }}>
                            Member since {profile?.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'N/A'}
                        </p>
                        {profile?.rating && profile.rating.count > 0 && (
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

                    <div className={`${isDarkMode ? 'profile-section-dark' : 'profile-section'}`}>
                        <div className={`section-header`}>
                            <h2>Personal Information</h2>
                        </div>
                        <div className={`profile-fields`}>
                            {Object.entries(editableFields).map(([field, config]) => (
                                <div key={field} className={`${isDarkMode ? 'profile-field-dark' : 'profile-field'}`}>
                                    <div className="field-header">
                                        <div className="field-icon">{config.icon}</div>
                                        <label>{config.label}</label>
                                    </div>
                                    {editMode[field] ? (
                                        <div className="field-edit">
                                            {config.type === 'select' ? (
                                                <select
                                                    value={tempData[field] || ''}
                                                    onChange={(e) => {
                                                        setTempData({
                                                            ...tempData,
                                                            [field]: e.target.value
                                                        });
                                                        if (field === 'state') {
                                                            fetchCities(e.target.value);
                                                            setTempData(prev => ({ ...prev, city: '' }));
                                                        }
                                                    }}
                                                    className="edit-input"
                                                    disabled={field === 'city' && (!tempData.state && !profile?.state) || loadingCities}
                                                >
                                                    <option value="">
                                                        {field === 'city' && loadingCities ? 'Loading cities...' : 
                                                         field === 'city' && (!tempData.state && !profile?.state) ? 'Select state first' : 
                                                         `Select ${config.label}`}
                                                    </option>
                                                    {field === 'state' && states.map(state => (
                                                        <option key={state} value={state}>{state}</option>
                                                    ))}
                                                    {field === 'city' && cities.map(city => (
                                                        <option key={city} value={city}>{city}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type={field === 'password' && !showPassword ? 'password' : config.type}
                                                    value={tempData[field] || ''}
                                                    onChange={(e) => setTempData({
                                                        ...tempData,
                                                        [field]: e.target.value
                                                    })}
                                                    className="edit-input"
                                                    placeholder={`Enter ${config.label.toLowerCase()}`}
                                                />
                                            )}
                                            {field === 'password' && (
                                                <button 
                                                    className="toggle-password"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            )}
                                            <div className="edit-actions">
                                                <button 
                                                    className="action-btn save"
                                                    onClick={() => handleSave(field)}
                                                    title="Save"
                                                >
                                                    <FaCheck />
                                                </button>
                                                <button 
                                                    className="action-btn cancel"
                                                    onClick={() => handleCancel(field)}
                                                    title="Cancel"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="field-display">
                                            <span>
                                                {profile?.[field] !== undefined && profile?.[field] !== null && profile?.[field] !== '' ? 
                                                 (field === 'password' ? '••••••••' : profile[field]) 
                                                 : 'Not set'}
                                            </span>
                                            <button 
                                                className="edit-btn"
                                                onClick={() => handleEdit(field)}
                                            >
                                                <FaEdit />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Ratings Section */}
                    <div className={`${isDarkMode ? 'profile-section-dark' : 'profile-section'}`}>
                        <div className="section-header">
                            <h2>Product Ratings</h2>
                        </div>
                        <ProductRatingsSection farmerId={profile?._id} isDarkMode={isDarkMode} />
                    </div>
                </div>
            </div>

            {/* Photo Modal */}
            {photoModalOpen && (
                <div className="photo-modal-overlay" onClick={() => setPhotoModalOpen(false)}>
                    <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Profile Photo</h3>
                        {profile?.profilePhoto && (
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
                                {profile?.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                            </label>
                            <button onClick={() => setPhotoModalOpen(false)} className="cancel-btn">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmerProfile; 