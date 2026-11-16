const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { getPublishedJobs, getMyJobs, submitJob, updateJob, payJob } = require('../controllers/jobController');

const router = express.Router();

router.get('/', getPublishedJobs);
router.get('/mine', protect, getMyJobs);
router.post('/request', protect, upload.single('image'), submitJob);
router.put('/:id', protect, upload.single('image'), updateJob);
router.put('/:id/pay', protect, payJob);

module.exports = router;

