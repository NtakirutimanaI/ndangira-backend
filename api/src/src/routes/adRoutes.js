const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { getActiveAds, submitAdRequest, payAd } = require('../controllers/adController');
const { adValidation, idParamValidation, paginationValidation } = require('../middleware/validation');

const router = express.Router();

router.get('/', paginationValidation, getActiveAds);
router.post('/request', protect, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'videos', maxCount: 5 }]), adValidation, submitAdRequest);
router.put('/:id/pay', protect, idParamValidation, payAd);

module.exports = router;

