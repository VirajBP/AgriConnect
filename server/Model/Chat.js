const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        role: {
          type: String,
          enum: ['farmer', 'consumer'],
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
      },
    ],
    lastMessage: {
      content: String,
      senderId: mongoose.Schema.Types.ObjectId,
      timestamp: Date,
    },
    context: {
      type: {
        type: String,
        enum: ['product', 'order', 'general'],
        default: 'general',
      },
      referenceId: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);