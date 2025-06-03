import { body, param, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// User registration validation
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  handleValidationErrors
];

// User login validation
export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Object validation
export const validateObject = [
  body('id')
    .notEmpty()
    .withMessage('Object ID is required')
    .isLength({ max: 255 })
    .withMessage('Object ID must not exceed 255 characters'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  handleValidationErrors
];

// Object ID parameter validation
export const validateObjectId = [
  param('id')
    .notEmpty()
    .withMessage('Object ID is required')
    .isLength({ max: 255 })
    .withMessage('Object ID must not exceed 255 characters'),
  handleValidationErrors
];

// Week object validation
export const validateWeekObject = [
  body('id')
    .notEmpty()
    .withMessage('Scheduled item ID is required')
    .isLength({ max: 255 })
    .withMessage('Scheduled item ID must not exceed 255 characters'),
  body('data')
    .isObject()
    .withMessage('Data must be an object'),
  body('data.id')
    .notEmpty()
    .withMessage('Object ID in data is required'),
  body('data.title')
    .notEmpty()
    .withMessage('Object title in data is required'),
  body('timeSlot')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time slot must be in HH:MM format'),
  body('dayOfWeek')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 and 6'),
  handleValidationErrors
];

// Bulk sync validation
export const validateBulkSync = [
  body('objects')
    .optional()
    .isArray()
    .withMessage('Objects must be an array'),
  body('scheduledItems')
    .optional()
    .isArray()
    .withMessage('Scheduled items must be an array'),
  handleValidationErrors
];

// Sanitize user input
export const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  next();
}; 