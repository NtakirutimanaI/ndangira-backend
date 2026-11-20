const asyncHandler = require('../utils/asyncHandler');
const Job = require('../models/Job');

const PLATFORM_FEE_PERCENT = 10;

const getPlatformContact = () => ({
  email: process.env.PLATFORM_EMAIL || 'jobs@isange.com',
});

const getPublishedJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ isPublished: true, status: 'approved', paymentStatus: 'paid' }).sort('-createdAt');
  const platformContact = getPlatformContact();
  
  const publicJobs = jobs.map(j => ({
    ...j.toObject(),
    amount: j.platformAmount,
    applyEmail: j.applyEmail || platformContact.email,
  }));
  
  res.status(200).json({ success: true, count: jobs.length, data: publicJobs });
});

const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ submittedBy: req.user._id }).sort('-createdAt');
  const employerJobs = jobs.map(j => ({
    ...j.toObject(),
    amount: j.platformAmount,
  }));
  res.status(200).json({ success: true, count: jobs.length, data: employerJobs });
});

const submitJob = asyncHandler(async (req, res) => {
  const { title, company, location, type, category, description, applyEmail, applyUrl, employerAmount } = req.body;
  if (!title || !company || !location || !description) {
    const error = new Error('title, company, location and description are required');
    error.statusCode = 400;
    throw error;
  }
  if (!employerAmount || employerAmount <= 0) {
    const error = new Error('Employer amount (your budget) is required and must be greater than 0');
    error.statusCode = 400;
    throw error;
  }
  
  const platformAmount = Math.round(employerAmount * (1 + PLATFORM_FEE_PERCENT / 100));
  const platformContact = getPlatformContact();

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
    employerAmount: Number(employerAmount),
    platformAmount,
    currency: 'RWF',
    platformFeePercent: PLATFORM_FEE_PERCENT,
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
  const { title, company, location, type, category, description, applyEmail, applyUrl, employerAmount } = req.body;
  if (title !== undefined) job.title = String(title).trim();
  if (company !== undefined) job.company = String(company).trim();
  if (location !== undefined) job.location = String(location).trim();
  if (type !== undefined) job.type = type;
  if (category !== undefined) job.category = String(category).trim() || 'General';
  if (description !== undefined) job.description = String(description);
  if (applyEmail !== undefined) job.applyEmail = applyEmail ? String(applyEmail).trim() : undefined;
  if (applyUrl !== undefined) job.applyUrl = applyUrl ? String(applyUrl).trim() : undefined;
  if (req.file) job.image = req.file.path;
  
  // Recalculate platformAmount if employerAmount changed
  if (employerAmount !== undefined) {
    job.employerAmount = Number(employerAmount);
    job.platformAmount = Math.round(job.employerAmount * (1 + PLATFORM_FEE_PERCENT / 100));
  }
  
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