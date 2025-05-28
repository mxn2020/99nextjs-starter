export * from './base-error';
export * from './http-errors';
export * from './validation-errors';
export * from './database-errors';

// Error type guards
export function isHttpError(error: unknown): error is import('./http-errors').HttpError {
  return error instanceof Error && 'statusCode' in error;
}

export function isValidationError(error: unknown): error is import('./validation-errors').ValidationException {
  return error instanceof Error && 'errors' in error;
}

export function isDatabaseError(error: unknown): error is import('./database-errors').DatabaseError {
  return error instanceof Error && error.constructor.name.includes('DatabaseError');
}