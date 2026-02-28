const Order = require('../models/Order');
const Product = require('../models/Product');
const Boutique = require('../models/Boutique');

// @desc    Get all orders (admin) or user orders
// @route   GET /api/orders
// @access  Private
exports.getAllOrders = async (req, res) => {
    try {
        const filter = {};

        // If not admin, only show user's orders
        if (req.user.role === 'acheteur') {
            filter.user = req.user._id;
        }

        // If boutique owner, show orders for their boutique
        if (req.user.role === 'boutique') {
            const ownedBoutiques = await Boutique.find({ owner: req.user._id }).select('_id');
            const ownedBoutiqueIds = ownedBoutiques.map((b) => b._id);
            if (req.query.boutiqueId) {
                const requestedId = String(req.query.boutiqueId);
                const isOwned = ownedBoutiqueIds.some((id) => String(id) === requestedId);
                if (!isOwned) {
                    return res.status(403).json({ message: 'Not authorized to access this boutique orders' });
                }
                filter.boutique = req.query.boutiqueId;
            } else {
                filter.boutique = { $in: ownedBoutiqueIds };
            }
        }

        // Filter by status
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Filter by payment status
        if (req.query.paymentStatus) {
            filter.paymentStatus = req.query.paymentStatus;
        }

        // Filter by date range
        if (req.query.dateFrom || req.query.dateTo) {
            filter.createdAt = {};
            if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
            if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo);
        }

        const pageSize = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;

        const count = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('user', 'firstName lastName email')
            .populate('boutique', 'name slug')
            .populate('items.product', 'name slug images price')
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({
            orders,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'firstName lastName email phone')
            .populate('boutique', 'name slug contactEmail contactPhone owner')
            .populate('items.product', 'name slug images price');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Authorization by role:
        // - admin: all
        // - acheteur: only own orders
        // - boutique: only orders belonging to owned boutique(s)
        if (req.user.role === 'acheteur') {
            if (order.user._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to view this order' });
            }
        } else if (req.user.role === 'boutique') {
            const orderBoutiqueOwnerId = order.boutique?.owner?._id || order.boutique?.owner;
            if (String(orderBoutiqueOwnerId || '') !== String(req.user._id)) {
                return res.status(403).json({ message: 'Not authorized to view this order' });
            }
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (acheteur)
exports.createOrder = async (req, res) => {
    try {
        const { items, boutiqueId, shippingAddress, paymentMethod, notes, fulfillmentType } = req.body;
        const resolvedFulfillmentType = fulfillmentType === 'pickup' ? 'pickup' : 'delivery';

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in the order' });
        }

        // Calculate total and verify product availability
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.product} not found` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price,
                name: product.name
            });

            // Decrease stock
            product.stock -= item.quantity;
            if (product.stock === 0) {
                product.status = 'out_of_stock';
            }
            await product.save();
        }

        if (resolvedFulfillmentType === 'delivery') {
            const hasLocationHint = Boolean(
                shippingAddress?.street?.trim() ||
                shippingAddress?.landmark?.trim() ||
                (shippingAddress?.latitude !== undefined && shippingAddress?.longitude !== undefined)
            );
            if (!hasLocationHint) {
                return res.status(400).json({
                    message: 'Delivery address is required (street, landmark, or GPS coordinates).'
                });
            }
        }

        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            boutique: boutiqueId,
            totalAmount,
            fulfillmentType: resolvedFulfillmentType,
            shippingAddress: resolvedFulfillmentType === 'delivery' ? {
                street: shippingAddress?.street || '',
                landmark: shippingAddress?.landmark || '',
                city: shippingAddress?.city || '',
                postalCode: shippingAddress?.postalCode || '',
                country: shippingAddress?.country || '',
                latitude: shippingAddress?.latitude,
                longitude: shippingAddress?.longitude
            } : undefined,
            notes,
            status: 'pending',
            paymentStatus: 'pending'
        });

        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'firstName lastName email')
            .populate('boutique', 'name slug')
            .populate('items.product', 'name slug images');

        res.status(201).json(populatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (admin, boutique)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Boutique owners can only update orders belonging to their own boutiques.
        if (req.user.role === 'boutique') {
            const owned = await Boutique.findOne({ _id: order.boutique, owner: req.user._id }).select('_id');
            if (!owned) {
                return res.status(403).json({ message: 'Not authorized to update this order' });
            }
        }

        // If cancelling, restore stock
        if (status === 'cancelled' && order.status !== 'cancelled') {
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity;
                    if (product.status === 'out_of_stock') {
                        product.status = 'active';
                    }
                    await product.save();
                }
            }
        }

        order.status = status;
        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private (admin)
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const validStatuses = ['pending', 'paid', 'failed'];

        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({ message: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.paymentStatus = paymentStatus;
        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private (admin, boutique)
exports.getOrderStats = async (req, res) => {
    try {
        const filter = {};
        if (req.query.boutiqueId) {
            filter.boutique = req.query.boutiqueId;
        }

        const totalOrders = await Order.countDocuments(filter);
        const pendingOrders = await Order.countDocuments({ ...filter, status: 'pending' });
        const processingOrders = await Order.countDocuments({ ...filter, status: 'processing' });
        const deliveredOrders = await Order.countDocuments({ ...filter, status: 'delivered' });
        const cancelledOrders = await Order.countDocuments({ ...filter, status: 'cancelled' });

        // Total revenue from delivered orders
        const revenueResult = await Order.aggregate([
            { $match: { ...filter, status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        res.json({
            totalOrders,
            pendingOrders,
            processingOrders,
            deliveredOrders,
            cancelledOrders,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
