'use client';

import React from 'react';
import { ErrorBoundary } from './error-boundary';
import { ApiError } from '../types/api-types';

interface ApiBoundaryProps {
  children: React.ReactNode;
  onApiError?: (error: ApiError) => void;
}

export function ApiBoundary({ children, onApiError }: ApiBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => {
        const isApiError = 'code' in error && 'statusCode' in error;
        
        if (isApiError && onApiError) {
          onApiError(error as any);
        }

        return (
          <div className="api-error-boundary">
            <h3>API Error</h3>
            <p>{error.message}</p>
            {isApiError && (
              <p className="error-code">Error Code: {(error as any).code}</p>
            )}
            <button onClick={reset}>Retry</button>
          </div>
        );
      }}
    >
      {children}
    </ErrorBoundary>
  );
}