const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'boutique', 'acheteur'],
        default: 'acheteur'
    },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    addresses: [{
        label: { type: String, default: 'Adresse' },
        fullName: { type: String },
        phone: { type: String },
        street: { type: String, default: '' },
        landmark: { type: String, default: '' },
        city: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        country: { type: String, default: 'Madagascar' },
        latitude: { type: Number },
        longitude: { type: Number },
        isDefault: { type: Boolean, default: false }
    }]
}, { timestamps: true });

// Encrypt password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
