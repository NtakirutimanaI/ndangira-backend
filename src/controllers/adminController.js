const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Property = require('../models/Property');
const { notifyUserVerified, notifyPropertyApproved, notifyPropertyRejected, notifySubscribersNewProperty } = require('../services/notifier');

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt');
  res.status(200).json({ success: true, count: users.length, data: users });
});

const getAllProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find().populate('owner', 'name email phone role').sort('-createdAt');
  res.status(200).json({ success: true, count: properties.length, data: properties });
});

const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  user.isVerified = !user.isVerified;
  await user.save();
  try { await notifyUserVerified({ user, isVerified: user.isVerified }); } catch (e) { console.error('notifyUserVerified error:', e.message || e); }
  res.status(200).json({ success: true, data: user });
});

const approveProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }
  const wasPublished = property.isPublished;
  property.isPublished = true;
  property.isActive = true;
  await property.save();
  const owner = await User.findById(property.owner);
  try { await notifyPropertyApproved({ property, owner }); } catch (e) { console.error('notifyPropertyApproved error:', e.message || e); }
  if (!wasPublished) {
    try { await notifySubscribersNewProperty({ property }); } catch (e) { console.error('notifySubscribersNewProperty error:', e.message || e); }
  }
  res.status(200).json({ success: true, data: property });
});

const rejectProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }
  property.isPublished = false;
  property.isActive = false;
  await property.save();
  const owner = await User.findById(property.owner);
  try { await notifyPropertyRejected({ property, owner }); } catch (e) { console.error('notifyPropertyRejected error:', e.message || e); }
  res.status(200).json({ success: true, data: property });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  if (user.role === 'admin') {
    const error = new Error('Cannot delete admin user');
    error.statusCode = 400;
    throw error;
  }
  await Property.deleteMany({ owner: user._id });
  await User.deleteOne({ _id: user._id });
  res.status(200).json({ success: true, data: {} });
});

const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }
  await Property.deleteOne({ _id: property._id });
  res.status(200).json({ success: true, data: {} });
});

module.exports = { getAllUsers, getAllProperties, verifyUser, approveProperty, rejectProperty, deleteUser, deleteProperty };
