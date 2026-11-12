const asyncHandler = require('../utils/asyncHandler');
const Job = require('../models/Job');

const getAllJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find().sort('-createdAt').populate('submittedBy', 'name email').populate('reviewedBy', 'name email');
  res.status(200).json({ success: true, count: jobs.length, data: jobs });
});

const approveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }
  if (job.paymentStatus !== 'paid') {
    const error = new Error('Payment must be confirmed before approving this job');
    error.statusCode = 400;
    throw error;
  }
  job.status = 'approved';
  job.isPublished = true;
  job.reviewedBy = req.user._id;
  job.reviewedAt = new Date();
  job.rejectionReason = undefined;
  await job.save();
  res.status(200).json({ success: true, data: job });
});

const rejectJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }
  job.status = 'rejected';
  job.isPublished = false;
  job.reviewedBy = req.user._id;
  job.reviewedAt = new Date();
  job.rejectionReason = req.body.reason ? String(req.body.reason).trim() : undefined;
  await job.save();
  res.status(200).json({ success: true, data: job });
});

const unpublishJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }
  job.isPublished = false;
  job.status = job.status === 'approved' ? 'pending' : job.status;
  job.reviewedBy = req.user._id;
  job.reviewedAt = new Date();
  await job.save();
  res.status(200).json({ success: true, data: job });
});

const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }
  await Job.deleteOne({ _id: job._id });
  res.status(200).json({ success: true, data: {} });
});

module.exports = { getAllJobs, approveJob, rejectJob, unpublishJob, deleteJob };
