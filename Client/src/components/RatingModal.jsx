import React, { useState } from 'react';
import axios from 'axios';
import './RatingModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RatingModal = ({ isOpen, onClose, order, userType, onRatingSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setLoading(true);
        try {
            const endpoint = userType === 'consumer' 
                ? `${API_URL}/consumer/orders/${order._id}/rate`
                : `${API_URL}/farmer/orders/${order._id}/rate`;

            await axios.post(endpoint, {
                value: rating,
                comment: comment.trim()
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            onRatingSubmitted();
            onClose();
            setRating(0);
            setComment('');
        } catch (error) {
            console.error('Error submitting rating:', error);
            alert(error.response?.data?.message || 'Failed to submit rating');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const targetUser = userType === 'consumer' ? 'farmer' : 'consumer';

    return (
        <div className="rating-modal-overlay">
            <div className="rating-modal">
                <div className="rating-modal-header">
                    <h3>Rate {targetUser === 'farmer' ? 'Farmer' : 'Consumer'}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <div className="rating-modal-body">
                    <div className="order-info">
                        <p><strong>Order:</strong> {order.product?.productName || order.productName}</p>
                        <p><strong>{targetUser === 'farmer' ? 'Farmer' : 'Customer'}:</strong> {order.farmer?.name || order.customer}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="rating-section">
                            <label>Rating:</label>
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`star ${rating >= star ? 'filled' : ''}`}
                                        onClick={() => setRating(star)}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="comment-section">
                            <label>Comment (optional):</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience..."
                                rows="3"
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" disabled={loading || rating === 0}>
                                {loading ? 'Submitting...' : 'Submit Rating'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;