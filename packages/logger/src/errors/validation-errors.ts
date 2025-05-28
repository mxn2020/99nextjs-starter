import { BaseError } from './base-error';
import { ErrorOptions } from '../types/error-types';
import { ValidationError } from '../types/api-types';

export class ValidationException extends BaseError {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[], options?: ErrorOptions) {
    const message = `Validation failed: ${errors.map(e => e.message).join(', ')}`;
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      ...options,
      context: {
        ...options?.context,
        errors,
      },
    });
    this.errors = errors;
  }
}

export class RequiredFieldError extends ValidationException {
  constructor(field: string, options?: ErrorOptions) {
    super([{
      field,
      message: `${field} is required`,
      code: 'REQUIRED_FIELD',
    }], options);
  }
}

export class InvalidFormatError extends ValidationException {
  constructor(field: string, expectedFormat: string, options?: ErrorOptions) {
    super([{
      field,
      message: `${field} must be in ${expectedFormat} format`,
      code: 'INVALID_FORMAT',
    }], options);
  }
}

export class OutOfRangeError extends ValidationException {
  constructor(field: string, min?: number, max?: number, options?: ErrorOptions) {
    const message = min !== undefined && max !== undefined
      ? `${field} must be between ${min} and ${max}`
      : min !== undefined
      ? `${field} must be at least ${min}`
      : `${field} must be at most ${max}`;
    
    super([{
      field,
      message,
      code: 'OUT_OF_RANGE',
    }], options);
  }
}