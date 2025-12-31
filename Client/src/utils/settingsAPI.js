import axios from './axios';

export const settingsAPI = {
  getSettings: () => axios.get('/api/settings'),
  updateSettings: (settings) => axios.put('/api/settings', { settings }),
  changePassword: (currentPassword, newPassword) => 
    axios.put('/api/settings/password', { currentPassword, newPassword }),
  updateEmail: (newEmail) => 
    axios.put('/api/settings/email', { newEmail }),
  softDeleteAccount: () => 
    axios.put('/api/settings/delete-account'),
  togglePreferredFarmer: (farmerId) => 
    axios.put('/api/settings/preferred-farmer', { farmerId }),
  blockUser: (targetUserId) => 
    axios.put('/api/settings/block-user', { targetUserId }),
};