require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const app = express();

app.use(express.json({ limit: '50mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// CORS: allow localhost for dev, and the production frontend URL
const allowedOrigins = [
  'http://localhost:5173',
  'https://ndangira-frontend-seven.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Inline error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, error: message });
});

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

// Serve uploads with CORS headers for cross-origin video playback
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => res.json({ message: 'Isange API running on Vercel' }));

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

// Public settings endpoint (no auth required)
app.get('/api/settings', require('./src/controllers/settingsController').getSettings);

module.exports = app;