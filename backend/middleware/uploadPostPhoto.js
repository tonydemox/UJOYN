const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: 'poisivede10/post-photos',
        public_id: `${req.params.id}-${req.userId}-${Date.now()}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    }),
});

const uploadPostPhoto = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = uploadPostPhoto;