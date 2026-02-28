const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false   // Optional: null for anonymous POS sales
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
    paymentMethod: {
        type: String,
        enum: ['cash', 'cash_on_pickup', 'mobile_money', 'card'],
        default: 'cash'
    },
    fulfillmentType: {
        type: String,
        enum: ['delivery', 'pickup', 'pos'],
        default: 'delivery'
    },
    // ----- POS (Point of Sale) fields -----
    orderType: {
        type: String,
        enum: ['online', 'pos'],
        default: 'online'
    },
    cashierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customerName: { type: String },         // For POS anonymous customers
    receiptNumber: { type: String },        // Sequential receipt number (e.g. "REC-001-20260301")
    subtotal: { type: Number },             // Sum before discount/tax
    discountAmount: { type: Number, default: 0 },  // Total discount in currency
    discountPercent: { type: Number, default: 0 },  // Discount percentage applied
    taxAmount: { type: Number, default: 0 },        // Tax/TVA amount
    taxRate: { type: Number, default: 0 },           // Tax rate (e.g. 20 for 20%)
    amountReceived: { type: Number },       // Amount tendered by customer (cash)
    changeGiven: { type: Number },          // Change returned to customer
    itemDiscounts: [{                       // Per-item discounts
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        discountAmount: { type: Number, default: 0 },
        discountPercent: { type: Number, default: 0 }
    }],
    // ----- End POS fields -----
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

// Indexes for performance
orderSchema.index({ orderType: 1, boutique: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });             // User's orders
orderSchema.index({ boutique: 1, status: 1, createdAt: -1 }); // Boutique orders by status
orderSchema.index({ status: 1 });                            // Filter by status

module.exports = mongoose.model('Order', orderSchema);
