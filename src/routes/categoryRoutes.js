const express = require('express');
const { getPublishedCategories } = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getPublishedCategories);

module.exports = router;
