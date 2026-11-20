const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Property = require('../models/Property');
const Job = require('../models/Job');
const Ad = require('../models/Ad');
const Category = require('../models/Category');
const bcrypt = require('bcryptjs');
const { notifyUserVerified, notifyPropertyApproved, notifyPropertyRejected, notifySubscribersNewProperty } = require('../services/notifier');

const seedDatabase = asyncHandler(async (req, res) => {
  console.log('seedDatabase called');
  try {
    // Clear existing data
    await Property.deleteMany({});
    await Job.deleteMany({});
    await Ad.deleteMany({});
    await Category.deleteMany({});
  
  // Seed categories (for backward compatibility - transaction types and conditions)
  const categories = [
    { name: 'For Sale', slug: 'sale', isPublished: true },
    { name: 'For Rent', slug: 'rent', isPublished: true },
    { name: 'New', slug: 'new', isPublished: true },
    { name: 'Used', slug: 'used', isPublished: true },
  ];
  await Category.insertMany(categories);
  
  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const owner = await User.create({
    name: 'Test Owner',
    email: 'owner@test.com',
    password: hashedPassword,
    phone: '+250788000000',
    role: 'owner',
    upi: 'owner@upi'
  });
  
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: hashedPassword,
    phone: '+250788111111',
    role: 'admin'
  });

  // Create properties with new schema (transactionType + condition)
  const PLATFORM_FEE_PERCENT = 10;
  const properties = [
    {
      title: 'Modern House in Kigali',
      titleRw: 'Inzu mageze mu Kigali',
      description: 'Beautiful 3 bedroom house with garden',
      descriptionRw: 'Inzu nziza y\'imiryango 3 iri na garden',
      type: 'house',
      transactionType: 'sale',
      condition: 'new',
      ownerPrice: 150000000,
      platformPrice: Math.round(150000000 * (1 + PLATFORM_FEE_PERCENT / 100)),
      currency: 'RWF',
      area: 'Kicukiro',
      location: 'Kicukiro, Kigali',
      locationRw: 'Kicukiro, Kigali',
      city: 'Kigali',
      address: 'KG 123 St',
      contactPhone: '+250788000000',
      contactEmail: 'owner@test.com',
      upi: 'owner@upi',
      images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
      videos: [],
      owner: owner._id,
      paymentStatus: 'completed',
      isPublished: true,
      isActive: true
    },
    {
      title: 'Apartment for Rent in Nyarugenge',
      titleRw: 'Apatemente yo kwishyura mu Nyarugenge',
      description: '2 bedroom apartment near city center',
      descriptionRw: 'Apatemente y\'imiryango 2 hafi y\'isoko',
      type: 'house',
      transactionType: 'rent',
      condition: 'used',
      ownerPrice: 500000,
      platformPrice: Math.round(500000 * (1 + PLATFORM_FEE_PERCENT / 100)),
      currency: 'RWF',
      area: 'Nyarugenge',
      location: 'Nyarugenge, Kigali',
      locationRw: 'Nyarugenge, Kigali',
      city: 'Kigali',
      address: 'KN 456 Ave',
      contactPhone: '+250788000000',
      contactEmail: 'owner@test.com',
      upi: 'owner@upi',
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
      videos: [],
      owner: owner._id,
      paymentStatus: 'completed',
      isPublished: true,
      isActive: true
    },
    {
      title: 'Commercial Plot in Gasabo',
      titleRw: 'Ibice byo gufata kimomo mu Gasabo',
      description: 'Prime commercial land for development',
      descriptionRw: 'Ibice byiza byo kwubaka ibirimo byo gukorera',
      type: 'plot',
      transactionType: 'sale',
      condition: 'new',
      ownerPrice: 80000000,
      platformPrice: Math.round(80000000 * (1 + PLATFORM_FEE_PERCENT / 100)),
      currency: 'RWF',
      area: 'Gasabo',
      location: 'Gasabo, Kigali',
      locationRw: 'Gasabo, Kigali',
      city: 'Kigali',
      address: 'KG 789 Blvd',
      contactPhone: '+250788000000',
      contactEmail: 'owner@test.com',
      upi: 'owner@upi',
      images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
      videos: [],
      owner: owner._id,
      paymentStatus: 'completed',
      isPublished: true,
      isActive: true
    }
  ];

  await Property.insertMany(properties);

  // Create jobs
  const jobs = [
    {
      title: 'Software Developer',
      company: 'Tech Rwanda Ltd',
      location: 'Kigali',
      type: 'Full-time',
      category: 'IT',
      description: 'Looking for experienced React/Node developer',
      applyEmail: 'jobs@techrw.com',
      applyUrl: 'https://techrw.com/careers',
      amount: 5000,
      currency: 'RWF',
      paymentStatus: 'paid',
      status: 'approved',
      isPublished: true,
      submittedBy: admin._id
    },
    {
      title: 'Marketing Manager',
      company: 'Rwanda Marketing Group',
      location: 'Kigali',
      type: 'Full-time',
      category: 'Marketing',
      description: 'Lead marketing campaigns for growing startup',
      applyEmail: 'hr@rmg.rw',
      amount: 5000,
      currency: 'RWF',
      paymentStatus: 'paid',
      status: 'approved',
      isPublished: true,
      submittedBy: admin._id
    }
  ];

  await Job.insertMany(jobs);

  // Create ads
  const ads = [
    {
      companyName: 'Bank of Kigali',
      contactName: 'Marketing Team',
      contactEmail: 'marketing@bok.rw',
      contactPhone: '+250788222222',
      title: 'New Savings Account - 12% Interest',
      description: 'Open a savings account today and earn 12% annual interest',
      images: ['https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800'],
      videos: [],
      videoLinks: [],
      targetUrl: 'https://bok.rw/savings',
      plan: 'yearly',
      amount: 500000,
      currency: 'RWF',
      status: 'approved',
      paymentStatus: 'paid',
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    },
    {
      companyName: 'MTN Rwanda',
      contactName: 'Sales Team',
      contactEmail: 'sales@mtn.rw',
      contactPhone: '+250788333333',
      title: '5G Internet - Fast & Affordable',
      description: 'Experience lightning fast 5G internet across Rwanda',
      images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800'],
      videos: [],
      videoLinks: [],
      targetUrl: 'https://mtn.rw/5g',
      plan: 'monthly',
      amount: 50000,
      currency: 'RWF',
      status: 'approved',
      paymentStatus: 'paid',
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  ];

  await Ad.insertMany(ads);

  res.status(200).json({ success: true, message: 'Database seeded successfully' });
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  }
});

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

module.exports = { getAllUsers, getAllProperties, verifyUser, approveProperty, rejectProperty, deleteUser, deleteProperty, seedDatabase };
