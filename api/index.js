require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const errorHandler = require('./src/utils/errorHandler');

const app = express();

app.use(express.json({ limit: '50mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

let cachedDb = null;

async function connectDB() {
  if (cachedDb) {
    return cachedDb;
  }
  
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      family: 4,
      bufferCommands: false,
    });
    cachedDb = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.get('/', (req, res) => res.json({ message: 'Ndangira API running on Vercel' }));

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/properties', require('./src/routes/propertyRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));
app.use('/api/search', require('./src/routes/searchRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/jobs', require('./src/routes/jobRoutes'));
app.use('/api/ads', require('./src/routes/adRoutes'));
app.use('/api/subscribers', require('./src/routes/subscriberRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));

app.use(errorHandler);

module.exports = app;