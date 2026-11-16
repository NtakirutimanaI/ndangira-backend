const asyncHandler = require('../utils/asyncHandler');
const Job = require('../models/Job');

const getPublishedJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ isPublished: true, status: 'approved', paymentStatus: 'paid' }).sort('-createdAt');
  res.status(200).json({ success: true, count: jobs.length, data: jobs });
});

const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ submittedBy: req.user._id }).sort('-createdAt');
  res.status(200).json({ success: true, count: jobs.length, data: jobs });
});

const submitJob = asyncHandler(async (req, res) => {
  const { title, company, location, type, category, description, applyEmail, applyUrl } = req.body;
  if (!title || !company || !location || !description) {
    const error = new Error('title, company, location and description are required');
    error.statusCode = 400;
    throw error;
  }
  const amount = 5000;
  const job = await Job.create({
    title: String(title).trim(),
    company: String(company).trim(),
    location: String(location).trim(),
    type: type || 'Full-time',
    category: category ? String(category).trim() : 'General',
    description: String(description),
    applyEmail: applyEmail ? String(applyEmail).trim() : undefined,
    applyUrl: applyUrl ? String(applyUrl).trim() : undefined,
    image: req.file ? req.file.path : undefined,
    amount,
    currency: 'RWF',
    paymentStatus: 'unpaid',
    submittedBy: req.user?._id,
    isPublished: false,
    status: 'pending',
  });
  res.status(201).json({ success: true, data: job, message: 'Job created. Please complete payment, then admin will review and publish.' });
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) { const e = new Error('Job not found'); e.statusCode = 404; throw e; }
  if (!req.user || (String(job.submittedBy) !== String(req.user._id) && req.user.role !== 'admin')) {
    const e = new Error('Not authorized'); e.statusCode = 403; throw e;
  }
  const { title, company, location, type, category, description, applyEmail, applyUrl } = req.body;
  if (title !== undefined) job.title = String(title).trim();
  if (company !== undefined) job.company = String(company).trim();
  if (location !== undefined) job.location = String(location).trim();
  if (type !== undefined) job.type = type;
  if (category !== undefined) job.category = String(category).trim() || 'General';
  if (description !== undefined) job.description = String(description);
  if (applyEmail !== undefined) job.applyEmail = applyEmail ? String(applyEmail).trim() : undefined;
  if (applyUrl !== undefined) job.applyUrl = applyUrl ? String(applyUrl).trim() : undefined;
  if (req.file) job.image = req.file.path;
  // Re-submit for review after edit (keep payment status)
  job.status = 'pending';
  job.isPublished = false;
  job.reviewedBy = undefined;
  job.reviewedAt = undefined;
  job.rejectionReason = undefined;
  await job.save();
  res.status(200).json({ success: true, data: job });
});

const payJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) { const e = new Error('Job not found'); e.statusCode = 404; throw e; }
  if (!req.user || (String(job.submittedBy) !== String(req.user._id) && req.user.role !== 'admin')) {
    const e = new Error('Not authorized'); e.statusCode = 403; throw e;
  }
  job.paymentStatus = 'paid';
  await job.save();
  res.status(200).json({ success: true, data: job });
});

module.exports = { getPublishedJobs, getMyJobs, submitJob, updateJob, payJob };
