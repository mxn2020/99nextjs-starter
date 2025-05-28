import { ErrorOptions, SerializedError } from '../types/error-types';
import { serializeError } from 'serialize-error';

export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly timestamp: string;
  public readonly shouldReport: boolean;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = options.code || 'UNKNOWN_ERROR';
    this.statusCode = options.statusCode || 500;
    this.isOperational = options.isOperational ?? true;
    this.context = options.context;
    this.timestamp = new Date().toISOString();
    this.shouldReport = options.shouldReport ?? true;

    if (options.cause) {
      this.cause = options.cause;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  serialize(): SerializedError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      stack: this.stack,
      context: this.context,
      timestamp: this.timestamp,
    };
  }

  toJSON(): SerializedError {
    return this.serialize();
  }

  static isBaseError(error: unknown): error is BaseError {
    return error instanceof BaseError;
  }
}