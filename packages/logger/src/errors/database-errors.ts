import { BaseError } from './base-error';
import { ErrorOptions } from '../types/error-types';

export class DatabaseError extends BaseError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      code: 'DATABASE_ERROR',
      statusCode: 500,
      isOperational: false,
      ...options,
    });
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message = 'Database connection failed', options?: ErrorOptions) {
    super(message, { code: 'CONNECTION_ERROR', ...options });
  }
}

export class QueryError extends DatabaseError {
  constructor(message = 'Database query failed', options?: ErrorOptions) {
    super(message, { code: 'QUERY_ERROR', ...options });
  }
}

export class TransactionError extends DatabaseError {
  constructor(message = 'Database transaction failed', options?: ErrorOptions) {
    super(message, { code: 'TRANSACTION_ERROR', ...options });
  }
}

export class DuplicateKeyError extends DatabaseError {
  constructor(field: string, options?: ErrorOptions) {
    super(`Duplicate value for field: ${field}`, {
      code: 'DUPLICATE_KEY',
      statusCode: 409,
      context: { field },
      ...options,
    });
  }
}

export class RecordNotFoundError extends DatabaseError {
  constructor(entity: string, id?: string | number, options?: ErrorOptions) {
    const message = id
      ? `${entity} with id ${id} not found`
      : `${entity} not found`;
    
    super(message, {
      code: 'RECORD_NOT_FOUND',
      statusCode: 404,
      context: { entity, id },
      ...options,
    });
  }
}