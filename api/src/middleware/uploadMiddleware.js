const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'isange',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'],
    resource_type: 'auto',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(file.originalname.split('.').pop().toLowerCase());
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Images and videos only'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

module.exports = { upload, cloudinary };