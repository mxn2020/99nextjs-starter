export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  path?: string;
  timestamp?: string;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  requestId?: string;
  duration?: number;
  version?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: Required<Pick<ApiMeta, 'page' | 'limit' | 'total' | 'totalPages'>>;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  cache?: RequestCache;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint {
  path: string;
  method: ApiMethod;
  authenticated?: boolean;
  rateLimit?: {
    requests: number;
    window: number;
  };
}