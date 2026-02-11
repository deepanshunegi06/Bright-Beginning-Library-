/**
 * Application-wide constants
 */

// Time and Date
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Validation
export const PHONE_REGEX = /^\d{10}$/;
export const PHONE_LENGTH = 10;

// File Upload
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const IMAGE_COMPRESSION_QUALITY = 0.7;
export const MAX_IMAGE_DIMENSION = 1200;

// Pagination
export const DEFAULT_PAGE_SIZE = 15;
export const DEFAULT_PAGE = 1;

// Payment
export const PAYMENT_DURATIONS = [1, 3] as const;
export const DAYS_BEFORE_EXPIRY_WARNING = 5;

// Cache
export const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
} as const;

// Session
export const ADMIN_SESSION_KEY = 'admin';
export const AUTO_REFRESH_INTERVAL_MS = 120000; // 2 minutes

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_PHONE: 'Phone number must be 10 digits',
  PHONE_EXISTS: 'Phone number already registered',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INTERNAL_ERROR: 'Internal server error',
  NETWORK_ERROR: 'Failed to connect to server',
  INVALID_IMAGE_TYPE: 'Only JPEG, PNG, or WebP images are allowed',
  IMAGE_TOO_LARGE: `File size must be less than ${MAX_IMAGE_SIZE_MB}MB`,
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  USER_ADDED: 'User added successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  PAYMENT_ADDED: 'Payment added successfully',
  AADHAAR_UPLOADED: 'Aadhaar card uploaded successfully',
  AADHAAR_DELETED: 'Aadhaar card deleted successfully',
} as const;

// Date Format Options
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
} as const;

export const DATETIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
} as const;

// Locale
export const DEFAULT_LOCALE = 'en-IN';
