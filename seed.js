const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8', '1.1.1.1']);

const User = require('./src/models/User');
const Property = require('./src/models/Property');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    await User.deleteMany({});
    await Property.deleteMany({});

    const hash = (pw) => bcrypt.hashSync(pw, 10);

    const admin = await User.create({
      name: 'Admin Ndangira',
      email: 'admin@ndangira.com',
      password: hash('admin123'),
      role: 'admin',
      phone: '+250788000000',
      isVerified: true,
    });

    const owner = await User.create({
      name: 'John Property Owner',
      email: 'owner@ndangira.com',
      password: hash('owner123'),
      role: 'owner',
      phone: '+250788111111',
      address: 'Kigali, Rwanda',
      upi: 'JOHN@MTN',
      isVerified: true,
      subscriptionType: 'unlimited',
      subscriptionActive: true,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const client = await User.create({
      name: 'Jane Client',
      email: 'client@ndangira.com',
      password: hash('client123'),
      role: 'client',
      phone: '+250788222222',
      address: 'Gisenyi, Rwanda',
      upi: 'JANE@AIRTEL',
      isVerified: true,
    });

    await Property.create([
      {
        owner: owner._id,
        title: '3 Bedroom House in Nyarugunga',
        description: 'Spacious family house with 3 bedrooms, 2 bathrooms, and parking.',
        type: 'house',
        category: 'rent',
        price: 500000,
        currency: 'RWF',
        area: 'Nyarugunga',
        city: 'Kigali',
        country: 'Rwanda',
        address: 'KG 123 St, Nyarugunga',
        contactPhone: '+250788111111',
        contactEmail: 'owner@ndangira.com',
        upi: 'JOHN@MTN',
        images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'],
        paymentStatus: 'completed',
        isPublished: true,
        isActive: true,
      },
      {
        owner: owner._id,
        title: 'Plot for Sale in Kimironko',
        description: 'Residential plot 500sqm in prime location near market.',
        type: 'plot',
        category: 'sale',
        price: 15000000,
        currency: 'RWF',
        area: 'Kimironko',
        city: 'Kigali',
        country: 'Rwanda',
        address: 'Plot #45, Kimironko',
        contactPhone: '+250788111111',
        contactEmail: 'owner@ndangira.com',
        upi: 'JOHN@MTN',
        images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
        paymentStatus: 'completed',
        isPublished: true,
        isActive: true,
      },
      {
        owner: owner._id,
        title: 'Car for Rent - Toyota Premio',
        description: '2015 Toyota Premio, excellent condition, fuel efficient.',
        type: 'car',
        category: 'rent',
        price: 30000,
        currency: 'RWF',
        area: 'Kacyiru',
        city: 'Kigali',
        country: 'Rwanda',
        address: 'Kacyiru, Kigali',
        contactPhone: '+250788111111',
        contactEmail: 'owner@ndangira.com',
        upi: 'JOHN@MTN',
        images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'],
        paymentStatus: 'completed',
        isPublished: true,
        isActive: true,
      },
      {
        owner: owner._id,
        title: 'Pending Approval House',
        description: 'Nice house awaiting admin approval.',
        type: 'house',
        category: 'rent',
        price: 400000,
        currency: 'RWF',
        area: 'Gasabo',
        city: 'Kigali',
        country: 'Rwanda',
        address: 'Gasabo, Kigali',
        contactPhone: '+250788111111',
        contactEmail: 'owner@ndangira.com',
        upi: 'JOHN@MTN',
        images: [],
        paymentStatus: 'completed',
        isPublished: false,
        isActive: true,
      },
    ]);

    console.log('Seed data created successfully!');
    console.log('Admin: admin@ndangira.com / admin123');
    console.log('Owner: owner@ndangira.com / owner123');
    console.log('Client: client@ndangira.com / client123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();
