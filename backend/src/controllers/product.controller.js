const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 12;
        const page = Number(req.query.page) || 1;

        const filter = {};

        // Keyword search
        if (req.query.keyword) {
            filter.name = {
                $regex: req.query.keyword,
                $options: 'i',
            };
        }

        // Category filter (accept slug or ID)
        if (req.query.category) {
            const categoryQuery = String(req.query.category);
            let categoryDoc = null;

            if (mongoose.isValidObjectId(categoryQuery)) {
                categoryDoc = await Category.findById(categoryQuery).select('_id slug');
            }
            if (!categoryDoc) {
                categoryDoc = await Category.findOne({ slug: categoryQuery }).select('_id slug');
            }

            if (categoryDoc) {
                filter.category = { $in: [String(categoryDoc._id), categoryDoc.slug] };
            } else {
                filter.category = categoryQuery;
            }
        }

        // Boutique filter
        if (req.query.boutique) {
            filter.boutique = req.query.boutique;
        }

        // Price range filter
        const minPrice = req.query.minPrice;
        const maxPrice = req.query.maxPrice;
        const hasMin = minPrice !== undefined && minPrice !== null && minPrice !== '' && minPrice !== 'null';
        const hasMax = maxPrice !== undefined && maxPrice !== null && maxPrice !== '' && maxPrice !== 'null';
        if (hasMin || hasMax) {
            filter.price = {};
            if (hasMin) filter.price.$gte = Number(minPrice);
            if (hasMax) filter.price.$lte = Number(maxPrice);
        }

        // In-stock filter
        if (req.query.inStock === 'true') {
            filter.stock = { $gt: 0 };
        }

        // Tags filter
        if (req.query.tags) {
            filter.tags = { $in: req.query.tags.split(',') };
        }

        // Featured filter
        if (req.query.featured === 'true') {
            filter.isFeatured = true;
        }

        // Status filter
        if (req.query.status) {
            filter.status = req.query.status;
        } else {
            // By default, only show active products
            filter.status = { $ne: 'archived' };
        }

        const count = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('boutique', 'name slug')
            .sort(req.query.sort || '-createdAt')
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({
            products,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('boutique', 'name slug');

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
exports.getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug })
            .populate('boutique', 'name slug');

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Boutique Owner/Admin)
exports.createProduct = async (req, res) => {
    try {
        const { name, price, description, shortDescription, categoryId, boutiqueId, stock, images, tags, isFeatured, sku, status, compareAtPrice, lowStockThreshold } = req.body;
        const allowedStatuses = ['active', 'draft', 'archived', 'out_of_stock'];

        // Generate unique slug
        let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let slugCounter = 0;
        while (await Product.findOne({ slug })) {
            slugCounter++;
            slug = `${baseSlug}-${slugCounter}`;
        }

        const product = new Product({
            name,
            slug,
            price,
            description,
            shortDescription,
            category: categoryId,
            boutique: boutiqueId,
            stock: stock || 0,
            images: images || [],
            tags: tags || [],
            isFeatured: isFeatured || false,
            sku,
            status: allowedStatuses.includes(status) ? status : undefined,
            compareAtPrice,
            lowStockThreshold: lowStockThreshold || 5
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Owner/Admin)
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('boutique');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check ownership: admin can edit all, boutique owner only their products
        if (req.user.role !== 'admin') {
            const boutique = product.boutique;
            if (boutique && boutique.owner && boutique.owner.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to edit this product' });
            }
        }

        const { name, price, description, shortDescription, categoryId, stock, images, tags, isFeatured, sku, status, compareAtPrice, lowStockThreshold } = req.body;

        if (name) {
            product.name = name;
            product.slug = name.toLowerCase().replace(/ /g, '-');
        }
        if (price !== undefined) product.price = price;
        if (description !== undefined) product.description = description;
        if (shortDescription !== undefined) product.shortDescription = shortDescription;
        if (categoryId) product.category = categoryId;
        if (stock !== undefined) product.stock = stock;
        if (images) product.images = images;
        if (tags) product.tags = tags;
        if (isFeatured !== undefined) product.isFeatured = isFeatured;
        if (sku) product.sku = sku;
        if (status) product.status = status;
        if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice;
        if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Owner/Admin)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

