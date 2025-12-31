const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    sender: {
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
    content: {
      type: String,
      required: true,
      trim: true,
    },
    seenBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        seenAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Index for efficient queries
messageSchema.index({ chatId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);