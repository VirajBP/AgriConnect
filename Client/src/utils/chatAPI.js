import axios from './axios';

export const chatAPI = {
  // Get user's chats
  getChats: () => axios.get('/api/chat'),

  // Create or get existing chat
  createChat: (participantId, participantRole, context = null) =>
    axios.post('/api/chat', {
      participantId,
      participantRole,
      context,
    }),

  // Get chat messages
  getMessages: (chatId, page = 1, limit = 50) =>
    axios.get(`/api/chat/${chatId}/messages?page=${page}&limit=${limit}`),

  // Mark messages as seen
  markAsSeen: (chatId) => axios.put(`/api/chat/${chatId}/seen`),
};