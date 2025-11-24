import { body, param, validationResult } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input data',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Sanitize user ID
export const sanitizeUserId = (userId) => {
  if (!userId || typeof userId !== 'string') return 'anonymous';
  // Allow alphanumeric, underscores, hyphens, max 50 chars
  const sanitized = userId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
  return sanitized || 'anonymous';
};

// Common validation chains
export const validateSanityLevel = body('sanityLevel')
  .isNumeric().withMessage('Sanity level must be a number')
  .custom((value) => {
    const num = Number(value);
    if (num < 0 || num > 100) {
      throw new Error('Sanity level must be between 0 and 100');
    }
    return true;
  });

export const validateUserId = body('userId')
  .optional()
  .isString().withMessage('User ID must be a string')
  .isLength({ max: 50 }).withMessage('User ID too long');

// Session validation
export const sessionValidation = [
  validateSanityLevel,
  validateUserId,
  body('preferences').optional().isObject().withMessage('Preferences must be an object')
];

// Snapshot validation
export const snapshotValidation = [
  validateSanityLevel,
  body('timestamp').optional().isISO8601().withMessage('Timestamp must be a valid ISO date')
];

// Sessions list validation
export const sessionsListValidation = [
  param('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer')
];

// Collective data validation
export const collectiveDataValidation = [
  param('limit').optional().isInt({ min: 1, max: 5000 }).withMessage('Limit must be between 1 and 5000'),
  param('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Hours must be between 1 and 168 (1 week)')
];

// Collective average validation
export const collectiveAverageValidation = [
  param('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Hours must be between 1 and 168 (1 week)')
];

// ML validation
export const mlAdvancedValidation = [
  body('userId').isString().withMessage('User ID must be a string').isLength({ max: 50 }).withMessage('User ID too long'),
  body('currentSanity').isNumeric().withMessage('Current sanity must be a number').custom((value) => {
    const num = Number(value);
    if (num < 0 || num > 100) {
      throw new Error('Current sanity must be between 0 and 100');
    }
    return true;
  })
];

export const mlTrendValidation = [
  body('userId').isString().withMessage('User ID must be a string').isLength({ max: 50 }).withMessage('User ID too long')
];
