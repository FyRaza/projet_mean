const Order = require('../models/Order');
const Product = require('../models/Product');
const Boutique = require('../models/Boutique');
const User = require('../models/User');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../services/email.service');

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

        // Filter by order type (online vs pos) – defaults to showing all
        if (req.query.orderType) {
            filter.orderType = req.query.orderType;
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

        // Déterminer le paymentMethod : si pickup, forcer cash_on_pickup
        let resolvedPaymentMethod = paymentMethod || 'cash';
        if (resolvedFulfillmentType === 'pickup') {
            resolvedPaymentMethod = 'cash_on_pickup';
        } else if (resolvedPaymentMethod === 'cash_on_pickup') {
            resolvedPaymentMethod = 'cash';
        }

        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            boutique: boutiqueId,
            totalAmount,
            fulfillmentType: resolvedFulfillmentType,
            paymentMethod: resolvedPaymentMethod,
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

        // Envoyer l'email de confirmation (ne pas bloquer si l'email échoue)
        if (populatedOrder.user) {
            sendOrderConfirmationEmail(populatedOrder, populatedOrder.user).catch(err => {
                console.error('Error sending order confirmation email:', err);
            });
        }

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

        // Sauvegarder l'ancien statut pour l'email
        const oldStatus = order.status;

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

        // Envoyer l'email de notification si le statut a changé (ne pas bloquer si l'email échoue)
        if (oldStatus !== status) {
            const populatedOrder = await Order.findById(updatedOrder._id)
                .populate('user', 'firstName lastName email')
                .populate('boutique', 'name slug');
            
            if (populatedOrder.user) {
                sendOrderStatusUpdateEmail(populatedOrder, populatedOrder.user, oldStatus, status).catch(err => {
                    console.error('Error sending order status update email:', err);
                });
            }
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel order (client only, pending orders)
// @route   PUT /api/orders/:id/cancel
// @access  Private (acheteur - own orders only)
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Vérifier que c'est bien le propriétaire de la commande
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        // Vérifier que le statut est "pending" (en attente)
        if (order.status !== 'pending') {
            return res.status(400).json({ 
                message: `Impossible d'annuler la commande. Seules les commandes en attente peuvent être annulées. Statut actuel: ${order.status}` 
            });
        }

        // Sauvegarder l'ancien statut pour l'email
        const oldStatus = order.status;

        // Restaurer le stock
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

        // Mettre à jour le statut
        order.status = 'cancelled';
        const updatedOrder = await order.save();

        // Envoyer l'email de notification
        const populatedOrder = await Order.findById(updatedOrder._id)
            .populate('user', 'firstName lastName email')
            .populate('boutique', 'name slug');
        
        if (populatedOrder.user) {
            sendOrderStatusUpdateEmail(populatedOrder, populatedOrder.user, oldStatus, 'cancelled').catch(err => {
                console.error('Error sending order cancellation email:', err);
            });
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error('Error cancelling order:', error);
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

        // By default, only count online orders in the existing stats endpoint
        // unless explicitly asked for POS or all
        if (req.query.orderType) {
            filter.orderType = req.query.orderType;
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

// ═══════════════════════════════════════════════════
//   POS (Point of Sale / Caisse) Endpoints
// ═══════════════════════════════════════════════════

// @desc    Create a POS sale (in-store purchase) — full supermarket cashier
// @route   POST /api/orders/pos
// @access  Private (boutique)
exports.createPosSale = async (req, res) => {
    try {
        const {
            items, boutiqueId, paymentMethod, notes, customerName, userId,
            discountPercent, discountAmount, taxRate,
            amountReceived, itemDiscounts
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Aucun article dans la vente' });
        }

        if (!boutiqueId) {
            return res.status(400).json({ message: 'boutiqueId est requis' });
        }

        // Verify the current user owns this boutique
        const boutique = await Boutique.findOne({ _id: boutiqueId, owner: req.user._id });
        if (!boutique) {
            return res.status(403).json({ message: 'Vous n\'êtes pas propriétaire de cette boutique' });
        }

        // Validate payment method
        const validPaymentMethods = ['cash', 'mobile_money', 'card'];
        const resolvedPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'cash';

        // Calculate subtotal and verify product availability
        let subtotal = 0;
        const orderItems = [];
        const resolvedItemDiscounts = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Produit ${item.product} introuvable` });
            }
            if (String(product.boutique) !== String(boutiqueId)) {
                return res.status(400).json({ message: `Le produit "${product.name}" n'appartient pas à cette boutique` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Stock insuffisant pour "${product.name}". Disponible: ${product.stock}`
                });
            }

            let itemPrice = product.price;

            // Apply per-item discount if provided
            const itemDiscount = itemDiscounts?.find(d => String(d.product) === String(item.product));
            let itemDiscountAmt = 0;
            if (itemDiscount) {
                if (itemDiscount.discountPercent > 0) {
                    itemDiscountAmt = Math.round(itemPrice * itemDiscount.discountPercent / 100);
                } else if (itemDiscount.discountAmount > 0) {
                    itemDiscountAmt = itemDiscount.discountAmount;
                }
                itemPrice = Math.max(0, itemPrice - itemDiscountAmt);
                resolvedItemDiscounts.push({
                    product: product._id,
                    discountAmount: itemDiscountAmt,
                    discountPercent: itemDiscount.discountPercent || 0
                });
            }

            const itemTotal = itemPrice * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: itemPrice,
                name: product.name
            });

            // Decrease stock
            product.stock -= item.quantity;
            if (product.stock === 0) {
                product.status = 'out_of_stock';
            }
            await product.save();
        }

        // Apply global discount
        let globalDiscountAmt = 0;
        const resolvedDiscountPercent = Number(discountPercent) || 0;
        if (resolvedDiscountPercent > 0) {
            globalDiscountAmt = Math.round(subtotal * resolvedDiscountPercent / 100);
        } else if (Number(discountAmount) > 0) {
            globalDiscountAmt = Number(discountAmount);
        }
        const afterDiscount = Math.max(0, subtotal - globalDiscountAmt);

        // Apply tax
        const resolvedTaxRate = Number(taxRate) || 0;
        const taxAmount = resolvedTaxRate > 0 ? Math.round(afterDiscount * resolvedTaxRate / 100) : 0;
        const totalAmount = afterDiscount + taxAmount;

        // Calculate change for cash payments
        const resolvedAmountReceived = Number(amountReceived) || totalAmount;
        const changeGiven = resolvedPaymentMethod === 'cash' ? Math.max(0, resolvedAmountReceived - totalAmount) : 0;

        // Generate sequential receipt number: REC-YYYYMMDD-NNNN
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayCount = await Order.countDocuments({
            orderType: 'pos',
            boutique: boutiqueId,
            createdAt: { $gte: todayStart }
        });
        const receiptNumber = `REC-${todayStr}-${String(todayCount + 1).padStart(4, '0')}`;

        // Optionally link to a registered user
        let linkedUser = null;
        if (userId) {
            linkedUser = await User.findById(userId).select('_id');
        }

        const order = await Order.create({
            user: linkedUser ? linkedUser._id : undefined,
            items: orderItems,
            boutique: boutiqueId,
            subtotal,
            discountAmount: globalDiscountAmt,
            discountPercent: resolvedDiscountPercent,
            taxAmount,
            taxRate: resolvedTaxRate,
            totalAmount,
            amountReceived: resolvedAmountReceived,
            changeGiven,
            receiptNumber,
            itemDiscounts: resolvedItemDiscounts,
            orderType: 'pos',
            cashierId: req.user._id,
            customerName: customerName || undefined,
            fulfillmentType: 'pos',
            paymentMethod: resolvedPaymentMethod,
            paymentStatus: 'paid',        // POS sales are paid immediately
            status: 'delivered',           // POS sales are fulfilled immediately
            notes
        });

        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'firstName lastName email')
            .populate('boutique', 'name slug')
            .populate('cashierId', 'firstName lastName')
            .populate('items.product', 'name slug images price');

        res.status(201).json(populatedOrder);
    } catch (error) {
        console.error('Error creating POS sale:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get POS sales for a boutique
// @route   GET /api/orders/pos
// @access  Private (boutique)
exports.getPosSales = async (req, res) => {
    try {
        const filter = { orderType: 'pos' };

        // Boutique owner: restrict to owned boutiques
        const ownedBoutiques = await Boutique.find({ owner: req.user._id }).select('_id');
        const ownedBoutiqueIds = ownedBoutiques.map((b) => b._id);

        if (req.query.boutiqueId) {
            const requestedId = String(req.query.boutiqueId);
            const isOwned = ownedBoutiqueIds.some((id) => String(id) === requestedId);
            if (!isOwned && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Non autorisé à accéder aux ventes de cette boutique' });
            }
            filter.boutique = req.query.boutiqueId;
        } else if (req.user.role === 'boutique') {
            filter.boutique = { $in: ownedBoutiqueIds };
        }

        // Date range filter
        if (req.query.dateFrom || req.query.dateTo) {
            filter.createdAt = {};
            if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
            if (req.query.dateTo) {
                const dateTo = new Date(req.query.dateTo);
                dateTo.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = dateTo;
            }
        }

        // Payment method filter
        if (req.query.paymentMethod) {
            filter.paymentMethod = req.query.paymentMethod;
        }

        // Search filter (by customerName or order ID)
        if (req.query.search) {
            const search = req.query.search.trim();
            // Try to match as ObjectId first
            const mongoose = require('mongoose');
            if (mongoose.isValidObjectId(search)) {
                filter._id = search;
            } else {
                filter.customerName = { $regex: search, $options: 'i' };
            }
        }

        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;

        const count = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('user', 'firstName lastName email')
            .populate('boutique', 'name slug')
            .populate('cashierId', 'firstName lastName')
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

// @desc    Get POS statistics for a boutique
// @route   GET /api/orders/pos/stats
// @access  Private (boutique, admin)
exports.getPosStats = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const filter = { orderType: 'pos' };

        if (req.query.boutiqueId) {
            // Verify ownership
            if (req.user.role === 'boutique') {
                const owned = await Boutique.findOne({ _id: req.query.boutiqueId, owner: req.user._id });
                if (!owned) {
                    return res.status(403).json({ message: 'Non autorisé' });
                }
            }
            filter.boutique = new mongoose.Types.ObjectId(req.query.boutiqueId);
        } else if (req.user.role === 'boutique') {
            const ownedBoutiques = await Boutique.find({ owner: req.user._id }).select('_id');
            filter.boutique = { $in: ownedBoutiques.map(b => b._id) };
        }

        // Date range filter
        if (req.query.dateFrom || req.query.dateTo) {
            filter.createdAt = {};
            if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
            if (req.query.dateTo) {
                const dateTo = new Date(req.query.dateTo);
                dateTo.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = dateTo;
            }
        }

        const totalSales = await Order.countDocuments(filter);

        // Total revenue
        const revenueResult = await Order.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // Average ticket
        const averageTicket = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

        // Sales by payment method
        const byPaymentMethod = await Order.aggregate([
            { $match: filter },
            { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
        ]);
        const salesByPaymentMethod = {};
        byPaymentMethod.forEach(m => {
            salesByPaymentMethod[m._id] = { count: m.count, total: m.total };
        });

        // Today's sales
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayFilter = { ...filter, createdAt: { ...filter.createdAt, $gte: todayStart } };
        const todaySales = await Order.countDocuments(todayFilter);
        const todayRevenueResult = await Order.aggregate([
            { $match: todayFilter },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const todayRevenue = todayRevenueResult[0]?.total || 0;

        // Top products
        const topProducts = await Order.aggregate([
            { $match: filter },
            { $unwind: '$items' },
            { $group: {
                _id: '$items.product',
                name: { $first: '$items.name' },
                totalQty: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }},
            { $sort: { totalQty: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            totalSales,
            totalRevenue,
            averageTicket,
            todaySales,
            todayRevenue,
            salesByPaymentMethod,
            topProducts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get daily cash register summary (opening/closing)
// @route   GET /api/orders/pos/daily-summary
// @access  Private (boutique, admin)
exports.getDailySummary = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const { boutiqueId, date } = req.query;

        if (!boutiqueId) {
            return res.status(400).json({ message: 'boutiqueId est requis' });
        }

        // Verify ownership
        if (req.user.role === 'boutique') {
            const owned = await Boutique.findOne({ _id: boutiqueId, owner: req.user._id });
            if (!owned) {
                return res.status(403).json({ message: 'Non autorisé' });
            }
        }

        // Date range: the requested day (or today)
        const targetDate = date ? new Date(date) : new Date();
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        const filter = {
            orderType: 'pos',
            boutique: new mongoose.Types.ObjectId(boutiqueId),
            createdAt: { $gte: dayStart, $lte: dayEnd }
        };

        // All sales of the day
        const sales = await Order.find(filter)
            .populate('cashierId', 'firstName lastName')
            .populate('items.product', 'name price')
            .sort({ createdAt: 1 });

        const activeSales = sales.filter(s => s.status !== 'cancelled');
        const cancelledSales = sales.filter(s => s.status === 'cancelled');

        // Aggregate by payment method
        const byMethod = {};
        for (const sale of activeSales) {
            const m = sale.paymentMethod || 'cash';
            if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 };
            byMethod[m].count++;
            byMethod[m].total += sale.totalAmount;
        }

        // Aggregate by hour for chart
        const byHour = {};
        for (const sale of activeSales) {
            const h = new Date(sale.createdAt).getHours();
            const key = `${String(h).padStart(2, '0')}:00`;
            if (!byHour[key]) byHour[key] = { count: 0, total: 0 };
            byHour[key].count++;
            byHour[key].total += sale.totalAmount;
        }

        // Total revenue, discounts, tax
        const totalRevenue = activeSales.reduce((s, o) => s + o.totalAmount, 0);
        const totalDiscount = activeSales.reduce((s, o) => s + (o.discountAmount || 0), 0);
        const totalTax = activeSales.reduce((s, o) => s + (o.taxAmount || 0), 0);
        const totalSubtotal = activeSales.reduce((s, o) => s + (o.subtotal || o.totalAmount), 0);

        // First and last sale time
        const firstSaleTime = activeSales.length > 0 ? activeSales[0].createdAt : null;
        const lastSaleTime = activeSales.length > 0 ? activeSales[activeSales.length - 1].createdAt : null;

        res.json({
            date: dayStart.toISOString().slice(0, 10),
            totalSales: activeSales.length,
            cancelledSales: cancelledSales.length,
            totalRevenue,
            totalSubtotal,
            totalDiscount,
            totalTax,
            averageTicket: activeSales.length > 0 ? Math.round(totalRevenue / activeSales.length) : 0,
            byPaymentMethod: byMethod,
            byHour,
            firstSaleTime,
            lastSaleTime,
            sales: sales.map(s => ({
                _id: s._id,
                receiptNumber: s.receiptNumber,
                totalAmount: s.totalAmount,
                discountAmount: s.discountAmount,
                taxAmount: s.taxAmount,
                paymentMethod: s.paymentMethod,
                customerName: s.customerName,
                status: s.status,
                itemCount: s.items.length,
                cashier: s.cashierId ? `${s.cashierId.firstName} ${s.cashierId.lastName}` : null,
                createdAt: s.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel/void a POS sale (refund)
// @route   PUT /api/orders/pos/:id/void
// @access  Private (boutique)
exports.voidPosSale = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Vente introuvable' });
        }

        if (order.orderType !== 'pos') {
            return res.status(400).json({ message: 'Cette commande n\'est pas une vente POS' });
        }

        // Verify ownership
        const owned = await Boutique.findOne({ _id: order.boutique, owner: req.user._id });
        if (!owned && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé à annuler cette vente' });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({ message: 'Cette vente est déjà annulée' });
        }

        // Restore stock
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

        order.status = 'cancelled';
        order.paymentStatus = 'failed';
        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
