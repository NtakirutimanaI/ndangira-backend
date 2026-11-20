const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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

app.get('/api/test-simple', (req, res) => {
  res.json({ success: true, message: 'Simple test route works' });
});

app.use(errorMiddleware);

module.exports = app;
