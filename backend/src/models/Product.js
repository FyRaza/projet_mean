const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    shortDescription: { type: String },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    stock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    images: [{ type: String }],
    category: { type: String },
    boutique: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Boutique',
        required: true
    },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    sku: { type: String },
    status: {
        type: String,
        enum: ['active', 'draft', 'archived', 'out_of_stock'],
        default: 'active'
    }
}, { timestamps: true });

// Indexes for performance
productSchema.index({ boutique: 1, status: 1, createdAt: -1 });
productSchema.index({ name: 'text', sku: 'text' }); // Text search for POS

module.exports = mongoose.model('Product', productSchema);
