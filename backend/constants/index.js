// App constants
export const PORT = process.env.PORT || 3001;
export const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001/api';

// Security constants
export const MAX_SANITY_LEVEL = 100;
export const MIN_SANITY_LEVEL = 0;

// Default values
export const DEFAULT_LIMIT = 50;
export const DEFAULT_HOURS_BACK = 24;
export const DEFAULT_LIMIT_COLLECTIVE = 1000;

// Messages
export const ERROR_MESSAGES = {
  INVALID_SANITY: 'Sanity level must be a number between 0 and 100',
  USER_ID_TOO_LONG: 'User ID too long (max 50 characters)',
  TIMESTAMP_INVALID: 'Timestamp must be a valid ISO date',
  NOT_ENOUGH_DATA: 'Not enough data for analysis',
  ML_UNAVAILABLE: 'Our AI is taking a sanity break. Please try again!',
  GENERIC_ERROR: 'Oops! Something went wrong. Please try again!',
  CORS_DENIED: 'Access denied. This origin is not allowed.',
  UNEXPECTED_ERROR: 'Something unexpected happened! Our team has been notified.'
};
