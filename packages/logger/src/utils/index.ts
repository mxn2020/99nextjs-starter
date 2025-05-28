export * from './stack-trace';
export * from './serializers';

// Utility function to create consistent error responses
export function createErrorResponse(error: Error, includeStack = false) {
  return {
    error: {
      message: error.message,
      name: error.name,
      ...(includeStack && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
  };
}

// Performance monitoring utility
export function measurePerformance<T>(
  fn: () => T | Promise<T>,
  label: string
): T | Promise<T> {
  const start = performance.now();
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      console.log(`${label} took ${duration.toFixed(2)}ms`);
    });
  }
  
  const duration = performance.now() - start;
  console.log(`${label} took ${duration.toFixed(2)}ms`);
  return result;
}