export interface ErrorOptions {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
  cause?: Error;
  isOperational?: boolean;
  shouldReport?: boolean;
}

export interface SerializedError {
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

export type ErrorHandler = (error: Error, context?: Record<string, any>) => void | Promise<void>;

export interface ErrorReporter {
  report(error: Error, context?: Record<string, any>): Promise<void>;
}