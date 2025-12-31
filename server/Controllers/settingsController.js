const Farmer = require('../Model/Farmer');
const Consumer = require('../Model/Consumer');
const bcrypt = require('bcryptjs');

// Get user settings
const getSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.userType;
    
    const UserModel = role === 'farmer' ? Farmer : Consumer;
    const user = await UserModel.findById(userId)
      .select('settings preferredFarmers')
      .populate('preferredFarmers', 'name location profilePhoto');
    
    res.json({ 
      success: true, 
      settings: user.settings || {},
      preferredFarmers: user.preferredFarmers || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update settings
const updateSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.userType;
    const { settings } = req.body;
    
    const UserModel = role === 'farmer' ? Farmer : Consumer;
    await UserModel.findByIdAndUpdate(userId, { settings });
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.userType;
    const { currentPassword, newPassword } = req.body;
    
    const UserModel = role === 'farmer' ? Farmer : Consumer;
    const user = await UserModel.findById(userId);
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.findByIdAndUpdate(userId, { password: hashedPassword });
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle preferred farmer (consumers only)
const togglePreferredFarmer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { farmerId } = req.body;
    
    const consumer = await Consumer.findById(userId);
    const isPreferred = consumer.preferredFarmers.includes(farmerId);
    
    if (isPreferred) {
      consumer.preferredFarmers.pull(farmerId);
    } else {
      consumer.preferredFarmers.push(farmerId);
    }
    
    await consumer.save();
    
    res.json({ 
      success: true, 
      isPreferred: !isPreferred,
      message: isPreferred ? 'Farmer removed from preferences' : 'Farmer added to preferences'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Block user
const blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.userType;
    const { targetUserId } = req.body;
    
    const UserModel = role === 'farmer' ? Farmer : Consumer;
    const user = await UserModel.findById(userId);
    
    if (!user.settings.privacy.blockedUsers.includes(targetUserId)) {
      user.settings.privacy.blockedUsers.push(targetUserId);
      await user.save();
    }
    
    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update email
const updateEmail = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.userType;
    const { newEmail } = req.body;
    
    const UserModel = role === 'farmer' ? Farmer : Consumer;
    
    // Check if email already exists
    const existingUser = await UserModel.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    
    await UserModel.findByIdAndUpdate(userId, { email: newEmail });
    res.json({ success: true, message: 'Email updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete account
const softDeleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.userType;
    
    const UserModel = role === 'farmer' ? Farmer : Consumer;
    await UserModel.findByIdAndUpdate(userId, { 
      isDeleted: true,
      deletedAt: new Date()
    });
    
    res.json({ success: true, message: 'Account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  changePassword,
  updateEmail,
  softDeleteAccount,
  togglePreferredFarmer,
  blockUser,
};