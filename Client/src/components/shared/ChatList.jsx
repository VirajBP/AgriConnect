import React from 'react';
import { FaUser } from 'react-icons/fa';

const ChatList = ({ chats, selectedChat, onChatSelect }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (chat) => {
    const currentUserId = localStorage.getItem('userId');
    return chat.participants.find(p => p.userId !== currentUserId);
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Messages</h2>
      </div>
      
      <div className="chat-list-content">
        {chats.length === 0 ? (
          <div className="no-chats">
            <p>No conversations yet</p>
            <small>Start a conversation from a product or order page</small>
          </div>
        ) : (
          chats.map(chat => {
            const otherParticipant = getOtherParticipant(chat);
            const isSelected = selectedChat?._id === chat._id;
            
            return (
              <div
                key={chat._id}
                className={`chat-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onChatSelect(chat)}
              >
                <div className="chat-avatar">
                  <FaUser />
                </div>
                
                <div className="chat-info">
                  <div className="chat-header">
                    <span className="chat-name">{otherParticipant?.name}</span>
                    <span className="chat-role">({otherParticipant?.role})</span>
                    {chat.lastMessage && (
                      <span className="chat-time">
                        {formatTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  
                  <div className="chat-preview">
                    {chat.lastMessage ? (
                      <span className="last-message">
                        {chat.lastMessage.content}
                      </span>
                    ) : (
                      <span className="no-messages">No messages yet</span>
                    )}
                    
                    {chat.unreadCount > 0 && (
                      <span className="unread-badge">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;