const asyncHandler = require('../utils/asyncHandler');

const requireActiveSubscription = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    const e = new Error('Not authorized'); e.statusCode = 401; throw e;
  }
  if (req.user.role === 'admin') return next();
  const active = !!req.user.subscriptionActive;
  const notExpired = !req.user.subscriptionExpiresAt || new Date(req.user.subscriptionExpiresAt) >= new Date();
  if (active && notExpired) return next();
  const e = new Error('Active subscription/payment required to submit this request');
  e.statusCode = 403;
  throw e;
});

module.exports = { requireActiveSubscription };
