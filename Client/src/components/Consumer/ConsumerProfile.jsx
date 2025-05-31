import React, { useState, useRef } from 'react';
import { 
    FaUser, 
    FaEnvelope, 
    FaPhone, 
    FaLock, 
    FaMapMarkerAlt, 
    FaBuilding, 
    FaEye, 
    FaEyeSlash,
    FaShoppingBag,
    FaCalendarAlt
} from 'react-icons/fa';
import Sidebar from '../Sidebar/Sidebar';
import { consumerData } from '../../mockData/consumerData';
import './ConsumerProfile.css';

const ConsumerProfile = () => {
    const [profile, setProfile] = useState(consumerData.profile);
    const [editMode, setEditMode] = useState({});
    const [tempData, setTempData] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [avatar, setAvatar] = useState(profile.avatar || null);
    const fileInputRef = useRef(null);

    const editableFields = {
        name: {
            label: 'Business Name',
            type: 'text',
            icon: <FaUser />,
            validation: value => value.length >= 2
        },
        email: {
            label: 'Business Email',
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
        password: {
            label: 'Password',
            type: 'password',
            icon: <FaLock />,
            validation: value => value.length >= 6
        },
        address: {
            label: 'Business Address',
            type: 'text',
            icon: <FaMapMarkerAlt />,
            validation: value => value.length >= 3
        }
    };

    const nonEditableFields = {
        businessType: {
            label: 'Business Type',
            icon: <FaBuilding />,
            value: profile.businessType || 'Restaurant' // Example business type
        }
    };

    const stats = [
        {
            icon: <FaShoppingBag />,
            label: 'Total Orders',
            value: '156'
        },
        {
            icon: <FaCalendarAlt />,
            label: 'Member Since',
            value: new Date(profile.joinedDate).toLocaleDateString()
        }
    ];

    const handleEdit = (field) => {
        setEditMode({ ...editMode, [field]: true });
        setTempData({ ...tempData, [field]: profile[field] });
    };

    const handleCancel = (field) => {
        setEditMode({ ...editMode, [field]: false });
        setTempData({ ...tempData, [field]: profile[field] });
    };

    const handleSave = async (field) => {
        if (!editableFields[field].validation(tempData[field])) {
            alert('Invalid input');
            return;
        }

        try {
            // API call would go here
            setProfile({ ...profile, [field]: tempData[field] });
            setEditMode({ ...editMode, [field]: false });
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
                // Here you would typically upload to server
                setProfile({ ...profile, avatar: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="profile-container">
            <Sidebar userType="consumer" />
            <div className="profile-content">
                <div className="profile-wrapper">
                    <div className="profile-header-card">
                        <div className="profile-cover-photo"></div>
                        <div className="profile-header-content">
                            <div 
                                className="profile-avatar" 
                                onClick={handleAvatarClick}
                                style={{
                                    backgroundImage: avatar ? `url(${avatar})` : 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {!avatar && profile.name.charAt(0)}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                                <div className="avatar-overlay">
                                    <FaUser />
                                    <span>Change Photo</span>
                                </div>
                            </div>
                            <div className="profile-header-info">
                                <h1>{profile.name}</h1>
                                <div className="business-type-badge">
                                    {nonEditableFields.businessType.value}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="profile-stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-card">
                                <div className="stat-icon">{stat.icon}</div>
                                <div className="stat-details">
                                    <span className="stat-value">{stat.value}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="profile-details-card">
                        <h2>Business Information</h2>
                        <div className="profile-fields">
                            {/* Non-editable fields */}
                            {Object.entries(nonEditableFields).map(([field, config]) => (
                                <div key={field} className="field-group">
                                    <div className="field-icon">{config.icon}</div>
                                    <div className="field-content">
                                        <label>{config.label}</label>
                                        <div className="field-value">
                                            <span>{config.value}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Editable fields */}
                            {Object.entries(editableFields).map(([field, config]) => (
                                <div key={field} className="field-group">
                                    <div className="field-icon">{config.icon}</div>
                                    <div className="field-content">
                                        <label>{config.label}</label>
                                        {editMode[field] ? (
                                            <div className="edit-field">
                                                <div className="input-wrapper">
                                                    <input
                                                        type={field === 'password' && !showPassword ? 'password' : config.type}
                                                        value={tempData[field] || ''}
                                                        onChange={(e) => setTempData({
                                                            ...tempData,
                                                            [field]: e.target.value
                                                        })}
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
                                                </div>
                                                <div className="edit-actions">
                                                    <button 
                                                        className="save-btn"
                                                        onClick={() => handleSave(field)}
                                                    >
                                                        Save
                                                    </button>
                                                    <button 
                                                        className="cancel-btn"
                                                        onClick={() => handleCancel(field)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="field-value">
                                                <span>
                                                    {field === 'password' ? '••••••••' : profile[field]}
                                                </span>
                                                <button 
                                                    className="edit-btn"
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
        </div>
    );
};

export default ConsumerProfile; 