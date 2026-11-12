const asyncHandler = require('../utils/asyncHandler');
const Ad = require('../models/Ad');

const getActiveAds = asyncHandler(async (req, res) => {
  const now = new Date();
  const ads = await Ad.find({
    status: 'approved',
    paymentStatus: 'paid',
    isActive: true,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }],
  }).sort('-createdAt');
  res.status(200).json({ success: true, count: ads.length, data: ads });
});

const normalizeLinks = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
  const s = String(val).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
  } catch (_) {}
  return s.split(/[\n,]+/).map((v) => v.trim()).filter(Boolean);
};

const submitAdRequest = asyncHandler(async (req, res) => {
  const { companyName, contactName, contactEmail, contactPhone, title, description, imageUrl, targetUrl, plan, videoLinks } = req.body;
  if (!companyName || !contactName || !contactEmail || !title || !description || !plan) {
    const error = new Error('companyName, contactName, contactEmail, title, description and plan are required');
    error.statusCode = 400;
    throw error;
  }
  if (!['monthly', 'yearly'].includes(plan)) {
    const error = new Error('plan must be monthly or yearly');
    error.statusCode = 400;
    throw error;
  }
  const amount = plan === 'yearly' ? 500000 : 50000;
  const uploaded = (req.files && req.files.images ? req.files.images : []).map((f) => `/uploads/${f.filename}`);
  const images = [...uploaded];
  const legacy = imageUrl ? String(imageUrl).trim() : '';
  if (legacy && !images.includes(legacy)) images.unshift(legacy);
  const links = normalizeLinks(videoLinks);

  const ad = await Ad.create({
    companyName: String(companyName).trim(),
    contactName: String(contactName).trim(),
    contactEmail: String(contactEmail).trim(),
    contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
    title: String(title).trim(),
    description: String(description),
    imageUrl: images[0] || undefined,
    images,
    videoLinks: links,
    targetUrl: targetUrl ? String(targetUrl).trim() : undefined,
    plan,
    amount,
    currency: 'RWF',
    status: 'pending',
    paymentStatus: 'unpaid',
    isActive: false,
  });
  res.status(201).json({ success: true, data: ad, message: 'Advertisement request created. Please complete payment, then admin will review and publish.' });
});

const payAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) { const e = new Error('Advertisement not found'); e.statusCode = 404; throw e; }
  ad.paymentStatus = 'paid';
  await ad.save();
  res.status(200).json({ success: true, data: ad });
});

module.exports = { getActiveAds, submitAdRequest, payAd };
