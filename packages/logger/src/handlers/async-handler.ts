import { NextRequest, NextResponse } from 'next/server';
import { errorHandler } from './error-handler';
import { ApiResponse } from '../types/api-types';

type AsyncHandler<T = any> = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse<ApiResponse<T>>>;

export function asyncHandler<T = any>(
  handler: AsyncHandler<T>
): AsyncHandler<T> {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return (await errorHandler(error, request)) as NextResponse<ApiResponse<T>>;
    }
  };
}

// For use with API routes that don't use NextRequest
export function asyncWrapper<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      throw error; // Re-throw to be caught by error boundary or global handler
    }
  }) as T;
}