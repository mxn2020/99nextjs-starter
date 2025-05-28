import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiResponse, ApiMethod } from '../types/api-types';
import { ValidationException } from '../errors/validation-errors';
import { UnauthorizedError, ForbiddenError } from '../errors/http-errors';
import { asyncHandler } from './async-handler';
import { logger } from '../logger';

export interface ApiHandlerOptions<TBody = any, TQuery = any, TParams = any> {
  method?: ApiMethod | ApiMethod[];
  auth?: boolean | ((request: NextRequest) => Promise<boolean>);
  schema?: {
    body?: z.ZodSchema<TBody>;
    query?: z.ZodSchema<TQuery>;
    params?: z.ZodSchema<TParams>;
  };
  rateLimit?: {
    requests: number;
    window: number;
  };
}

export interface ApiContext<TBody = any, TQuery = any, TParams = any> {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
  user?: any;
  requestId: string;
}

export function createApiHandler<TBody = any, TQuery = any, TParams = any, TResponse = any>(
  options: ApiHandlerOptions<TBody, TQuery, TParams>,
  handler: (
    request: NextRequest,
    context: ApiContext<TBody, TQuery, TParams>
  ) => Promise<ApiResponse<TResponse>>
) {
  return asyncHandler<TResponse>(async (request: NextRequest, routeContext?: any) => {
    const start = Date.now();
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    
    // Set request ID in logger context
    logger.setContext({ requestId });

    // Method validation
    if (options.method) {
      const allowedMethods = Array.isArray(options.method) ? options.method : [options.method];
      if (!allowedMethods.includes(request.method as ApiMethod)) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'METHOD_NOT_ALLOWED', 
              message: 'Method not allowed' 
            } 
          } as ApiResponse<TResponse>,
          { status: 405 }
        );
      }
    }

    // Authentication
    if (options.auth) {
      const isAuthenticated = typeof options.auth === 'function'
        ? await options.auth(request)
        : false; // Implement your default auth check
      
      if (!isAuthenticated) {
        throw new UnauthorizedError();
      }
    }

    // Parse and validate request data
    const context: ApiContext<TBody, TQuery, TParams> = { requestId };

    // Validate body
    if (options.schema?.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.json();
        context.body = options.schema.body.parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationException(
            error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          );
        }
        throw error;
      }
    }

    // Validate query params
    if (options.schema?.query) {
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      try {
        context.query = options.schema.query.parse(searchParams);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationException(
            error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          );
        }
        throw error;
      }
    }

    // Validate route params
    if (options.schema?.params && routeContext?.params) {
      try {
        context.params = options.schema.params.parse(routeContext.params);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationException(
            error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          );
        }
        throw error;
      }
    }

    // Execute handler
    const result = await handler(request, context);

    // Add metadata
    const duration = Date.now() - start;
    const response: ApiResponse<TResponse> = {
      ...result,
      meta: {
        ...result.meta,
        requestId,
        duration,
      },
    };

    // Log response
    logger.info('API Response', {
      method: request.method,
      url: request.url,
      statusCode: result.success ? 200 : 400,
      duration,
    });

    return NextResponse.json(response, {
      status: result.success ? 200 : 400,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': `${duration}ms`,
      },
    });
  });
}