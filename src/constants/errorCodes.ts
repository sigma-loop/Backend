/**
 * Standardized error codes for consistent API error responses.
 * Use with the JSend error() helper: error(message, ERROR_CODE)
 */

// Auth
export const UNAUTHORIZED = 'UNAUTHORIZED'
export const FORBIDDEN = 'FORBIDDEN'
export const INVALID_CREDENTIALS = 'INVALID_CREDENTIALS'
export const TOKEN_EXPIRED = 'TOKEN_EXPIRED'

// Validation
export const VALIDATION_ERROR = 'VALIDATION_ERROR'
export const MISSING_FIELD = 'MISSING_FIELD'
export const INVALID_FORMAT = 'INVALID_FORMAT'

// Resources
export const NOT_FOUND = 'NOT_FOUND'
export const ALREADY_EXISTS = 'ALREADY_EXISTS'
export const CONFLICT = 'CONFLICT'

// Execution
export const EXECUTION_ERROR = 'EXECUTION_ERROR'
export const EXECUTION_TIMEOUT = 'EXECUTION_TIMEOUT'
export const UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE'

// Server
export const INTERNAL_ERROR = 'INTERNAL_ERROR'
export const SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
export const RATE_LIMITED = 'RATE_LIMITED'
