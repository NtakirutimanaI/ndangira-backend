require('dotenv').config();
const mongoose = require('mongoose');

// Disable Mongoose buffering globally - critical for serverless
mongoose.set('bufferCommands', false);

// MongoDB connection caching for serverless
let cachedDb = null;
let connectionPromise = null;

async function connectDB() {
  if (cachedDb) {
    return cachedDb;
  }
  
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      family: 4,
      bufferCommands: false,
    }).then(conn => {
      cachedDb = conn;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }).catch(err => {
      connectionPromise = null;
      console.error(`MongoDB connection error: ${err.message}`);
      throw err;
    });
  }
  
  return connectionPromise;
}

// CRITICAL: Connect to DB synchronously at module load BEFORE importing app
// This blocks until DB is ready, preventing "bufferCommands = false" errors
try {
  require('await-to-js'); // just to ensure we can use top-level await pattern
} catch (_) {}

// Use promise-based connection that resolves before module exports
const dbReady = connectDB();

// Import the full Express app from src/app.js
const app = require('./src/app');

// Ensure DB connection on each request (reconnect if needed)
app.use(async (req, res, next) => {
  try {
    await dbReady; // wait for initial connection
    await connectDB(); // ensure still connected
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