require('dotenv').config();

// Import the full Express app from src/app.js (includes DB connection middleware)
const app = require('./src/app');

module.exports = app;