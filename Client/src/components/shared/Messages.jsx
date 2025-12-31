import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../../Context/SocketContext';
import { useAuth } from '../../Context/AuthContext';
import { useTheme } from '../../Context/ThemeContext';
import { chatAPI } from '../../utils/chatAPI';
import Sidebar from '../Sidebar/Sidebar';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import './Messages.css';

const Messages = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const selectedChatId = location.state?.selectedChatId;
  const userType = localStorage.getItem('userType');

  useEffect(() => {
    fetchChats();
  }, []);

  // Auto-select chat if navigated from external link
  useEffect(() => {
    if (selectedChatId && chats.length > 0) {
      const chat = chats.find(c => c._id === selectedChatId);
      if (chat) {
        handleChatSelect(chat);
      }
    }
  }, [selectedChatId, chats]);

  useEffect(() => {
    if (socket) {
      socket.on('chat_updated', handleChatUpdate);
      socket.on('receive_message', handleNewMessage);

      return () => {
        socket.off('chat_updated', handleChatUpdate);
        socket.off('receive_message', handleNewMessage);
      };
    }
  }, [socket]);

  const fetchChats = async () => {
    try {
      const response = await chatAPI.getChats();
      setChats(response.data.chats);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatUpdate = (update) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => 
        chat._id === update.chatId 
          ? { ...chat, lastMessage: update.lastMessage, updatedAt: update.updatedAt }
          : chat
      );
      return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  const handleNewMessage = (message) => {
    // Don't update unread count if it's from current user or chat is selected
    if (message.sender.userId === user?._id) {
      return;
    }
    
    if (selectedChat && message.chatId === selectedChat._id) {
      // Message will be handled by ChatWindow and auto-marked as seen
      return;
    }
    
    // Update unread count for other chats only
    setChats(prevChats => 
      prevChats.map(chat => 
        chat._id === message.chatId 
          ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 }
          : chat
      )
    );
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    
    if (chat.unreadCount > 0) {
      chatAPI.markAsSeen(chat._id);
      setChats(prevChats => 
        prevChats.map(c => 
          c._id === chat._id ? { ...c, unreadCount: 0 } : c
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="messages-container">
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className={`messages-page ${isDarkMode ? 'dark' : ''}`}>
      <Sidebar 
        userType={userType} 
        onToggle={setSidebarCollapsed}
      />
      <div className={`messages-main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className={`${isDarkMode ? "messages-container-dark" : "messages-container"}`}>
          <div className="messages-layout">
            <div className={`${isDarkMode ? 'chat-list-panel-dark' : 'chat-list-panel'}`}>
              <ChatList 
                chats={chats}
                selectedChat={selectedChat}
                onChatSelect={handleChatSelect}
              />
            </div>
            <div className="chat-window-panel">
              {selectedChat ? (
                <ChatWindow 
                  chat={selectedChat}
                  socket={socket}
                  isConnected={isConnected}
                />
              ) : (
                <div className={isDarkMode ? 'no-chat-selected-dark' : 'no-chat-selected'}>
                  <h3>Select a conversation to start messaging</h3>
                  <p>Choose from your existing conversations or start a new one from a product or order page.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;