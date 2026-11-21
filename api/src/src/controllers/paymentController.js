const asyncHandler = require('../utils/asyncHandler');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { notifyPaymentSuccess } = require('../services/notifier');

const initiatePayment = asyncHandler(async (req, res) => {
  const { type, propertyId, method } = req.body;
  const user = await User.findById(req.user.id);

  let amount = 2000;
  if (type === 'unlimited') amount = 10000;
  else if (type === 'per-property') amount = 2000;

  const allowed = ['momo', 'airtel', 'bank', 'card'];
  const paymentMethod = allowed.includes(method) ? method : 'momo';

  const payment = await Payment.create({
    user: req.user.id,
    property: propertyId || null,
    type,
    amount,
    currency: 'RWF',
    method: paymentMethod,
    status: 'pending',
  });

  res.status(201).json({ success: true, data: { paymentId: payment._id, amount: payment.amount, type: payment.type, method: payment.method } });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, status } = req.body;
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }
  if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
    const error = new Error('Not authorized');
    error.statusCode = 401;
    throw error;
  }
  payment.status = status === 'completed' ? 'completed' : 'failed';
  payment.transactionId = `TXN-${Date.now()}`;
  payment.paidAt = new Date();
  await payment.save();

  if (status === 'completed') {
    const user = await User.findById(req.user.id);
    await notifyPaymentSuccess({ user, plan: payment.type, amount: payment.amount });
    if (payment.type === 'unlimited') {
      user.subscriptionType = 'unlimited';
      user.subscriptionActive = true;
      const now = new Date();
      const expiry = new Date(now);
      expiry.setDate(now.getDate() + 30);
      user.subscriptionExpiresAt = expiry;
      await user.save();
    }
  }

  res.status(200).json({ success: true, data: payment });
});

module.exports = { initiatePayment, verifyPayment };
