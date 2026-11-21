const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  // Branding
  siteName: { type: String, default: 'Isange' },
  siteTagline: { type: String, default: 'Aho ibyo ukeneye bihurira' },
  logoUrl: { type: String, default: '/isangeLogo.png' },
  faviconUrl: { type: String, default: '/favicon.ico' },
  primaryColor: { type: String, default: '#16a34a' },
  secondaryColor: { type: String, default: '#f59e0b' },
  // Brand Video (single uploaded video)
  brandVideoUrl: { type: String, default: '' },
  // Notifications
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: false },
  pushNotifications: { type: Boolean, default: true },
  adminNewUserAlert: { type: Boolean, default: true },
  adminNewPropertyAlert: { type: Boolean, default: true },
  adminNewJobAlert: { type: Boolean, default: true },
  adminNewAdAlert: { type: Boolean, default: true },
  // Permissions
  allowUserRegistration: { type: Boolean, default: true },
  requireEmailVerification: { type: Boolean, default: true },
  allowPropertyEditing: { type: Boolean, default: true },
  allowJobPosting: { type: Boolean, default: true },
  allowAdRequests: { type: Boolean, default: true },
  // Contact
  platformPhone: { type: String, default: '+250 787 832 490' },
  platformEmail: { type: String, default: 'info@isange.com' },
  platformUpi: { type: String, default: 'isange@bank' },
  supportWhatsApp: { type: String, default: 'https://wa.me/250787832490' },
  updatesGroupLink: { type: String, default: 'https://chat.whatsapp.com/GROUP_INVITE' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);