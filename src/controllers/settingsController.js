const Setting = require('../models/Setting');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const path = require('path');
const fs = require('fs');

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret && apiSecret !== 'your_cloudinary_api_secret';
};

const defaultSettings = {
  // Branding
  siteName: 'Isange',
  siteTagline: 'Aho ibyo ukeneye bihurira',
  logoUrl: '/isangeLogo.png',
  faviconUrl: '/favicon.ico',
  primaryColor: '#16a34a',
  secondaryColor: '#f59e0b',
  // Brand Video (single uploaded video)
  brandVideoUrl: '',
  // Notifications
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  adminNewUserAlert: true,
  adminNewPropertyAlert: true,
  adminNewJobAlert: true,
  adminNewAdAlert: true,
  // Permissions
  allowUserRegistration: true,
  requireEmailVerification: true,
  allowPropertyEditing: true,
  allowJobPosting: true,
  allowAdRequests: true,
  // Contact
  platformPhone: '+250 787 832 490',
  platformEmail: 'info@isange.com',
  platformUpi: 'isange@bank',
  supportWhatsApp: 'https://wa.me/250787832490',
  updatesGroupLink: 'https://chat.whatsapp.com/GROUP_INVITE',
};

// Validation helpers
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 500);
};

const isValidUrl = (url) => {
  if (!url) return true; // Allow empty
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
};

const isValidColor = (color) => {
  if (!color) return true;
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

const isValidEmail = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
  if (!phone) return true;
  // More permissive regex for international phone numbers with spaces, dashes, dots
  // Allows: +250 787 832 490, +250787832490, +250-787-832-490, 0787832490, etc.
  return /^[\+]?[0-9\s\-\(\)]{7,20}$/.test(phone);
};

const validateSettings = (updates) => {
  const errors = [];
  const sanitized = {};

  // Branding
  if (updates.siteName !== undefined) {
    sanitized.siteName = sanitizeString(updates.siteName);
    if (!sanitized.siteName) errors.push('Site name is required');
  }
  if (updates.siteTagline !== undefined) {
    sanitized.siteTagline = sanitizeString(updates.siteTagline);
  }
  if (updates.logoUrl !== undefined) {
    sanitized.logoUrl = sanitizeString(updates.logoUrl);
    if (sanitized.logoUrl && !isValidUrl(sanitized.logoUrl) && !sanitized.logoUrl.startsWith('/')) {
      errors.push('Logo URL must be a valid URL or relative path');
    }
  }
  if (updates.faviconUrl !== undefined) {
    sanitized.faviconUrl = sanitizeString(updates.faviconUrl);
    if (sanitized.faviconUrl && !isValidUrl(sanitized.faviconUrl) && !sanitized.faviconUrl.startsWith('/')) {
      errors.push('Favicon URL must be a valid URL or relative path');
    }
  }
  if (updates.primaryColor !== undefined) {
    sanitized.primaryColor = updates.primaryColor;
    if (sanitized.primaryColor && !isValidColor(sanitized.primaryColor)) {
      errors.push('Primary color must be a valid hex color (e.g., #16a34a)');
    }
  }
  if (updates.secondaryColor !== undefined) {
    sanitized.secondaryColor = updates.secondaryColor;
    if (sanitized.secondaryColor && !isValidColor(sanitized.secondaryColor)) {
      errors.push('Secondary color must be a valid hex color (e.g., #f59e0b)');
    }
  }

  // Notifications (booleans)
  const boolFields = [
    'emailNotifications', 'smsNotifications', 'pushNotifications',
    'adminNewUserAlert', 'adminNewPropertyAlert', 'adminNewJobAlert', 'adminNewAdAlert'
  ];
  boolFields.forEach(field => {
    if (updates[field] !== undefined) {
      sanitized[field] = Boolean(updates[field]);
    }
  });

  // Permissions (booleans)
  const permFields = [
    'allowUserRegistration', 'requireEmailVerification', 'allowPropertyEditing',
    'allowJobPosting', 'allowAdRequests'
  ];
  permFields.forEach(field => {
    if (updates[field] !== undefined) {
      sanitized[field] = Boolean(updates[field]);
    }
  });

  // Contact
  if (updates.platformPhone !== undefined) {
    sanitized.platformPhone = sanitizeString(updates.platformPhone);
    if (sanitized.platformPhone && !isValidPhone(sanitized.platformPhone)) {
      errors.push('Platform phone must be a valid phone number');
    }
  }
  if (updates.platformEmail !== undefined) {
    sanitized.platformEmail = sanitizeString(updates.platformEmail).toLowerCase();
    if (sanitized.platformEmail && !isValidEmail(sanitized.platformEmail)) {
      errors.push('Platform email must be a valid email address');
    }
  }
  if (updates.platformUpi !== undefined) {
    sanitized.platformUpi = sanitizeString(updates.platformUpi);
  }
  if (updates.supportWhatsApp !== undefined) {
    sanitized.supportWhatsApp = sanitizeString(updates.supportWhatsApp);
    if (sanitized.supportWhatsApp && !isValidUrl(sanitized.supportWhatsApp)) {
      errors.push('WhatsApp link must be a valid URL');
    }
  }
  if (updates.updatesGroupLink !== undefined) {
    sanitized.updatesGroupLink = sanitizeString(updates.updatesGroupLink);
    if (sanitized.updatesGroupLink && !isValidUrl(sanitized.updatesGroupLink)) {
      errors.push('Updates group link must be a valid URL');
    }
  }

  return { sanitized, errors };
};

const getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create(defaultSettings);
    }
    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { sanitized, errors } = validateSettings(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join('; ') });
    }

    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({ ...defaultSettings, ...sanitized });
    } else {
      Object.assign(setting, sanitized);
      await setting.save();
    }
    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const uploadBrandVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file provided' });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Invalid video format. Use MP4, WebM, or MOV' });
    }

    // Validate file size (100MB max)
    if (req.file.size > 100 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Video file must be less than 100MB' });
    }

    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create(defaultSettings);
    }

    // Delete old video from Cloudinary if exists
    if (setting.brandVideoUrl && setting.brandVideoUrl.includes('cloudinary.com')) {
      try {
        const urlParts = setting.brandVideoUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `isange/videos/${filename.split('.')[0]}`;
        await deleteFromCloudinary(publicId, 'video');
      } catch (err) {
        console.log('Could not delete old video:', err.message);
      }
    }

    let videoUrl;

    if (isCloudinaryConfigured()) {
      // Cloudinary upload (file is in memory as buffer)
      if (!req.file.buffer) {
        return res.status(500).json({ success: false, error: 'File buffer not available for Cloudinary upload' });
      }
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'isange/videos', 'video');
      
      if (!uploadResult.secure_url) {
        return res.status(500).json({ success: false, error: 'Video upload failed - no secure URL returned' });
      }
      videoUrl = uploadResult.secure_url;
    } else {
      // Local storage upload (file is on disk)
      if (!req.file.path || !fs.existsSync(req.file.path)) {
        return res.status(500).json({ success: false, error: 'Uploaded file not found on disk' });
      }
      // For local storage, construct the URL path
      const filename = path.basename(req.file.path);
      videoUrl = `/uploads/${filename}`;
      console.log('Video saved locally:', videoUrl);
    }

    setting.brandVideoUrl = videoUrl;
    await setting.save();

    res.json({ success: true, data: { videoUrl } });
  } catch (err) {
    console.error('Video upload error:', err);
    res.status(500).json({ success: false, error: 'Video upload failed. Please try again.' });
  }
};

module.exports = { getSettings, updateSettings, uploadBrandVideo };