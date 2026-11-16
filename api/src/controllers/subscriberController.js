const asyncHandler = require('../utils/asyncHandler');
const Subscriber = require('../models/Subscriber');

const subscribe = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    const error = new Error('Valid email is required');
    error.statusCode = 400;
    throw error;
  }
  let sub = await Subscriber.findOne({ email });
  if (sub) {
    if (!sub.isActive) { sub.isActive = true; await sub.save(); }
  } else {
    sub = await Subscriber.create({ email });
  }
  res.status(201).json({ success: true, data: { _id: sub._id, email: sub.email, isActive: sub.isActive, createdAt: sub.createdAt } });
});

const getSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Subscriber.find().sort('-createdAt');
  res.status(200).json({ success: true, count: subscribers.length, data: subscribers });
});

const toggleSubscriber = asyncHandler(async (req, res) => {
  const sub = await Subscriber.findById(req.params.id);
  if (!sub) { const error = new Error('Subscriber not found'); error.statusCode = 404; throw error; }
  sub.isActive = !sub.isActive;
  await sub.save();
  res.status(200).json({ success: true, data: sub });
});

const deleteSubscriber = asyncHandler(async (req, res) => {
  const sub = await Subscriber.findById(req.params.id);
  if (!sub) { const error = new Error('Subscriber not found'); error.statusCode = 404; throw error; }
  await sub.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

module.exports = { subscribe, getSubscribers, toggleSubscriber, deleteSubscriber };
