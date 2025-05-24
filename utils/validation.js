const { body, query, param } = require('express-validator');

// User validation
exports.signupValidation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional()
    .matches(/^[+]?[1-9]\d{1,14}$/)
    .withMessage('Please enter a valid phone number')
];

exports.loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

exports.updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('phone')
    .optional()
    .matches(/^[+]?[1-9]\d{1,14}$/)
    .withMessage('Please enter a valid phone number')
];

// Pet validation
exports.createPetValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Pet name cannot be empty'),
  body('breed')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Breed cannot be empty')
];

exports.updatePetValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Pet name cannot be empty'),
  body('breed')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Breed cannot be empty')
];

// Report validation
exports.createReportValidation = [
  body('pet')
    .isMongoId()
    .withMessage('Valid pet ID is required'),
  body('status')
    .isIn(['lost', 'found'])
    .withMessage('Status must be either lost or found'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of [longitude, latitude]'),
  body('location.coordinates.*')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Coordinates must be valid numbers')
];

exports.updateReportValidation = [
  body('status')
    .optional()
    .isIn(['lost', 'found'])
    .withMessage('Status must be either lost or found'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
];

// Query validation
exports.paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

exports.geospatialValidation = [
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Radius must be a positive integer')
];

// ID validation
exports.mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];