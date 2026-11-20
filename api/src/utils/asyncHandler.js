const asyncHandler = (fn) => (req, res, next) => {
  console.log('asyncHandler wrapper called for:', fn.name || 'anonymous');
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
