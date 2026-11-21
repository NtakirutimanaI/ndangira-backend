require('dotenv').config();
const mongoose = require('mongoose');

// Disable Mongoose buffering globally - critical for serverless
mongoose.set('bufferCommands', false);

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

// Connect to DB BEFORE importing app (so models don't buffer)
// Use IIFE to handle async at top level in CommonJS
(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Initial DB connection failed:', err.message);
  }
})();

// Import the full Express app from src/app.js
const app = require('./src/app');

// Ensure DB connection on each request (reconnect if needed)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://ndangira-frontend-seven.vercel.app',
      'http://localhost:5173'
    ];
    
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