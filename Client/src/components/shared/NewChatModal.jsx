import React, { useState, useEffect } from 'react';
import { FaUser, FaTimes, FaMapMarkerAlt, FaBox } from 'react-icons/fa';
import { chatAPI } from '../../utils/chatAPI';

const NewChatModal = ({ onClose, onChatCreated }) => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      const response = await chatAPI.getAvailableFarmers();
      setFarmers(response.data.farmers);
    } catch (error) {
      console.error('Failed to fetch farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (farmer) => {
    try {
      const response = await chatAPI.createChat(farmer._id, 'farmer');
      onChatCreated(response.data.chat);
      onClose();
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content new-chat-modal">
        <div className="modal-header">
          <h3>Start New Conversation</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search farmers by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <div className="loading">Loading farmers...</div>
          ) : (
            <div className="farmers-list">
              {filteredFarmers.length === 0 ? (
                <div className="no-farmers">
                  <p>No farmers found</p>
                </div>
              ) : (
                filteredFarmers.map(farmer => (
                  <div key={farmer._id} className="farmer-item">
                    <div className="farmer-avatar">
                      <FaUser />
                    </div>
                    
                    <div className="farmer-info">
                      <div className="farmer-name">{farmer.name}</div>
                      <div className="farmer-location">
                        <FaMapMarkerAlt />
                        {farmer.location}, {farmer.state}
                      </div>
                      <div className="farmer-products">
                        <FaBox />
                        {farmer.productCount} products available
                      </div>
                    </div>

                    <div className="farmer-actions">
                      {farmer.hasExistingChat ? (
                        <span className="existing-chat">Already chatting</span>
                      ) : (
                        <button
                          className="start-chat-btn"
                          onClick={() => handleStartChat(farmer)}
                        >
                          Start Chat
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;