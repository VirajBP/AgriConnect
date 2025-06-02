import React, { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaLock, FaMapMarkerAlt, FaShoppingBag, FaMoon, FaSun, FaEdit, FaCheck, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import Sidebar from '../Sidebar/Sidebar';
import axios from '../../utils/axios';
import { CircularProgress } from '@mui/material';
import { useTheme } from '../../Context/ThemeContext';
import './ConsumerProfile.css';

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
                const response = await axios.get('/consumer/profile');
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
        address: {
            label: 'Delivery Address',
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

    const handleSave = async (field) => {
        if (editableFields[field].validation(tempData[field])) {
            try {
                const response = await axios.put('/consumer/profile', {
                    [field]: tempData[field]
                });
                if (response.data.success) {
                    setProfile({ ...profile, [field]: tempData[field] });
                    setEditMode({ ...editMode, [field]: false });
                    setTempData({ ...tempData, [field]: '' });
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile');
            }
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
            <div className={`profile-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <div className="profile-header">
                    <div className="profile-cover">
                        <div className="profile-avatar">
                            <FaShoppingBag />
                        </div>
                    </div>
                    <div className="profile-info">
                        <h1>{profile?.name || 'Loading...'}</h1>
                        <p className="profile-role">Consumer</p>
                        <p className="profile-join-date">
                            Member since {profile?.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="profile-main">
                    <div className="profile-section">
                        <div className="section-header">
                            <h2>Personal Information</h2>
                        </div>
                        <div className="profile-fields">
                            {Object.entries(editableFields).map(([field, config]) => (
                                <div key={field} className="profile-field">
                                    <div className="field-header">
                                        <div className="field-icon">{config.icon}</div>
                                        <label>{config.label}</label>
                                    </div>
                                    {editMode[field] ? (
                                        <div className="field-edit">
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
                </div>
            </div>
        </div>
    );
};

export default ConsumerProfile; 