const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { getPublishedJobs, getMyJobs, submitJob, updateJob, payJob } = require('../controllers/jobController');
const { jobValidation, idParamValidation, paginationValidation } = require('../middleware/validation');

const router = express.Router();

router.get('/', paginationValidation, getPublishedJobs);
router.get('/mine', protect, paginationValidation, getMyJobs);
router.post('/request', protect, upload.single('image'), jobValidation, submitJob);
router.put('/:id', protect, upload.single('image'), idParamValidation, jobValidation, updateJob);
router.put('/:id/pay', protect, idParamValidation, payJob);

module.exports = router;

