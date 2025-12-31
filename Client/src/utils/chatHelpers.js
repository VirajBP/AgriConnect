import { chatAPI } from './chatAPI';

export const initiateChatFromProduct = async (productId, farmerId, farmerName, navigate) => {
  try {
    const response = await chatAPI.createChat(
      farmerId,
      'farmer',
      {
        type: 'product',
        referenceId: productId,
      }
    );
    
    const userType = localStorage.getItem('userType');
    navigate(`/${userType}/messages`, { 
      state: { selectedChatId: response.data.chat._id } 
    });
    
    return response.data.chat;
  } catch (error) {
    console.error('Failed to create chat:', error);
    throw error;
  }
};

export const initiateChatFromOrder = async (orderId, participantId, participantRole, navigate) => {
  try {
    const response = await chatAPI.createChat(
      participantId,
      participantRole,
      {
        type: 'order',
        referenceId: orderId,
      }
    );
    
    const userType = localStorage.getItem('userType');
    navigate(`/${userType}/messages`, { 
      state: { selectedChatId: response.data.chat._id } 
    });
    
    return response.data.chat;
  } catch (error) {
    console.error('Failed to create chat:', error);
    throw error;
  }
};