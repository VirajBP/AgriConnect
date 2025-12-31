const Chat = require('../Model/Chat');
const Message = require('../Model/Message');
const Farmer = require('../Model/Farmer');
const Consumer = require('../Model/Consumer');
const Product = require('../Model/Product');

// Get user chats
const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.userType;

    const chats = await Chat.find({
      'participants.userId': userId,
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Populate profile photos for participants
    const chatsWithPhotos = await Promise.all(
      chats.map(async chat => {
        const updatedParticipants = await Promise.all(
          chat.participants.map(async participant => {
            const UserModel = participant.role === 'farmer' ? Farmer : Consumer;
            const user = await UserModel.findById(participant.userId).select('profilePhoto');
            return {
              ...participant,
              profilePhoto: user?.profilePhoto || null,
            };
          })
        );

        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          'sender.userId': { $ne: userId },
          'seenBy.userId': { $ne: userId },
        });

        return {
          ...chat,
          participants: updatedParticipants,
          unreadCount,
        };
      })
    );

    res.json({ success: true, chats: chatsWithPhotos });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create or get existing chat
const createChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.userType;
    const { participantId, participantRole, context } = req.body;

    // Validate chat permissions
    if (role === participantRole) {
      return res.status(400).json({
        success: false,
        message: 'Cannot chat with same role type',
      });
    }

    // Get participant details with profile photo
    const ParticipantModel = participantRole === 'farmer' ? Farmer : Consumer;
    const participant = await ParticipantModel.findById(participantId).select('name profilePhoto');
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
    }

    // Get current user details with profile photo
    const UserModel = role === 'farmer' ? Farmer : Consumer;
    const currentUser = await UserModel.findById(userId).select('name profilePhoto');

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
            profilePhoto: currentUser.profilePhoto,
          },
          {
            userId: participantId,
            role: participantRole,
            name: participant.name,
            profilePhoto: participant.profilePhoto,
          },
        ],
        context,
      });
      await chat.save();
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get chat messages
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    console.log('Fetching messages for chat:', chatId, 'user:', userId);

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

    console.log('Found messages:', messages.length);
    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark messages as seen
const markMessagesAsSeen = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

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

// Get participant profile info
const getParticipantProfile = async (req, res) => {
  try {
    const { participantId, role } = req.params;
    
    const UserModel = role === 'farmer' ? Farmer : Consumer;
    const user = await UserModel.findById(participantId).select(
      'name profilePhoto location state city phoneNumber email'
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({ 
      success: true, 
      profile: {
        ...user.toObject(),
        role,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserChats,
  createChat,
  getChatMessages,
  markMessagesAsSeen,
  getParticipantProfile,
};