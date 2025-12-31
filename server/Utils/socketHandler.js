const jwt = require('jsonwebtoken');
const Chat = require('../Model/Chat');
const Message = require('../Model/Message');

const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.user.id;
    socket.role = decoded.user.type;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Join chat room
    socket.on('join_chat', async (chatId) => {
      try {
        // Verify user is participant
        const chat = await Chat.findOne({
          _id: chatId,
          'participants.userId': socket.userId,
        });

        if (chat) {
          socket.join(`chat_${chatId}`);
          socket.currentChatId = chatId;
          console.log(`User ${socket.userId} joined chat ${chatId}`);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content } = data;

        // Verify user is participant
        const chat = await Chat.findOne({
          _id: chatId,
          'participants.userId': socket.userId,
        });

        if (!chat) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Get sender info from participants
        const sender = chat.participants.find(
          p => p.userId.toString() === socket.userId.toString()
        );

        // Create message
        const message = new Message({
          chatId,
          sender: {
            userId: socket.userId,
            role: socket.role,
            name: sender.name,
          },
          content,
          seenBy: [{ userId: socket.userId }],
        });

        await message.save();

        // Update chat's last message
        chat.lastMessage = {
          content,
          senderId: socket.userId,
          timestamp: message.createdAt,
        };
        chat.updatedAt = new Date();
        await chat.save();

        // Emit to all participants in the chat
        io.to(`chat_${chatId}`).emit('receive_message', {
          _id: message._id,
          chatId,
          sender: message.sender,
          content,
          createdAt: message.createdAt,
          seenBy: message.seenBy,
        });

        // Emit chat update only to other participants (not sender)
        chat.participants.forEach(participant => {
          if (participant.userId.toString() !== socket.userId.toString()) {
            io.to(`user_${participant.userId}`).emit('chat_updated', {
              chatId,
              lastMessage: chat.lastMessage,
              updatedAt: chat.updatedAt,
            });
          }
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as seen
    socket.on('mark_seen', async (chatId) => {
      try {
        await Message.updateMany(
          {
            chatId,
            'sender.userId': { $ne: socket.userId },
            'seenBy.userId': { $ne: socket.userId },
          },
          {
            $push: {
              seenBy: {
                userId: socket.userId,
                seenAt: new Date(),
              },
            },
          }
        );

        // Notify other participants
        socket.to(`chat_${chatId}`).emit('messages_seen', {
          userId: socket.userId,
          chatId,
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to mark as seen' });
      }
    });

    // Leave chat room
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      socket.currentChatId = null;
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Typing indicator
    socket.on('typing_start', (chatId) => {
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId,
      });
    });

    socket.on('typing_stop', (chatId) => {
      socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        chatId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
};

module.exports = { handleConnection };