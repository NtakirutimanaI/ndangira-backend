const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8', '1.1.1.1']);

const User = require('./src/models/User');

const fixPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4,
    });
    console.log('Connected to MongoDB Atlas');

    // Hash passwords WITHOUT triggering the pre-save middleware
    // Use collection.updateOne directly to bypass Mongoose hooks
    const salt = await bcrypt.genSalt(10);
    const ownerHash = await bcrypt.hash('owner123', salt);
    const adminHash = await bcrypt.hash('admin123', salt);
    const clientHash = await bcrypt.hash('client123', salt);

    // Direct MongoDB update to bypass pre-save middleware
    const mongooseConnection = mongoose.connection;
    const db = mongooseConnection.db;
    const usersCollection = db.collection('users');

    const ownerResult = await usersCollection.updateOne(
      { email: 'owner@ndangira.com' },
      { $set: { password: ownerHash } }
    );
    console.log('Owner updated:', ownerResult.matchedCount, 'matched,', ownerResult.modifiedCount, 'modified');

    const adminResult = await usersCollection.updateOne(
      { email: 'admin@ndangira.com' },
      { $set: { password: adminHash } }
    );
    console.log('Admin updated:', adminResult.matchedCount, 'matched,', adminResult.modifiedCount, 'modified');

    const clientResult = await usersCollection.updateOne(
      { email: 'client@ndangira.com' },
      { $set: { password: clientHash } }
    );
    console.log('Client updated:', clientResult.matchedCount, 'matched,', clientResult.modifiedCount, 'modified');

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

fixPasswords();
