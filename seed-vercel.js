require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Property = require('./src/models/Property');
const Job = require('./src/models/Job');
const Ad = require('./src/models/Ad');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Property.deleteMany({});
    await Job.deleteMany({});
    await Ad.deleteMany({});
    console.log('Cleared existing data');

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

    console.log('Created users');

    // Create properties
    const properties = [
      {
        title: 'Modern House in Kigali',
        titleRw: 'Inzu mageze mu Kigali',
        description: 'Beautiful 3 bedroom house with garden',
        descriptionRw: 'Inzu nziza y\'imiryango 3 iri na garden',
        type: 'house',
        category: 'sale',
        price: 150000000,
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
        category: 'rent',
        price: 500000,
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
        category: 'sale',
        price: 80000000,
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
    console.log('Created properties');

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
    console.log('Created jobs');

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
    console.log('Created ads');

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();