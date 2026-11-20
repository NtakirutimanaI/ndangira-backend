const express = require('express');
const { createProperty, getProperties, getProperty, searchProperties, getMyProperties, updateProperty, deleteProperty } = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { propertyValidation, idParamValidation, paginationValidation } = require('../middleware/validation');

const router = express.Router();

router.route('/').get(paginationValidation, getProperties).post(protect, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 5 }]), propertyValidation, createProperty);
router.route('/search').get(paginationValidation, searchProperties);
router.route('/mine').get(protect, paginationValidation, getMyProperties);
router.route('/:id').get(idParamValidation, getProperty).put(protect, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 5 }]), propertyValidation, updateProperty).delete(protect, idParamValidation, deleteProperty);

module.exports = router;
