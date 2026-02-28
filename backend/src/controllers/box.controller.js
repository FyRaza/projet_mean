const Box = require('../models/Box');
const Boutique = require('../models/Boutique');

// @desc    Get all boxes
// @route   GET /api/boxes
// @access  Public
exports.getAllBoxes = async (req, res) => {
    try {
        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.floor !== undefined) {
            filter.floor = Number(req.query.floor);
        }
        if (req.query.zone) {
            filter.zone = req.query.zone;
        }

        const boxes = await Box.find(filter)
            .populate('boutique', 'name slug status')
            .sort({ zone: 1, floor: 1, name: 1 });

        res.json(boxes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single box by ID
// @route   GET /api/boxes/:id
// @access  Public
exports.getBoxById = async (req, res) => {
    try {
        const box = await Box.findById(req.params.id)
            .populate('boutique', 'name slug status contactEmail contactPhone');

        if (!box) {
            return res.status(404).json({ message: 'Box not found' });
        }

        res.json(box);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new box
// @route   POST /api/boxes
// @access  Private (admin)
exports.createBox = async (req, res) => {
    try {
        const { name, code, floor, zone, area, monthlyRent, features } = req.body;

        // Check if code already exists
        const existing = await Box.findOne({ code });
        if (existing) {
            return res.status(400).json({ message: `Box with code '${code}' already exists` });
        }

        const box = await Box.create({
            name,
            code,
            floor,
            zone,
            area,
            monthlyRent,
            features: features || [],
            status: 'available'
        });

        res.status(201).json(box);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a box
// @route   PUT /api/boxes/:id
// @access  Private (admin)
exports.updateBox = async (req, res) => {
    try {
        const { name, floor, zone, area, monthlyRent, features, status } = req.body;
        const box = await Box.findById(req.params.id);

        if (!box) {
            return res.status(404).json({ message: 'Box not found' });
        }

        if (name) box.name = name;
        if (floor !== undefined) box.floor = floor;
        if (zone) box.zone = zone;
        if (area) box.area = area;
        if (monthlyRent) box.monthlyRent = monthlyRent;
        if (features) box.features = features;
        if (status) box.status = status;

        const updatedBox = await box.save();
        res.json(updatedBox);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a box
// @route   DELETE /api/boxes/:id
// @access  Private (admin)
exports.deleteBox = async (req, res) => {
    try {
        const box = await Box.findById(req.params.id);

        if (!box) {
            return res.status(404).json({ message: 'Box not found' });
        }

        if (box.status === 'occupied') {
            return res.status(400).json({ message: 'Cannot delete an occupied box. Unassign the boutique first.' });
        }

        await box.deleteOne();
        res.json({ message: 'Box removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign a boutique to a box
// @route   PUT /api/boxes/:id/assign
// @access  Private (admin)
exports.assignBoutique = async (req, res) => {
    try {
        const { boutiqueId } = req.body;

        const box = await Box.findById(req.params.id);
        if (!box) {
            return res.status(404).json({ message: 'Box not found' });
        }

        if (box.status === 'occupied') {
            return res.status(400).json({ message: 'Box is already occupied' });
        }

        const boutique = await Boutique.findById(boutiqueId);
        if (!boutique) {
            return res.status(404).json({ message: 'Boutique not found' });
        }

        box.boutique = boutiqueId;
        box.status = 'occupied';
        const updatedBox = await box.save();

        const populatedBox = await Box.findById(updatedBox._id)
            .populate('boutique', 'name slug status');

        res.json(populatedBox);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Unassign a boutique from a box
// @route   PUT /api/boxes/:id/unassign
// @access  Private (admin)
exports.unassignBoutique = async (req, res) => {
    try {
        const box = await Box.findById(req.params.id);
        if (!box) {
            return res.status(404).json({ message: 'Box not found' });
        }

        box.boutique = null;
        box.status = 'available';
        const updatedBox = await box.save();

        res.json(updatedBox);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get box statistics
// @route   GET /api/boxes/stats
// @access  Private (admin)
exports.getBoxStats = async (req, res) => {
    try {
        const total = await Box.countDocuments();
        const available = await Box.countDocuments({ status: 'available' });
        const occupied = await Box.countDocuments({ status: 'occupied' });
        const reserved = await Box.countDocuments({ status: 'reserved' });
        const maintenance = await Box.countDocuments({ status: 'maintenance' });

        // Revenue from occupied boxes
        const revenueResult = await Box.aggregate([
            { $match: { status: 'occupied' } },
            { $group: { _id: null, totalMonthlyRevenue: { $sum: '$monthlyRent' } } }
        ]);
        const totalMonthlyRevenue = revenueResult[0]?.totalMonthlyRevenue || 0;

        // Stats by zone
        const byZone = await Box.aggregate([
            {
                $group: {
                    _id: '$zone',
                    total: { $sum: 1 },
                    occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
                    available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Stats by floor
        const byFloor = await Box.aggregate([
            {
                $group: {
                    _id: '$floor',
                    total: { $sum: 1 },
                    occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
                    available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            total,
            available,
            occupied,
            reserved,
            maintenance,
            occupancyRate: total > 0 ? ((occupied / total) * 100).toFixed(1) : 0,
            totalMonthlyRevenue,
            byZone,
            byFloor
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
