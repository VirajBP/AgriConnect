const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productVariety: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    estimatedDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); 