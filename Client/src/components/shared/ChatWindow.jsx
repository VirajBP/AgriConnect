import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaPaperPlane } from 'react-icons/fa';
import { chatAPI } from '../../utils/chatAPI';
import { useAuth } from '../../Context/AuthContext';
import ProfileInfoModal from './ProfileInfoModal';
import {useTheme} from '../../Context/ThemeContext';

const ChatWindow = ({ chat, socket, isConnected }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const { isDarkMode } = useTheme();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuth();
  const currentUserId = user?._id;

  useEffect(() => {
    if (chat) {
      fetchMessages();
      joinChat();
    }

    return () => {
      if (socket && chat) {
        socket.emit('leave_chat', chat._id);
      }
    };
  }, [chat]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', handleReceiveMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stopped_typing', handleUserStoppedTyping);
      };
    }
  }, [socket, chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getMessages(chat._id);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChat = () => {
    if (socket && chat) {
      socket.emit('join_chat', chat._id);
    }
  };

  const handleReceiveMessage = (message) => {
    if (message.chatId === chat._id) {
      setMessages(prev => [...prev, message]);
      
      // Automatically mark as seen since chat is open
      if (message.sender.userId !== currentUserId && socket) {
        socket.emit('mark_seen', chat._id);
      }
    }
  };

  const handleUserTyping = ({ userId }) => {
    if (userId !== currentUserId) {
      setTyping(true);
    }
  };

  const handleUserStoppedTyping = ({ userId }) => {
    if (userId !== currentUserId) {
      setTyping(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !isConnected) return;

    socket.emit('send_message', {
      chatId: chat._id,
      content: newMessage.trim(),
    });

    setNewMessage('');
    
    // Stop typing indicator
    socket.emit('typing_stop', chat._id);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (socket && e.target.value.trim()) {
      socket.emit('typing_start', chat._id);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', chat._id);
      }, 1000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOtherParticipant = () => {
    if (!currentUserId || !chat?.participants) return null;
    return chat.participants.find(p => p.userId !== currentUserId);
  };

  const otherParticipant = getOtherParticipant();

  if (loading) {
    return (
      <div className="chat-window">
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="chat-window">
        <div className="loading">Please log in to use chat...</div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className={`${isDarkMode ? 'chat-header-dark' : 'chat-header'}`}>
        <div className="participant-info">
          <div className="participant-avatar">
            {otherParticipant?.profilePhoto ? (
              <img 
                src={otherParticipant.profilePhoto} 
                alt={otherParticipant.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <FaUser style={{ display: otherParticipant?.profilePhoto ? 'none' : 'flex' }} />
          </div>
          <div className="participant-details">
            <h3 
              onClick={() => setShowProfileModal(true)}
              style={{ cursor: 'pointer' }}
            >
              {otherParticipant?.name}
            </h3>
            <span className="participant-role">{otherParticipant?.role}</span>
          </div>
        </div>
        <div className="connection-status">
          {isConnected ? (
            <span className="status online">Online</span>
          ) : (
            <span className="status offline">Offline</span>
          )}
        </div>
      </div>

      <div className={`${isDarkMode ? "messages-container-dark" : "messages-container"}`}>
        <div className={`${isDarkMode ? "messages-list-dark" : "messages-list"}`}>
          {messages.map(message => (
            <div
              key={message._id}
              className={`message ${
                message.sender.userId === currentUserId ? 'sent' : 'received'
              }`}
            >
              <div className={`${isDarkMode ? "message-content-dark" : "message-content"}`}>
                <p>{message.content}</p>
                <span className="message-time">
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
            </div>
          ))}
          
          {typing && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="typing-text">{otherParticipant?.name} is typing...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className={`${isDarkMode ? "message-input-form-dark" : "message-input-form"}`} onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={!isConnected}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || !isConnected}
            className="send-button"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
      
      {showProfileModal && (
        <ProfileInfoModal 
          participant={otherParticipant}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

export default ChatWindow;