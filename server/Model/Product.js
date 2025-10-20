const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Others']
    },
    variety: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); 