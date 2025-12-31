const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  changePassword,
  updateEmail,
  softDeleteAccount,
  togglePreferredFarmer,
  blockUser,
} = require('../Controllers/settingsController');
const auth = require('../Middleware/auth');

router.use(auth);

router.get('/', getSettings);
router.put('/', updateSettings);
router.put('/password', changePassword);
router.put('/email', updateEmail);
router.put('/delete-account', softDeleteAccount);
router.put('/preferred-farmer', togglePreferredFarmer);
router.put('/block-user', blockUser);

module.exports = router;