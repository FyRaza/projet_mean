const { cloudinary, isConfigured } = require('../config/cloudinary');

/**
 * Upload un buffer vers Cloudinary avec options de transformation
 */
const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: options.folder || 'mall',
            resource_type: 'image',
            transformation: options.transformation || [
                { quality: 'auto', fetch_format: 'auto' }
            ],
            ...options
        };

        const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        stream.end(buffer);
    });
};

// @desc    Upload une seule image
// @route   POST /api/upload
// @access  Private
exports.uploadImage = async (req, res) => {
    try {
        if (!isConfigured()) {
            return res.status(500).json({
                message: 'Cloudinary n\'est pas configuré. Veuillez configurer CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.'
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier fourni' });
        }

        // Déterminer le dossier et la transformation selon le type
        const type = req.body.type || 'product'; // product, logo, banner
        let folder = 'mall/products';
        let transformation = [{ quality: 'auto', fetch_format: 'auto' }];

        switch (type) {
            case 'logo':
                folder = 'mall/logos';
                transformation = [
                    { width: 400, height: 400, crop: 'fill', gravity: 'center' },
                    { quality: 'auto', fetch_format: 'auto' }
                ];
                break;
            case 'banner':
                folder = 'mall/banners';
                transformation = [
                    { width: 1200, height: 400, crop: 'fill', gravity: 'center' },
                    { quality: 'auto', fetch_format: 'auto' }
                ];
                break;
            case 'product':
            default:
                folder = 'mall/products';
                transformation = [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' }
                ];
                break;
        }

        const result = await uploadToCloudinary(req.file.buffer, {
            folder,
            transformation
        });

        res.status(201).json({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.bytes
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload: ' + error.message });
    }
};

// @desc    Upload plusieurs images
// @route   POST /api/upload/multiple
// @access  Private
exports.uploadMultipleImages = async (req, res) => {
    try {
        if (!isConfigured()) {
            return res.status(500).json({
                message: 'Cloudinary n\'est pas configuré.'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Aucun fichier fourni' });
        }

        const type = req.body.type || 'product';
        let folder = 'mall/products';
        let transformation = [{ quality: 'auto', fetch_format: 'auto' }];

        switch (type) {
            case 'logo':
                folder = 'mall/logos';
                transformation = [
                    { width: 400, height: 400, crop: 'fill', gravity: 'center' },
                    { quality: 'auto', fetch_format: 'auto' }
                ];
                break;
            case 'banner':
                folder = 'mall/banners';
                transformation = [
                    { width: 1200, height: 400, crop: 'fill', gravity: 'center' },
                    { quality: 'auto', fetch_format: 'auto' }
                ];
                break;
            default:
                folder = 'mall/products';
                transformation = [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' }
                ];
                break;
        }

        const uploadPromises = req.files.map(file =>
            uploadToCloudinary(file.buffer, { folder, transformation })
        );

        const results = await Promise.all(uploadPromises);

        const images = results.map(result => ({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.bytes
        }));

        res.status(201).json({ images });

    } catch (error) {
        console.error('❌ Multiple upload error:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload: ' + error.message });
    }
};

// @desc    Supprimer une image de Cloudinary
// @route   DELETE /api/upload
// @access  Private
exports.deleteImage = async (req, res) => {
    try {
        if (!isConfigured()) {
            return res.status(500).json({ message: 'Cloudinary n\'est pas configuré.' });
        }

        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({ message: 'publicId est requis' });
        }

        const result = await cloudinary.uploader.destroy(publicId);

        res.json({
            message: 'Image supprimée',
            result: result.result
        });

    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression: ' + error.message });
    }
};

