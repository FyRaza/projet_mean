const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email.service');

// Helper function to generate JWT (7 days instead of 30 for better security)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

const formatUser = (user) => ({
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    authProvider: user.authProvider || 'local',
    addresses: user.addresses || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, phone } = req.body;

        // Input validation
        if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 1 || firstName.trim().length > 50) {
            return res.status(400).json({ message: 'Le prénom est requis (1-50 caractères)' });
        }
        if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 1 || lastName.trim().length > 50) {
            return res.status(400).json({ message: 'Le nom est requis (1-50 caractères)' });
        }
        if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Email invalide' });
        }
        if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
            return res.status(400).json({ message: 'Le mot de passe doit contenir entre 6 et 128 caractères' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Sanitize role: only 'acheteur' and 'boutique' are allowed via self-registration.
        // 'admin' accounts can only be created directly in the database or by an existing admin.
        const allowedSelfRegisterRoles = ['acheteur', 'boutique'];
        const sanitizedRole = allowedSelfRegisterRoles.includes(role) ? role : 'acheteur';

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: sanitizedRole,
            phone,
            authProvider: 'local'
        });

        if (user) {
            // Envoyer l'email de bienvenue (ne pas bloquer si l'email échoue)
            sendWelcomeEmail(user).catch(err => {
                console.error('Error sending welcome email:', err);
            });

            res.status(201).json({
                user: formatUser(user),
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'Email requis' });
        }
        if (!password || typeof password !== 'string') {
            return res.status(400).json({ message: 'Mot de passe requis' });
        }

        // Check for user email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (user && (await user.matchPassword(password))) {
            res.json({
                user: formatUser(user),
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(formatUser(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update current user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = async (req, res) => {
    try {
        const { firstName, lastName, email, phone } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;

        const updated = await user.save();
        res.json(formatUser(updated));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change current user password
// @route   PUT /api/auth/me/password
// @access  Private
exports.changeMyPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'currentPassword and newPassword are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'newPassword must be at least 6 characters' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete current user account
// @route   DELETE /api/auth/me
// @access  Private
exports.deleteMyAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.deleteOne();
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    List current user addresses
// @route   GET /api/auth/me/addresses
// @access  Private
exports.getMyAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('addresses');
        res.json(user?.addresses || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new address for current user
// @route   POST /api/auth/me/addresses
// @access  Private
exports.addMyAddress = async (req, res) => {
    try {
        const { label, fullName, phone, street, landmark, city, postalCode, country, latitude, longitude, isDefault } = req.body;
        if (!street && !landmark) {
            return res.status(400).json({ message: 'street or landmark is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (isDefault) {
            user.addresses.forEach((a) => { a.isDefault = false; });
        }

        user.addresses.push({
            label: label || 'Adresse',
            fullName,
            phone,
            street,
            landmark,
            city,
            postalCode,
            country,
            latitude,
            longitude,
            isDefault: Boolean(isDefault) || user.addresses.length === 0
        });

        const updated = await user.save();
        res.status(201).json(updated.addresses[updated.addresses.length - 1]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an address
// @route   PUT /api/auth/me/addresses/:addressId
// @access  Private
exports.updateMyAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: 'Address not found' });

        const { label, fullName, phone, street, landmark, city, postalCode, country, latitude, longitude, isDefault } = req.body;
        if (label !== undefined) address.label = label;
        if (fullName !== undefined) address.fullName = fullName;
        if (phone !== undefined) address.phone = phone;
        if (street !== undefined) address.street = street;
        if (landmark !== undefined) address.landmark = landmark;
        if (city !== undefined) address.city = city;
        if (postalCode !== undefined) address.postalCode = postalCode;
        if (country !== undefined) address.country = country;
        if (latitude !== undefined) address.latitude = latitude;
        if (longitude !== undefined) address.longitude = longitude;

        if (isDefault) {
            user.addresses.forEach((a) => { a.isDefault = false; });
            address.isDefault = true;
        }

        await user.save();
        res.json(address);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an address
// @route   DELETE /api/auth/me/addresses/:addressId
// @access  Private
exports.deleteMyAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: 'Address not found' });

        const wasDefault = address.isDefault;
        address.deleteOne();

        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        res.json({ message: 'Address removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    List boutique owner accounts
// @route   GET /api/auth/boutique-owners
// @access  Private (Admin)
exports.getBoutiqueOwners = async (req, res) => {
    try {
        const owners = await User.find({ role: 'boutique' })
            .select('_id firstName lastName email phone isActive createdAt updatedAt role')
            .sort({ createdAt: -1 });
        res.json(owners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forgot password - Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
        if (!user) {
            return res.json({ 
                message: 'If that email exists, a password reset link has been sent.' 
            });
        }

        // Générer un token de réinitialisation
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hasher le token et le sauvegarder dans la base
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 heure

        await user.save({ validateBeforeSave: false });

        // Envoyer l'email avec le token en clair
        try {
            await sendPasswordResetEmail(user, resetToken);
            res.json({ 
                message: 'If that email exists, a password reset link has been sent.' 
            });
        } catch (error) {
            // Si l'email échoue, réinitialiser les champs
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            
            console.error('Error sending password reset email:', error);
            return res.status(500).json({ 
                message: 'Error sending email. Please try again later.' 
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset password with token
// @route   PUT /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ 
                message: 'Token and password are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters' 
            });
        }

        // Hasher le token pour le comparer avec celui en base
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Trouver l'utilisateur avec ce token valide et non expiré
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                message: 'Invalid or expired reset token' 
            });
        }

        // Mettre à jour le mot de passe
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({ 
            message: 'Password reset successful. You can now login with your new password.' 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate with Google OAuth
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'Google ID token is required' });
        }

        // Vérifier le token Google
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
        } catch (error) {
            return res.status(401).json({ 
                message: 'Invalid Google token',
                error: error.message 
            });
        }

        const payload = ticket.getPayload();
        const { sub: googleId, email, given_name: firstName, family_name: lastName, picture } = payload;

        if (!email) {
            return res.status(400).json({ message: 'Email not provided by Google' });
        }

        // Chercher un utilisateur existant par email ou googleId
        let user = await User.findOne({
            $or: [
                { email },
                { googleId }
            ]
        });

        if (user) {
            // Utilisateur existe déjà
            // Mettre à jour googleId si absent
            if (!user.googleId && googleId) {
                user.googleId = googleId;
                user.authProvider = 'google';
                await user.save();
            }

            // Envoyer email de bienvenue seulement si c'est une nouvelle connexion Google
            if (user.authProvider === 'local' && !user.googleId) {
                // L'utilisateur avait un compte local, maintenant il se connecte avec Google
                user.googleId = googleId;
                user.authProvider = 'google';
                await user.save();
            }
        } else {
            // Créer un nouvel utilisateur
            user = await User.create({
                firstName: firstName || 'Utilisateur',
                lastName: lastName || 'Google',
                email,
                googleId,
                authProvider: 'google',
                role: 'acheteur', // Par défaut, les utilisateurs Google sont des acheteurs
                // Pas de password pour les utilisateurs Google
            });

            // Envoyer l'email de bienvenue (ne pas bloquer si l'email échoue)
            sendWelcomeEmail(user).catch(err => {
                console.error('Error sending welcome email:', err);
            });
        }

        // Générer le token JWT
        const token = generateToken(user._id);

        res.json({
            user: formatUser(user),
            token
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ 
            message: 'Error authenticating with Google',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
