import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaKey, FaEnvelope, FaTimes, FaPhone } from 'react-icons/fa';
import { useAuth } from '../../Context/AuthContext';
import { useTheme } from '../../Context/ThemeContext';
import { settingsAPI } from '../../utils/settingsAPI';
import axios from '../../utils/axios';
import Sidebar from '../Sidebar/Sidebar';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [preferredFarmers, setPreferredFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [newEmail, setNewEmail] = useState('');
  
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const userType = localStorage.getItem('userType');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      setSettings(response.data.settings);
      setPreferredFarmers(response.data.preferredFarmers || []);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await settingsAPI.updateSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleThemeChange = (theme) => {
    const currentTheme = isDarkMode ? 'dark' : 'light';
    if (currentTheme !== theme) {
      const updatedSettings = { ...settings, theme };
      updateSettings(updatedSettings);
      toggleTheme();
    }
  };

  const handleNotificationToggle = (type) => {
    const updatedSettings = {
      ...settings,
      emailNotifications: {
        ...settings.emailNotifications,
        [type]: !settings.emailNotifications?.[type],
      },
    };
    updateSettings(updatedSettings);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      const response = await settingsAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (response.data.success) {
        alert('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordModal(false);
      } else {
        alert(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      alert(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (userType === 'consumer') {
        // Use consumer-specific endpoint
        response = await axios.put('/api/consumer/profile/update-email', { email: newEmail });
      } else {
        // Use settings endpoint for farmers
        response = await settingsAPI.updateEmail(newEmail);
      }
      
      if (response.data.success) {
        alert('Email updated successfully');
        setNewEmail('');
        setShowEmailModal(false);
      } else {
        alert(response.data.message || 'Failed to update email');
      }
    } catch (error) {
      console.error('Email update error:', error);
      alert(error.response?.data?.message || 'Failed to update email');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
      try {
        await settingsAPI.softDeleteAccount();
        alert('Account deactivated successfully');
        logout();
      } catch (error) {
        alert('Failed to deactivate account');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className={`settings-page ${isDarkMode ? 'dark' : ''}`}>
      <Sidebar userType={userType} onToggle={setSidebarCollapsed} />
      <div className={`settings-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="settings-container">
          <div className="settings-header">
            <h1>Settings</h1>
            <p>Manage your account preferences and security</p>
          </div>

          {/* Account Settings */}
          <div className="settings-card">
            <div className="card-header">
              <h2>Account Settings</h2>
              <p>Manage your account security and information</p>
            </div>
            <div className="settings-options">
              <div className="setting-item" onClick={() => setShowPasswordModal(true)}>
                <div className="setting-info">
                  <FaKey className="setting-icon" />
                  <div>
                    <h3>Change Password</h3>
                    <p>Update your account password</p>
                  </div>
                </div>
                <FaEdit className="action-icon" />
              </div>
              
              <div className="setting-item" onClick={() => setShowEmailModal(true)}>
                <div className="setting-info">
                  <FaEnvelope className="setting-icon" />
                  <div>
                    <h3>Update Email</h3>
                    <p>Current: {user?.email}</p>
                  </div>
                </div>
                <FaEdit className="action-icon" />
              </div>
              
              <div className="setting-item danger" onClick={handleDeleteAccount}>
                <div className="setting-info">
                  <FaTrash className="setting-icon" />
                  <div>
                    <h3>Deactivate Account</h3>
                    <p>Permanently deactivate your account</p>
                  </div>
                </div>
                <FaTrash className="action-icon" />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="settings-card">
            <div className="card-header">
              <h2>Appearance</h2>
              <p>Customize your visual experience</p>
            </div>
            <div className="theme-selector">
              {['light', 'dark'].map(theme => {
                const currentTheme = isDarkMode ? 'dark' : 'light';
                const isActive = currentTheme === theme;
                return (
                  <label key={theme} className={`theme-card ${isActive ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      value={theme}
                      checked={isActive}
                      onChange={() => handleThemeChange(theme)}
                    />
                    <span className="theme-name">{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Email Notifications */}
          <div className="settings-card">
            <div className="card-header">
              <h2>Email Notifications</h2>
              <p>Choose what notifications you want to receive</p>
            </div>
            <div className="notification-list">
              <div className="notification-item">
                <div className="notification-info">
                  <h3>Order Confirmed</h3>
                  <p>Get notified when your order is confirmed</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications?.orderConfirmed ?? true}
                    onChange={() => handleNotificationToggle('orderConfirmed')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="notification-item">
                <div className="notification-info">
                  <h3>Order Completed</h3>
                  <p>Get notified when your order is completed</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications?.orderCompleted ?? true}
                    onChange={() => handleNotificationToggle('orderCompleted')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy & Safety */}
          <div className="settings-card">
            <div className="card-header">
              <h2>Privacy & Safety</h2>
              <p>Control who can interact with you</p>
            </div>
            <div className="privacy-setting">
              <label>Who can message me:</label>
              <select
                value={settings.privacy?.whoCanMessage || 'anyone'}
                onChange={(e) => updateSettings({
                  ...settings,
                  privacy: { ...settings.privacy, whoCanMessage: e.target.value }
                })}
                className="privacy-select"
              >
                <option value="anyone">Anyone</option>
                <option value="orders-only">Only users with an order</option>
              </select>
            </div>
          </div>

          {/* Contact Section */}
          <div className="settings-card">
            <div className="card-header">
              <h2>Contact Us</h2>
              <p>Get in touch with our support team</p>
            </div>
            <div className="contact-info">
              <div className="contact-item">
                <FaPhone className="contact-icon" />
                <div className="contact-details">
                  <h3>Phone</h3>
                  <p>9819289735</p>
                </div>
              </div>
              <div className="contact-item">
                <FaEnvelope className="contact-icon" />
                <div className="contact-details">
                  <h3>Email</h3>
                  <a href="mailto:viraj.pradhan04@gmail.com">viraj.pradhan04@gmail.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="modal-form">
              <input
                type="password"
                placeholder="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Email</h3>
              <button className="close-btn" onClick={() => setShowEmailModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEmailUpdate} className="modal-form">
              <input
                type="email"
                placeholder="New Email Address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEmailModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;