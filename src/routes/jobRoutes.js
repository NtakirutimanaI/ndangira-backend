const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getPublishedJobs, submitJob, payJob } = require('../controllers/jobController');

const router = express.Router();

router.get('/', getPublishedJobs);
router.post('/request', protect, submitJob);
router.put('/:id/pay', protect, payJob);

module.exports = router;

