const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        name: String
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    fulfillmentType: {
        type: String,
        enum: ['delivery', 'pickup'],
        default: 'delivery'
    },
    boutique: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Boutique',
        required: true
    },
    shippingAddress: {
        street: String,
        landmark: String,
        city: String,
        postalCode: String,
        country: String,
        latitude: Number,
        longitude: Number
    },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
