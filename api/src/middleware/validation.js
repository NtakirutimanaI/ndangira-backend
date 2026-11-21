const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array().map(e => e.msg).join(', '));
    error.statusCode = 400;
    throw error;
  }
  next();
};

// Auth validation
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim().isMobilePhone('any').withMessage('Invalid phone number'),
  body('role').optional().isIn(['owner', 'client']).withMessage('Invalid role'),
  validate,
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// Property validation
const propertyValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('type').optional().isIn(['house', 'car', 'plot', 'material']).withMessage('Invalid type'),
  body('transactionType').optional().isIn(['sale', 'rent']).withMessage('Invalid transaction type'),
  body('condition').optional().isIn(['new', 'used']).withMessage('Invalid condition'),
  body('ownerPrice').isNumeric().withMessage('Owner price must be a number').custom(v => v > 0).withMessage('Price must be greater than 0'),
  body('area').trim().notEmpty().withMessage('Area is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('contactPhone').optional().trim().isMobilePhone('any').withMessage('Invalid phone number'),
  body('contactEmail').optional().isEmail().withMessage('Invalid email').normalizeEmail(),
  validate,
];

// Job validation
const jobValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('company').trim().notEmpty().withMessage('Company is required').isLength({ max: 100 }),
  body('location').trim().notEmpty().withMessage('Location is required').isLength({ max: 100 }),
  body('type').optional().isIn(['Full-time', 'Part-time', 'Contract', 'Internship']).withMessage('Invalid job type'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('employerAmount').isNumeric().withMessage('Amount must be a number').custom(v => v > 0).withMessage('Amount must be greater than 0'),
  body('applyEmail').optional().isEmail().withMessage('Invalid email').normalizeEmail(),
  body('applyUrl').optional().isURL().withMessage('Invalid URL'),
  validate,
];

// Ad validation
const adValidation = [
  body('companyName').trim().notEmpty().withMessage('Company name is required').isLength({ max: 100 }),
  body('contactName').trim().notEmpty().withMessage('Contact name is required').isLength({ max: 100 }),
  body('contactEmail').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('contactPhone').optional().trim().isMobilePhone('any').withMessage('Invalid phone number'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('plan').optional().isIn(['monthly', 'yearly', 'custom']).withMessage('Invalid plan'),
  body('targetUrl').optional().isURL().withMessage('Invalid URL'),
  validate,
];

// ID param validation
const idParamValidation = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validate,
];

// Pagination validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  propertyValidation,
  jobValidation,
  adValidation,
  idParamValidation,
  paginationValidation,
};