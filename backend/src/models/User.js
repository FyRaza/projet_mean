const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optionnel si authentification Google
    googleId: { type: String, unique: true, sparse: true }, // ID Google OAuth
    authProvider: { 
        type: String, 
        enum: ['local', 'google'], 
        default: 'local' 
    }, // Méthode d'authentification
    role: {
        type: String,
        enum: ['admin', 'boutique', 'acheteur'],
        default: 'acheteur'
    },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
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

// Encrypt password before save (seulement si password fourni et modifié)
userSchema.pre('save', async function (next) {
    // Si pas de password (authentification Google) ou password non modifié, skip
    if (!this.password || !this.isModified('password')) {
        return next();
    }
    // Valider que password est requis pour authentification locale (sauf si c'est une nouvelle création avec Google)
    if (this.isNew && this.authProvider === 'local' && !this.password) {
        return next(new Error('Password is required for local authentication'));
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
