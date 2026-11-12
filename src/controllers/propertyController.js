const asyncHandler = require('../utils/asyncHandler');
const Property = require('../models/Property');
const User = require('../models/User');
const Payment = require('../models/Payment');

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

  const { paymentId } = req.body;
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

  const propertyData = {
    ...req.body,
    owner: req.user.id,
    paymentStatus: (hasPayment || unlimitedActive) ? 'completed' : 'pending',
    isPublished: false,
  };
  delete propertyData.paymentId;

  propertyData.images = req.files.images.map((f) => `/uploads/${f.filename}`);
  if (req.files.videos) propertyData.videos = req.files.videos.map((f) => `/uploads/${f.filename}`);

  const property = await Property.create(propertyData);

  if (paymentId && hasPayment && payment && payment.type === 'per-property') {
    payment.property = property._id;
    await payment.save();
  }

  res.status(201).json({ success: true, data: property });
});

const getProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ isPublished: true, isActive: true }).populate('owner', 'name phone email upi address');
  res.status(200).json({ success: true, count: properties.length, data: properties });
});

const getProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate('owner', 'name phone email upi address');
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }
  res.status(200).json({ success: true, data: property });
});

const searchProperties = asyncHandler(async (req, res) => {
  const { area, city, type, category } = req.query;
  const query = { isPublished: true, isActive: true };
  if (area) query.area = { $regex: area, $options: 'i' };
  if (city) query.city = { $regex: city, $options: 'i' };
  if (type) query.type = type;
  if (category) query.category = category;
  const properties = await Property.find(query).populate('owner', 'name phone email upi address').sort('-createdAt');
  res.status(200).json({ success: true, count: properties.length, data: properties });
});

const getMyProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ owner: req.user.id }).sort('-createdAt');
  res.status(200).json({ success: true, count: properties.length, data: properties });
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
  property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
