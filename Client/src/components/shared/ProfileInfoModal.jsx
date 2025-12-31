import React from 'react';
import { FaUser, FaTimes, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

const ProfileInfoModal = ({ participant, onClose }) => {
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoModal;