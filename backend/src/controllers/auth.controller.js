const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
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

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: role || 'acheteur', // default to acheteur if not specified
            phone
        });

        if (user) {
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

        // Check for user email
        const user = await User.findOne({ email });

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
