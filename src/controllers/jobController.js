const asyncHandler = require('../utils/asyncHandler');
const Job = require('../models/Job');

const getPublishedJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ isPublished: true, status: 'approved', paymentStatus: 'paid' }).sort('-createdAt');
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
    amount,
    currency: 'RWF',
    paymentStatus: 'unpaid',
    submittedBy: req.user?._id,
    isPublished: false,
    status: 'pending',
  });
  res.status(201).json({ success: true, data: job, message: 'Job created. Please complete payment, then admin will review and publish.' });
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

module.exports = { getPublishedJobs, submitJob, payJob };
