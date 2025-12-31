const Chat = require('../Model/Chat');
const Message = require('../Model/Message');
const Farmer = require('../Model/Farmer');
const Consumer = require('../Model/Consumer');

// Get user chats
const getUserChats = async (req, res) => {
  try {
    const { userId, role } = req.user;

    const chats = await Chat.find({
      'participants.userId': userId,
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Add unread count for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async chat => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          'sender.userId': { $ne: userId },
          'seenBy.userId': { $ne: userId },
        });

        return {
          ...chat,
          unreadCount,
        };
      })
    );

    res.json({ success: true, chats: chatsWithUnread });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create or get existing chat
const createChat = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { participantId, participantRole, context } = req.body;

    // Validate chat permissions
    if (role === participantRole) {
      return res.status(400).json({
        success: false,
        message: 'Cannot chat with same role type',
      });
    }

    // Get participant details
    const ParticipantModel = participantRole === 'farmer' ? Farmer : Consumer;
    const participant = await ParticipantModel.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
    }

    // Get current user details
    const UserModel = role === 'farmer' ? Farmer : Consumer;
    const currentUser = await UserModel.findById(userId);

    // Check if chat already exists
    let chat = await Chat.findOne({
      $and: [
        { 'participants.userId': userId },
        { 'participants.userId': participantId },
      ],
    });

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [
          {
            userId,
            role,
            name: currentUser.name,
          },
          {
            userId: participantId,
            role: participantRole,
            name: participant.name,
          },
        ],
        context,
      });
      await chat.save();
    }

    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get chat messages
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.user;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      'participants.userId': userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark messages as seen
const markMessagesAsSeen = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.user;

    await Message.updateMany(
      {
        chatId,
        'sender.userId': { $ne: userId },
        'seenBy.userId': { $ne: userId },
      },
      {
        $push: {
          seenBy: {
            userId,
            seenAt: new Date(),
          },
        },
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserChats,
  createChat,
  getChatMessages,
  markMessagesAsSeen,
};