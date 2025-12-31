const express = require('express');
const router = express.Router();
const {
  getUserChats,
  createChat,
  getChatMessages,
  markMessagesAsSeen,
  getParticipantProfile,
} = require('../Controllers/chatController');
const auth = require('../Middleware/auth');

// All routes require authentication
router.use(auth);

// Get user's chats
router.get('/', getUserChats);

// Create or get chat
router.post('/', createChat);

// Get chat messages
router.get('/:chatId/messages', getChatMessages);

// Mark messages as seen
router.put('/:chatId/seen', markMessagesAsSeen);

// Get participant profile
router.get('/profile/:participantId/:role', getParticipantProfile);

module.exports = router;