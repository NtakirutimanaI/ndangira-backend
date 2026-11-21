require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');

// Import the full Express app from src/app.js
const app = require('./src/app');

// MongoDB connection caching for serverless
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

// Ensure DB connection on each request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://ndangira-frontend-seven.vercel.app',
      'http://localhost:5173',
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', 'https://ndangira-frontend-seven.vercel.app');
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ error: 'Database connection failed' });
  }
});

module.exports = app;