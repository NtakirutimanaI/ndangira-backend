const ErrorResponse = require('../utils/errorHandler');

const errorMiddleware = (err, req, res, next) => {
  console.error('Error middleware received:', err);
  console.error('Error constructor:', err?.constructor?.name);
  console.error('Error is ErrorResponse class:', err === ErrorResponse);
  let error = { ...err };
  error.message = err.message;
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

module.exports = errorMiddleware;
