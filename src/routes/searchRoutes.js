const express = require('express');
const { searchProperties } = require('../controllers/propertyController');

const router = express.Router();

router.get('/properties', searchProperties);

module.exports = router;
