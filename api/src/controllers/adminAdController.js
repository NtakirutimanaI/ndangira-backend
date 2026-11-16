const asyncHandler = require('../utils/asyncHandler');
const Ad = require('../models/Ad');
const { notifySubscribersNewAd } = require('../services/notifier');

const getAllAds = asyncHandler(async (req, res) => {
  const ads = await Ad.find().sort('-createdAt').populate('reviewedBy', 'name email');
  res.status(200).json({ success: true, count: ads.length, data: ads });
});

const updateAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) { const e = new Error('Advertisement not found'); e.statusCode = 404; throw e; }
  const fields = ['companyName','contactName','contactEmail','contactPhone','title','description','imageUrl','targetUrl','plan','amount','currency','rejectionReason'];
  fields.forEach((f) => { if (req.body[f] !== undefined) ad[f] = req.body[f]; });
  if (req.body.videoLinks !== undefined) {
    const v = req.body.videoLinks;
    ad.videoLinks = Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : String(v).split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
  }
  if (req.body.images !== undefined) {
    const im = req.body.images;
    ad.images = Array.isArray(im) ? im.map((x) => String(x).trim()).filter(Boolean) : [];
    if (ad.images.length && !ad.imageUrl) ad.imageUrl = ad.images[0];
  }
  if (req.body.plan && ['monthly','yearly'].includes(req.body.plan)) ad.plan = req.body.plan;
  await ad.save();
  res.status(200).json({ success: true, data: ad });
});

const markAdPaid = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) { const e = new Error('Advertisement not found'); e.statusCode = 404; throw e; }
  ad.paymentStatus = 'paid';
  ad.reviewedBy = req.user._id;
  ad.reviewedAt = new Date();
  await ad.save();
  res.status(200).json({ success: true, data: ad });
});

const approveAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) { const e = new Error('Advertisement not found'); e.statusCode = 404; throw e; }
  if (ad.paymentStatus !== 'paid') {
    const e = new Error('Payment must be confirmed before approving/activating this advertisement');
    e.statusCode = 400;
    throw e;
  }
  const wasActive = ad.isActive && ad.status === 'approved';
  const now = new Date();
  const months = ad.plan === 'yearly' ? 12 : 1;
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + months);
  ad.status = 'approved';
  ad.isActive = true;
  ad.startsAt = ad.startsAt || now;
  ad.expiresAt = expires;
  ad.reviewedBy = req.user._id;
  ad.reviewedAt = now;
  ad.rejectionReason = undefined;
  await ad.save();
  if (!wasActive) {
    try { await notifySubscribersNewAd({ ad }); } catch (e) { console.error('notifySubscribersNewAd error:', e.message || e); }
  }
  res.status(200).json({ success: true, data: ad });
});

const rejectAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) { const e = new Error('Advertisement not found'); e.statusCode = 404; throw e; }
  ad.status = 'rejected';
  ad.isActive = false;
  ad.reviewedBy = req.user._id;
  ad.reviewedAt = new Date();
  ad.rejectionReason = req.body.reason ? String(req.body.reason).trim() : undefined;
  await ad.save();
  res.status(200).json({ success: true, data: ad });
});

const deactivateAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) { const e = new Error('Advertisement not found'); e.statusCode = 404; throw e; }
  ad.isActive = false;
  ad.reviewedBy = req.user._id;
  ad.reviewedAt = new Date();
  await ad.save();
  res.status(200).json({ success: true, data: ad });
});

const deleteAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) { const e = new Error('Advertisement not found'); e.statusCode = 404; throw e; }
  await Ad.deleteOne({ _id: ad._id });
  res.status(200).json({ success: true, data: {} });
});

module.exports = { getAllAds, updateAd, markAdPaid, approveAd, rejectAd, deactivateAd, deleteAd };
