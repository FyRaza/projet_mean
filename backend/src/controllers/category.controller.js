const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
    try {
        const filter = {};

        if (req.query.type) {
            filter.type = req.query.type;
        }
        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === 'true';
        }

        const categories = await Category.find(filter)
            .populate('parent', 'name slug')
            .sort({ name: 1 });

        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent', 'name slug');

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Also get subcategories
        const subcategories = await Category.find({ parent: category._id });

        res.json({ ...category.toObject(), subcategories });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (admin)
exports.createCategory = async (req, res) => {
    try {
        const { name, description, icon, type, parent } = req.body;

        // Generate slug from name
        const slug = name.toLowerCase()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[éèêë]/g, 'e')
            .replace(/[ïî]/g, 'i')
            .replace(/[ôö]/g, 'o')
            .replace(/[ùûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[&]/g, 'et')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Check if slug exists
        const existing = await Category.findOne({ slug });
        if (existing) {
            return res.status(400).json({ message: `A category with slug '${slug}' already exists` });
        }

        // Verify parent exists if provided
        if (parent) {
            const parentCat = await Category.findById(parent);
            if (!parentCat) {
                return res.status(404).json({ message: 'Parent category not found' });
            }
        }

        const category = await Category.create({
            name,
            slug,
            description,
            icon,
            type: type || 'product',
            parent: parent || null,
            isActive: true
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (admin)
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, icon, type, parent, isActive } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (name) {
            category.name = name;
            category.slug = name.toLowerCase()
                .replace(/[àáâãäå]/g, 'a')
                .replace(/[éèêë]/g, 'e')
                .replace(/[ïî]/g, 'i')
                .replace(/[ôö]/g, 'o')
                .replace(/[ùûü]/g, 'u')
                .replace(/[ç]/g, 'c')
                .replace(/[&]/g, 'et')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }
        if (description !== undefined) category.description = description;
        if (icon) category.icon = icon;
        if (type) category.type = type;
        if (parent !== undefined) category.parent = parent || null;
        if (isActive !== undefined) category.isActive = isActive;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (admin)
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if there are subcategories
        const subcategoryCount = await Category.countDocuments({ parent: category._id });
        if (subcategoryCount > 0) {
            return res.status(400).json({
                message: `Cannot delete: ${subcategoryCount} subcategories depend on this category. Delete them first.`
            });
        }

        await category.deleteOne();
        res.json({ message: 'Category removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle category active status
// @route   PATCH /api/categories/:id/toggle
// @access  Private (admin)
exports.toggleCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.isActive = !category.isActive;
        const updatedCategory = await category.save();

        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get category tree (hierarchical)
// @route   GET /api/categories/tree
// @access  Public
exports.getCategoryTree = async (req, res) => {
    try {
        const filter = {};
        if (req.query.type) filter.type = req.query.type;

        const allCategories = await Category.find(filter).sort({ name: 1 });

        // Build tree structure
        const categoryMap = {};
        const tree = [];

        allCategories.forEach(cat => {
            categoryMap[cat._id] = { ...cat.toObject(), children: [] };
        });

        allCategories.forEach(cat => {
            if (cat.parent && categoryMap[cat.parent]) {
                categoryMap[cat.parent].children.push(categoryMap[cat._id]);
            } else {
                tree.push(categoryMap[cat._id]);
            }
        });

        res.json(tree);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
