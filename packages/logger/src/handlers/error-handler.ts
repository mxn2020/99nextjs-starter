import { NextRequest, NextResponse } from 'next/server';
import { BaseError } from '../errors/base-error';
import { ApiResponse, ApiError } from '../types/api-types';
import { logger } from '../logger';
import { serializeError } from 'serialize-error';

export interface ErrorHandlerOptions {
  logErrors?: boolean;
  includeStackTrace?: boolean;
  defaultMessage?: string;
  onError?: (error: Error, request?: NextRequest) => void | Promise<void>;
}

export function createErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    logErrors = true,
    includeStackTrace = process.env.NODE_ENV !== 'production',
    defaultMessage = 'An unexpected error occurred',
    onError,
  } = options;

  return async function errorHandler(
    error: unknown,
    request?: NextRequest
  ): Promise<NextResponse<ApiResponse>> {
    // Log the error
    if (logErrors) {
      logger.error('Error caught by handler', error as Error, {
        url: request?.url,
        method: request?.method,
        headers: request?.headers ? Object.fromEntries(request.headers) : undefined,
      });
    }

    // Call custom error handler
    if (onError) {
      try {
        await onError(error as Error, request);
      } catch (handlerError) {
        logger.error('Error in custom error handler', handlerError as Error);
      }
    }

    // Prepare error response
    let statusCode = 500;
    let apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: defaultMessage,
      timestamp: new Date().toISOString(),
    };

    if (BaseError.isBaseError(error)) {
      statusCode = error.statusCode;
      apiError = {
        code: error.code,
        message: error.message,
        details: error.context,
        timestamp: error.timestamp,
      };
      
      if (includeStackTrace) {
        apiError.stack = error.stack;
      }
    } else if (error instanceof Error) {
      apiError.message = includeStackTrace ? error.message : defaultMessage;
      
      if (includeStackTrace) {
        apiError.stack = error.stack;
      }
    }

    // Add request ID if available
    const requestId = request?.headers.get('x-request-id');
    if (requestId) {
      apiError.details = { ...apiError.details, requestId };
    }

    const response: ApiResponse = {
      success: false,
      error: apiError,
    };

    return NextResponse.json(response, { status: statusCode });
  };
}

// Default error handler
export const errorHandler = createErrorHandler();