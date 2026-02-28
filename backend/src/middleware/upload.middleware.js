const multer = require('multer');

// Utilisation du stockage mémoire (buffer) pour ensuite upload vers Cloudinary
const storage = multer.memoryStorage();

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non supporté. Formats acceptés: JPG, PNG, WebP, GIF'), false);
    }
};

// Upload simple (1 fichier)
const uploadSingle = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 Mo max
    }
}).single('image');

// Upload multiple (jusqu'à 8 fichiers)
const uploadMultiple = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 Mo max par fichier
    }
}).array('images', 8);

// Middleware wrapper pour gérer les erreurs multer proprement
const handleUpload = (uploadFn) => {
    return (req, res, next) => {
        uploadFn(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ message: 'Le fichier est trop volumineux. Taille maximale: 5 Mo' });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({ message: 'Trop de fichiers. Maximum: 8 fichiers' });
                }
                return res.status(400).json({ message: err.message });
            }
            if (err) {
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    };
};

module.exports = {
    uploadSingle: handleUpload(uploadSingle),
    uploadMultiple: handleUpload(uploadMultiple)
};

