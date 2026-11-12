const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8', '1.1.1.1']);

const User = require('./src/models/User');

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4,
    });
    console.log('Connected to MongoDB Atlas');

    const user = await User.findOne({ email: 'owner@ndangira.com' }).select('+password');
    if (!user) {
      console.log('User NOT found');
      process.exit(1);
    }

    console.log('User found:', user.email, 'role:', user.role);
    console.log('Password hash exists:', !!user.password);

    const isMatch = await bcrypt.compare('owner123', user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Testing with wrong hash - rehashing...');
      const newHash = await bcrypt.hash('owner123', 10);
      user.password = newHash;
      await user.save();
      console.log('Password reset to owner123');
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

testLogin();
