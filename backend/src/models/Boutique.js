const mongoose = require('mongoose');

const boutiqueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    logo: { type: String },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive', 'rejected'],
        default: 'pending'
    },
    contactEmail: { type: String },
    contactPhone: { type: String },
    categoryId: { type: String }
}, { timestamps: true });

// Indexes for performance
boutiqueSchema.index({ owner: 1 });
boutiqueSchema.index({ status: 1 });

module.exports = mongoose.model('Boutique', boutiqueSchema);
