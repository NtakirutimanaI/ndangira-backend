const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getAllUsers, getAllProperties, verifyUser, approveProperty, rejectProperty, deleteUser, deleteProperty, seedDatabase } = require('../controllers/adminController');
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { getReportSummary, exportReport } = require('../controllers/reportController');
const { getAllJobs, approveJob, rejectJob, unpublishJob, deleteJob } = require('../controllers/adminJobController');
const { getAllAds, updateAd, markAdPaid, approveAd, rejectAd, deactivateAd, deleteAd } = require('../controllers/adminAdController');
const { getSubscribers, toggleSubscriber, deleteSubscriber } = require('../controllers/subscriberController');
const { getSettings, updateSettings, uploadBrandVideo } = require('../controllers/settingsController');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.get('/properties', getAllProperties);
router.put('/users/:id/verify', verifyUser);
router.delete('/users/:id', deleteUser);
router.put('/properties/:id/approve', approveProperty);
router.put('/properties/:id/reject', rejectProperty);
router.delete('/properties/:id', deleteProperty);

router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/jobs', getAllJobs);
router.put('/jobs/:id/approve', approveJob);
router.put('/jobs/:id/reject', rejectJob);
router.put('/jobs/:id/unpublish', unpublishJob);
router.delete('/jobs/:id', deleteJob);

router.get('/ads', getAllAds);
router.put('/ads/:id', updateAd);
router.put('/ads/:id/mark-paid', markAdPaid);
router.put('/ads/:id/approve', approveAd);
router.put('/ads/:id/reject', rejectAd);
router.put('/ads/:id/deactivate', deactivateAd);
router.delete('/ads/:id', deleteAd);

router.get('/subscribers', getSubscribers);
router.put('/subscribers/:id/toggle', toggleSubscriber);
router.delete('/subscribers/:id', deleteSubscriber);

router.get('/reports/summary', getReportSummary);
router.get('/reports/export', exportReport);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/settings/upload-video', upload.single('video'), uploadBrandVideo);

router.post('/seed', seedDatabase);

module.exports = router;
