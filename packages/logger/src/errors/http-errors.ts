import { BaseError } from './base-error';
import { ErrorOptions } from '../types/error-types';

export class HttpError extends BaseError {
  constructor(message: string, statusCode: number, options?: ErrorOptions) {
    super(message, { ...options, statusCode });
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request', options?: ErrorOptions) {
    super(message, 400, { code: 'BAD_REQUEST', ...options });
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', options?: ErrorOptions) {
    super(message, 401, { code: 'UNAUTHORIZED', ...options });
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', options?: ErrorOptions) {
    super(message, 403, { code: 'FORBIDDEN', ...options });
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found', options?: ErrorOptions) {
    super(message, 404, { code: 'NOT_FOUND', ...options });
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict', options?: ErrorOptions) {
    super(message, 409, { code: 'CONFLICT', ...options });
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = 'Too Many Requests', options?: ErrorOptions) {
    super(message, 429, { code: 'TOO_MANY_REQUESTS', ...options });
  }
}

export class InternalServerError extends HttpError {
  constructor(message = 'Internal Server Error', options?: ErrorOptions) {
    super(message, 500, { code: 'INTERNAL_SERVER_ERROR', ...options });
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message = 'Service Unavailable', options?: ErrorOptions) {
    super(message, 503, { code: 'SERVICE_UNAVAILABLE', ...options });
  }
}