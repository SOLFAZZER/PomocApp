// src/middleware/upload.js
const cloudinary = require('cloudinary').v2;
const multer     = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Almacenamiento en Cloudinary — carpeta 'pomocapp/publicaciones'
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pomocapp/publicaciones',
    allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'],
    resource_type: 'auto',
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // máx 10MB
});

module.exports = { upload, cloudinary };
