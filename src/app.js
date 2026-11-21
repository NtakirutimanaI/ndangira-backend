const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorMiddleware = require('./middleware/errorMiddleware');
const mongoose = require('mongoose');

const app = express();

// Actual production frontend URL - ensure CORS works even if env var is wrong
const PRODUCTION_FRONTEND_URL = 'https://ndangira-frontend-seven.vercel.app';

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

// Ensure DB connection on EVERY request - runs BEFORE any routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    const origin = req.headers.origin;
    const allowedOrigins = [
      PRODUCTION_FRONTEND_URL,
      'http://localhost:5173'
    ];
    
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', PRODUCTION_FRONTEND_URL);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "https:", "blob:", "data:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", PRODUCTION_FRONTEND_URL, 'http://localhost:5173'],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Serve uploads with CORS headers for cross-origin video playback
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  const origin = req.headers.origin;
  const allowed = [PRODUCTION_FRONTEND_URL, 'http://localhost:5173'];
  if (allowed.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', PRODUCTION_FRONTEND_URL);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// Apply rate limiting
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/payments', apiLimiter);
app.use('/api/properties', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) return uploadLimiter(req, res, next);
  next();
});
app.use('/api/jobs', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) return uploadLimiter(req, res, next);
  next();
});
app.use('/api/ads', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) return uploadLimiter(req, res, next);
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/ads', require('./routes/adRoutes'));
app.use('/api/subscribers', require('./routes/subscriberRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Public settings endpoint (no auth required)
app.get('/api/settings', require('./controllers/settingsController').getSettings);

app.get('/api/test-simple', (req, res) => {
  res.json({ success: true, message: 'Simple test route works' });
});

app.use(errorMiddleware);

module.exports = app;
