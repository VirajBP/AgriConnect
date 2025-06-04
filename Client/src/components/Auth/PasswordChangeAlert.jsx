import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PasswordChangeAlert.css';

const PasswordChangeAlert = ({ onClose }) => {
    const navigate = useNavigate();
    const userType = localStorage.getItem('userType');

    const handleGoToProfile = () => {
        navigate(`/${userType}/profile`);
        onClose();
    };

    return (
        <div className="password-alert-overlay">
            <div className="password-alert-content">
                <h3>Password Reset Completed</h3>
                <p>For security reasons, we recommend changing your password in your profile settings.</p>
                <div className="password-alert-actions">
                    <button 
                        className="btn-primary"
                        onClick={handleGoToProfile}
                    >
                        Go to Profile
                    </button>
                    <button 
                        className="btn-secondary"
                        onClick={onClose}
                    >
                        Remind Me Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordChangeAlert; 