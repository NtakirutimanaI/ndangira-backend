const asyncHandler = require('../utils/asyncHandler');
const Property = require('../models/Property');
const User = require('../models/User');
const Payment = require('../models/Payment');
const path = require('path');

const PLATFORM_FEE_PERCENT = 10;

const getPlatformContact = () => ({
  phone: process.env.PLATFORM_PHONE || '+250788000000',
  email: process.env.PLATFORM_EMAIL || 'info@isange.com',
  upi: process.env.PLATFORM_UPI || 'isange@upi',
});

const canUpload = async (user) => {
  if (user.subscriptionType === 'unlimited' && user.subscriptionActive && user.subscriptionExpiresAt > new Date()) {
    return true;
  }
  return false;
};

const createProperty = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user.role !== 'owner') {
    const error = new Error('Only owners can publish properties');
    error.statusCode = 403;
    throw error;
  }

  const { paymentId, ownerPrice } = req.body;
  
  if (!ownerPrice || ownerPrice <= 0) {
    const error = new Error('Owner price is required and must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  let hasPayment = false;
  let payment = null;

  if (paymentId) {
    payment = await Payment.findOne({ _id: paymentId, user: req.user.id, status: 'completed' });
    if (payment) {
      if (payment.type === 'per-property' && !payment.property) {
        hasPayment = true;
      } else if (payment.type === 'unlimited') {
        hasPayment = true;
      }
    }
  }

  const unlimitedActive = await canUpload(user);

  if (!req.files || !req.files.images || req.files.images.length < 3) {
    const error = new Error('At least 3 property images are required');
    error.statusCode = 400;
    throw error;
  }

  const platformPrice = Math.round(ownerPrice * (1 + PLATFORM_FEE_PERCENT / 100));
  const platformContact = getPlatformContact();

  const propertyData = {
    ...req.body,
    owner: req.user.id,
    ownerPrice: Number(ownerPrice),
    platformPrice,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    currency: req.body.currency || 'RWF',
    paymentStatus: (hasPayment || unlimitedActive) ? 'completed' : 'pending',
    isPublished: false,
    // Owner contact (private)
    ownerPhone: req.body.ownerPhone || user.phone,
    ownerEmail: req.body.ownerEmail || user.email,
    ownerUpi: req.body.ownerUpi || user.upi,
    // Platform contact (public)
    platformPhone: platformContact.phone,
    platformEmail: platformContact.email,
    platformUpi: platformContact.upi,
  };
  delete propertyData.paymentId;

  propertyData.images = req.files.images.map((f) => {
    // For local storage, f.path is full path; we need just filename for /uploads/ URL
    // For Cloudinary, f.path is the full URL
    if (f.path.startsWith('http')) return f.path;
    return path.basename(f.path);
  });
  if (req.files.videos) propertyData.videos = req.files.videos.map((f) => {
    if (f.path.startsWith('http')) return f.path;
    return path.basename(f.path);
  });

  const property = await Property.create(propertyData);

  if (paymentId && hasPayment && payment && payment.type === 'per-property') {
    payment.property = property._id;
    await payment.save();
  }

  res.status(201).json({ success: true, data: property });
});

const getProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ isPublished: true, isActive: true });
  const platformContact = getPlatformContact();
  
  // Transform: hide owner contact, show platform contact, use platformPrice as price
  const publicProperties = properties.map(p => ({
    ...p.toObject(),
    price: p.platformPrice,
    contactPhone: p.platformPhone || platformContact.phone,
    contactEmail: p.platformEmail || platformContact.email,
    upi: p.platformUpi || platformContact.upi,
    // Remove private fields
    ownerPrice: undefined,
    ownerPhone: undefined,
    ownerEmail: undefined,
    ownerUpi: undefined,
    platformFeePercent: undefined,
    platformPhone: undefined,
    platformEmail: undefined,
    platformUpi: undefined,
  }));
  
  res.status(200).json({ success: true, count: properties.length, data: publicProperties });
});

const getProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Check if requester is owner or admin
  const isOwnerOrAdmin = req.user && (property.owner.toString() === req.user.id || req.user.role === 'admin');
  
  const platformContact = getPlatformContact();
  const prop = property.toObject();
  
  if (isOwnerOrAdmin) {
    // Owner/admin sees everything
    prop.price = prop.platformPrice;
  } else {
    // Public sees platform price and platform contact only
    prop.price = prop.platformPrice;
    prop.contactPhone = prop.platformPhone || platformContact.phone;
    prop.contactEmail = prop.platformEmail || platformContact.email;
    prop.upi = prop.platformUpi || platformContact.upi;
    // Remove private fields
    delete prop.ownerPrice;
    delete prop.ownerPhone;
    delete prop.ownerEmail;
    delete prop.ownerUpi;
    delete prop.platformFeePercent;
    delete prop.platformPhone;
    delete prop.platformEmail;
    delete prop.platformUpi;
  }
  
  res.status(200).json({ success: true, data: prop });
});

const searchProperties = asyncHandler(async (req, res) => {
  const { area, city, type, transactionType, condition } = req.query;
  const query = { isPublished: true, isActive: true };
  if (area) query.area = { $regex: area, $options: 'i' };
  if (city) query.city = { $regex: city, $options: 'i' };
  if (type) query.type = type;
  if (transactionType) query.transactionType = transactionType;
  if (condition) query.condition = condition;
  
  const properties = await Property.find(query).sort('-createdAt');
  const platformContact = getPlatformContact();
  
  const publicProperties = properties.map(p => ({
    ...p.toObject(),
    price: p.platformPrice,
    contactPhone: p.platformPhone || platformContact.phone,
    contactEmail: p.platformEmail || platformContact.email,
    upi: p.platformUpi || platformContact.upi,
    ownerPrice: undefined,
    ownerPhone: undefined,
    ownerEmail: undefined,
    ownerUpi: undefined,
    platformFeePercent: undefined,
    platformPhone: undefined,
    platformEmail: undefined,
    platformUpi: undefined,
  }));
  
  res.status(200).json({ success: true, count: properties.length, data: publicProperties });
});

const getMyProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ owner: req.user.id }).sort('-createdAt');
  // Owner sees all fields including ownerPrice
  const ownerProperties = properties.map(p => ({
    ...p.toObject(),
    price: p.platformPrice,
  }));
  res.status(200).json({ success: true, count: properties.length, data: ownerProperties });
});

const updateProperty = asyncHandler(async (req, res) => {
  let property = await Property.findById(req.params.id);
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }
  if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    const error = new Error('Not authorized to update this property');
    error.statusCode = 401;
    throw error;
  }
  
  const allowed = [
    'title','description',
    'type','transactionType','condition','currency',
    'area','location','address','city','country',
    'ownerPhone','ownerEmail','ownerUpi',
    'ownerPrice', // owner can update their desired price
    'images', // allow replacing full images array (URLs to keep)
    'videos'  // allow replacing full videos array (URLs to keep)
  ];
  
  const payload = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) payload[k] = req.body[k]; });
  
  // Recalculate platformPrice if ownerPrice changed
  if (payload.ownerPrice !== undefined) {
    payload.ownerPrice = Number(payload.ownerPrice);
    payload.platformPrice = Math.round(payload.ownerPrice * (1 + PLATFORM_FEE_PERCENT / 100));
  }
  
  // Handle file uploads - merge with existing or with provided images/videos arrays
  if (req.files) {
    if (req.files.images) {
      const newImages = req.files.images.map((f) => {
        if (f.path.startsWith('http')) return f.path;
        return path.basename(f.path);
      });
      // Start with images from body (if provided) or existing property images
      const baseImages = payload.images || property.images || [];
      payload.images = [...baseImages, ...newImages];
    }
    if (req.files.videos) {
      const newVideos = req.files.videos.map((f) => {
        if (f.path.startsWith('http')) return f.path;
        return path.basename(f.path);
      });
      const baseVideos = payload.videos || property.videos || [];
      payload.videos = [...baseVideos, ...newVideos];
    }
  } else if (payload.images !== undefined || payload.videos !== undefined) {
    // If no new files but images/videos arrays provided in body, use them as-is
    // (this allows removing images/videos by sending the reduced array)
    if (payload.images === undefined) payload.images = property.images || [];
    if (payload.videos === undefined) payload.videos = property.videos || [];
  }
  
  property = await Property.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: property });
});

const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }
  if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    const error = new Error('Not authorized to delete this property');
    error.statusCode = 401;
    throw error;
  }
  await property.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

module.exports = { createProperty, getProperties, getProperty, searchProperties, getMyProperties, updateProperty, deleteProperty };