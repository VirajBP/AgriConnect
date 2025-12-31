import { chatAPI } from './chatAPI';

export const initiateChatFromProduct = async (productId, farmerId, farmerName) => {
  try {
    const response = await chatAPI.createChat(
      farmerId,
      'farmer',
      {
        type: 'product',
        referenceId: productId,
      }
    );
    
    return response.data.chat;
  } catch (error) {
    console.error('Failed to create chat:', error);
    throw error;
  }
};

export const initiateChatFromOrder = async (orderId, participantId, participantRole) => {
  try {
    const response = await chatAPI.createChat(
      participantId,
      participantRole,
      {
        type: 'order',
        referenceId: orderId,
      }
    );
    
    return response.data.chat;
  } catch (error) {
    console.error('Failed to create chat:', error);
    throw error;
  }
};

export const navigateToChat = (navigate, chatId) => {
  const userType = localStorage.getItem('userType');
  navigate(`/${userType}/messages`, { state: { selectedChatId: chatId } });
};