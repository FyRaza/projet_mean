const Boutique = require('../models/Boutique');
const User = require('../models/User');

// @desc    Get all boutiques
// @route   GET /api/boutiques
// @access  Public
exports.getAllBoutiques = async (req, res) => {
    try {
        const boutiques = await Boutique.find().populate('owner', 'firstName lastName email');
        res.json(boutiques);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single boutique
// @route   GET /api/boutiques/:id
// @access  Public
exports.getBoutiqueById = async (req, res) => {
    try {
        const boutique = await Boutique.findById(req.params.id).populate('owner', 'firstName lastName email');
        if (boutique) {
            res.json(boutique);
        } else {
            res.status(404).json({ message: 'Boutique not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a boutique
// @route   POST /api/boutiques
// @access  Private (Boutique Owner/Admin)
exports.createBoutique = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const { name, description, contactEmail, contactPhone, categoryId, ownerId, status, logo } = req.body;

        // Admin can create on behalf of a boutique owner.
        // If ownerId is absent, try to resolve owner from contactEmail to support existing accounts.
        let owner = req.user._id;
        if (req.user.role === 'admin') {
            if (ownerId) {
                owner = ownerId;
            } else if (contactEmail) {
                const existingOwner = await User.findOne({ email: String(contactEmail).toLowerCase() }).select('_id role');
                if (!existingOwner) {
                    return res.status(400).json({ message: 'Owner not found for this email. Provide an existing boutique owner or create a new one.' });
                }
                if (existingOwner.role !== 'boutique') {
                    return res.status(400).json({ message: 'The provided email exists but is not a boutique owner account.' });
                }
                owner = existingOwner._id;
            } else {
                return res.status(400).json({ message: 'ownerId or contactEmail is required for admin boutique creation' });
            }
        }

        // Generate unique slug
        let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let counter = 0;
        while (await Boutique.findOne({ slug })) {
            counter++;
            slug = `${baseSlug}-${counter}`;
        }

        const boutique = new Boutique({
            name,
            slug,
            description,
            contactEmail,
            contactPhone,
            categoryId,
            owner,
            logo: logo || undefined,
            status: req.user.role === 'admin' && status ? status : 'pending'
        });

        const createdBoutique = await boutique.save();
        res.status(201).json(createdBoutique);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a boutique
// @route   PUT /api/boutiques/:id
// @access  Private (Owner/Admin)
exports.updateBoutique = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const { name, description, contactEmail, contactPhone, status, categoryId, logo } = req.body;
        const boutique = await Boutique.findById(req.params.id);

        if (boutique) {
            // Check ownership
            if (boutique.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized' });
            }

            boutique.name = name || boutique.name;
            boutique.description = description || boutique.description;
            boutique.contactEmail = contactEmail || boutique.contactEmail;
            boutique.contactPhone = contactPhone || boutique.contactPhone;
            boutique.categoryId = categoryId || boutique.categoryId;
            boutique.logo = logo || boutique.logo;

            // Only admin can change workflow status.
            if (status && req.user.role === 'admin') {
                boutique.status = status;
            }

            const updatedBoutique = await boutique.save();
            res.json(updatedBoutique);
        } else {
            res.status(404).json({ message: 'Boutique not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a boutique
// @route   DELETE /api/boutiques/:id
// @access  Private (Admin)
exports.deleteBoutique = async (req, res) => {
    try {
        const boutique = await Boutique.findById(req.params.id);

        if (boutique) {
            await boutique.deleteOne();
            res.json({ message: 'Boutique removed' });
        } else {
            res.status(404).json({ message: 'Boutique not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
