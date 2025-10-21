const mongoose = require("mongoose");

const consumerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'Restaurant',
            'Supermarket',
            'Food Processing',
            'Healthcare',
            'Events',
            'NGO',
            'Hotel',
            'Catering',
            'Educational Institution',
            'Corporate Cafeteria'
        ]
    },
    address: {
        type: String,
        required: true
    },
    joinedDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Consumer', consumerSchema);