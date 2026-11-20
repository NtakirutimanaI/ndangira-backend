const multer = require('multer');
const path = require('path');
const fs = require('fs');

let upload;
let cloudinary = null;

// Try to configure Cloudinary, fall back to local storage if not properly configured
try {
  const cloudinaryLib = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (cloudName && apiKey && apiSecret && apiSecret !== 'your_cloudinary_api_secret') {
    cloudinaryLib.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    
    const storage = new CloudinaryStorage({
      cloudinary: cloudinaryLib,
      params: {
        folder: 'isange',
        allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'],
        resource_type: 'auto',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
    });
    
    upload = multer({ 
      storage, 
      limits: { 
        fileSize: 100 * 1024 * 1024, // 100MB for videos
        files: 10 
      } 
    });
    cloudinary = cloudinaryLib;
    console.log('Using Cloudinary for file uploads');
  } else {
    throw new Error('Cloudinary credentials not fully configured');
  }
} catch (err) {
  // Fallback to local disk storage
  console.log('Cloudinary not configured, using local disk storage:', err.message);
  
  const uploadDir = path.join(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(file.originalname.split('.').pop().toLowerCase());
    if (mimetype && extname) cb(null, true);
    else cb(new Error('Images and videos only'));
  };
  
  upload = multer({ 
    storage, 
    fileFilter, 
    limits: { 
      fileSize: 100 * 1024 * 1024, // 100MB for videos
      files: 10 
    } 
  });
}

module.exports = { upload, cloudinary };