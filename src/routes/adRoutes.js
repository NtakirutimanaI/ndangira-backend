const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { getActiveAds, submitAdRequest, payAd } = require('../controllers/adController');

const router = express.Router();

router.get('/', getActiveAds);
router.post('/request', protect, upload.fields([{ name: 'images', maxCount: 10 }]), submitAdRequest);
router.put('/:id/pay', protect, payAd);

module.exports = router;

