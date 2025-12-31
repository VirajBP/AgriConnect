import React, { useState, useEffect } from 'react';
import { FaUser, FaTimes, FaMapMarkerAlt, FaPhone, FaEnvelope, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { settingsAPI } from '../../utils/settingsAPI';

const ProfileInfoModal = ({ participant, onClose }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const userType = localStorage.getItem('userType');
  
  useEffect(() => {
    if (userType === 'consumer' && participant?.role === 'Farmer') {
      checkBookmarkStatus();
    }
  }, [participant, userType]);
  
  const checkBookmarkStatus = async () => {
    try {
      const response = await settingsAPI.getSettings();
      const preferredFarmers = response.data.preferredFarmers || [];
      setIsBookmarked(preferredFarmers.includes(participant.userId));
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };
  
  const handleBookmarkToggle = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await settingsAPI.togglePreferredFarmer(participant.userId);
      if (response.data.success) {
        setIsBookmarked(response.data.isPreferred);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };
  
  if (!participant) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Profile Info</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="profile-info-content">
            <div className="profile-avatar-large">
              {participant.profilePhoto ? (
                <img 
                  src={participant.profilePhoto} 
                  alt={participant.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <FaUser style={{ display: participant.profilePhoto ? 'none' : 'flex' }} />
            </div>
            
            <div className="profile-details">
              <h2>{participant.name}</h2>
              <p className="profile-role">{participant.role}</p>
              
              {participant.location && (
                <div className="profile-info-item">
                  <FaMapMarkerAlt />
                  <span>{participant.location}</span>
                </div>
              )}
              
              {participant.phoneNumber && (
                <div className="profile-info-item">
                  <FaPhone />
                  <span>{participant.phoneNumber}</span>
                </div>
              )}
              
              {participant.email && (
                <div className="profile-info-item">
                  <FaEnvelope />
                  <span>{participant.email}</span>
                </div>
              )}
              
              {userType === 'consumer' && participant.role === 'Farmer' && (
                <div className="bookmark-section">
                  <button 
                    className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                    onClick={handleBookmarkToggle}
                    disabled={loading}
                  >
                    {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
                    {loading ? 'Updating...' : (isBookmarked ? 'Bookmarked' : 'Bookmark Farmer')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoModal;