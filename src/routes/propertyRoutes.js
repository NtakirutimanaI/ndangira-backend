const express = require('express');
const { createProperty, getProperties, getProperty, searchProperties, getMyProperties, updateProperty, deleteProperty } = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').get(getProperties).post(protect, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 5 }]), createProperty);
router.route('/search').get(searchProperties);
router.route('/mine').get(protect, getMyProperties);
router.route('/:id').get(getProperty).put(protect, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 5 }]), updateProperty).delete(protect, deleteProperty);

module.exports = router;
