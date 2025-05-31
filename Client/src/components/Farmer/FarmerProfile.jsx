import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaEyeSlash, FaUser, FaPhone, FaLock, FaMapMarkerAlt, FaTractor } from 'react-icons/fa';
import Sidebar from '../Sidebar/Sidebar';
import axios from '../../utils/axios'; // Import the configured axios instance
import { Typography, Box, CircularProgress } from '@mui/material';
import './FarmerProfile.css';

const FarmerProfile = () => {
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState({});
    const [tempData, setTempData] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await axios.get('/farmer/profile');
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
        }
    };

    const handleEdit = (field) => {
        setEditMode({ ...editMode, [field]: true });
        setTempData({ ...tempData, [field]: profile ? profile[field] : '' });
    };

    const handleCancel = (field) => {
        setEditMode({ ...editMode, [field]: false });
        setTempData({ ...tempData, [field]: '' });
    };

    const handleSave = (field) => {
        if (editableFields[field].validation(tempData[field])) {
            // TODO: Implement backend save for profile
            setProfile({ ...profile, [field]: tempData[field] });
            setEditMode({ ...editMode, [field]: false });
            setTempData({ ...tempData, [field]: '' });
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
         return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Typography color="error" variant="h6">
                    {error}
                </Typography>
            </Box>
        );
    }


    return (
        <div className="profile-container">
            <Sidebar 
                userType="farmer" 
                onToggle={(collapsed) => setIsSidebarCollapsed(collapsed)}
            />
            <div className={`profile-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <div className="profile-wrapper">
                    <div className="profile-header-card">
                        <div className="profile-cover">
                        <div className="profile-avatar">
                            <FaTractor />
                        </div>
                        </div>
                        <div className="profile-info">
                            <h2>{profile?.name || 'No Name Available'}</h2>
                            <p className="member-since">Member since {profile?.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'No Join Date Available'}</p>
                        </div>
                    </div>

                    <div className="profile-details-card">
                        <h3>Personal Information</h3>
                        {Object.entries(editableFields).map(([field, config]) => (
                            <div key={field} className="detail-item">
                                <div className="detail-icon">{config.icon}</div>
                                <div className="detail-content">
                                    <label>{config.label}</label>
                                    {editMode[field] ? (
                                        <div className="edit-controls">
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
                                            {field === 'password' && (
                                                <button 
                                                    className="toggle-password"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            )}
                                            <div className="action-buttons">
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
                                        <div className="display-value">
                                            <span>
                                                {profile?.[field] !== undefined && profile?.[field] !== null && profile?.[field] !== '' ? 
                                                 (field === 'password' ? '••••••••' : profile[field]) 
                                                 : 'No info available'}
                                            </span>
                                            <button 
                                                className="edit-button"
                                                onClick={() => handleEdit(field)}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmerProfile; 