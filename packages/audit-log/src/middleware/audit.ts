import { NextRequest, NextResponse } from 'next/server';
import { AuditLogger, createAuditLogger } from '../lib';
import { AuditEvent, AuditAction, AuditLevel, ActorType } from '../types';
import { extractClientIP, createAuditContext } from '../utils';

export interface AuditMiddlewareConfig {
  /**
   * Logger instance or factory function
   */
  logger: AuditLogger | (() => Promise<AuditLogger>);

  /**
   * Routes to include in audit logging (supports glob patterns)
   * @default ['**']
   */
  includeRoutes?: string[];

  /**
   * Routes to exclude from audit logging (supports glob patterns)
   */
  excludeRoutes?: string[];

  /**
   * HTTP methods to audit
   * @default ['POST', 'PUT', 'PATCH', 'DELETE']
   */
  methods?: string[];

  /**
   * Function to extract actor information from request
   */
  getActor?: (request: NextRequest) => Promise<{ id: string; type: ActorType }> | { id: string; type: ActorType };

  /**
   * Function to extract resource information from request
   */
  getResource?: (request: NextRequest, response: NextResponse) => Promise<{ id?: string; type?: string }> | { id?: string; type?: string };

  /**
   * Function to determine audit action based on request
   */
  getAction?: (request: NextRequest, response: NextResponse) => AuditAction;

  /**
   * Function to determine audit level based on request/response
   */
  getLevel?: (request: NextRequest, response: NextResponse) => AuditLevel;

  /**
   * Function to generate description for the audit event
   */
  getDescription?: (request: NextRequest, response: NextResponse) => string;

  /**
   * Function to extract additional metadata
   */
  getMetadata?: (request: NextRequest, response: NextResponse) => Record<string, any>;

  /**
   * Whether to log successful requests
   * @default true
   */
  logSuccess?: boolean;

  /**
   * Whether to log failed requests
   * @default true
   */
  logErrors?: boolean;

  /**
   * Whether to include request/response bodies in metadata
   * @default false
   */
  includeBody?: boolean;

  /**
   * Maximum body size to include (in bytes)
   * @default 1024
   */
  maxBodySize?: number;

  /**
   * Whether to run audit logging asynchronously
   * @default true
   */
  async?: boolean;
}

interface RequestContext {
  startTime: number;
  id: string;
  method: string;
  url: string;
  pathname: string;
  ip: string;
  userAgent: string;
  body?: any;
}

const DEFAULT_CONFIG: Partial<AuditMiddlewareConfig> = {
  includeRoutes: ['**'],
  excludeRoutes: ['/api/health', '/api/metrics', '/_next/**', '/favicon.ico'],
  methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  logSuccess: true,
  logErrors: true,
  includeBody: false,
  maxBodySize: 1024,
  async: true,
};

// Simple glob matcher
function matchesPattern(path: string, pattern: string): boolean {
  if (pattern === '**') return true;
  if (pattern.includes('**')) {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(path);
  }
  return path === pattern || path.startsWith(pattern);
}

function shouldAuditRequest(request: NextRequest, config: AuditMiddlewareConfig): boolean {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Check method
  if (!config.methods?.includes(method)) {
    return false;
  }

  // Check exclusions first
  if (config.excludeRoutes?.some(pattern => matchesPattern(pathname, pattern))) {
    return false;
  }

  // Check inclusions
  if (config.includeRoutes?.some(pattern => matchesPattern(pathname, pattern))) {
    return true;
  }

  return false;
}

async function extractRequestContext(request: NextRequest, config: AuditMiddlewareConfig): Promise<RequestContext> {
  const url = request.nextUrl.toString();
  const pathname = request.nextUrl.pathname;
  const ip = extractClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';

  let body: any;
  if (config.includeBody && request.body) {
    try {
      const cloned = request.clone();
      const text = await cloned.text();
      if (text.length <= (config.maxBodySize || 1024)) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
    } catch {
      // Ignore body extraction errors
    }
  }

  return {
    startTime: Date.now(),
    id: crypto.randomUUID(),
    method: request.method,
    url,
    pathname,
    ip,
    userAgent,
    body,
  };
}

async function createAuditEvent(
  context: RequestContext,
  request: NextRequest,
  response: NextResponse,
  config: AuditMiddlewareConfig
): Promise<AuditEvent> {
  const now = new Date();
  const duration = Date.now() - context.startTime;

  // Get actor information
  const defaultActor = { id: 'anonymous', type: 'anonymous' as ActorType };
  const actor = config.getActor ? await config.getActor(request) : defaultActor;

  // Get resource information
  const resource = config.getResource ? await config.getResource(request, response) : {};

  // Determine action
  const action = config.getAction
    ? config.getAction(request, response)
    : getDefaultAction(request.method);

  // Determine level
  const level = config.getLevel
    ? config.getLevel(request, response)
    : getDefaultLevel(response.status);

  // Generate description
  const description = config.getDescription
    ? config.getDescription(request, response)
    : `${request.method} ${context.pathname} - ${response.status}`;

  // Extract metadata
  const defaultMetadata = {
    method: context.method,
    pathname: context.pathname,
    status: response.status,
    duration,
    ip: context.ip,
    userAgent: context.userAgent,
    ...(context.body && { requestBody: context.body }),
  };

  const customMetadata = config.getMetadata ? config.getMetadata(request, response) : {};
  const metadata = { ...defaultMetadata, ...customMetadata };

  return {
    id: context.id,
    timestamp: now,
    action,
    actorId: actor.id,
    actorType: actor.type,
    resourceId: resource.id,
    resourceType: resource.type as any,
    level,
    description,
    metadata,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    context: createAuditContext(request),
  };
}

function getDefaultAction(method: string): AuditAction {
  switch (method.toUpperCase()) {
    case 'POST': return 'create';
    case 'PUT':
    case 'PATCH': return 'update';
    case 'DELETE': return 'delete';
    case 'GET': return 'read';
    default: return 'other';
  }
}

function getDefaultLevel(status: number): AuditLevel {
  if (status >= 500) return 'error';
  if (status >= 400) return 'warn';
  if (status >= 300) return 'info';
  return 'info';
}

/**
 * Creates an audit middleware for Next.js applications
 */
export function createAuditMiddleware(config: AuditMiddlewareConfig) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async function auditMiddleware(request: NextRequest): Promise<NextResponse> {
    // Check if this request should be audited
    if (!shouldAuditRequest(request, finalConfig)) {
      return NextResponse.next();
    }

    // Extract request context
    const context = await extractRequestContext(request, finalConfig);

    // Continue with the request
    const response = NextResponse.next();

    // Create and log audit event
    const logAuditEvent = async () => {
      try {
        // Get logger instance
        const logger = typeof finalConfig.logger === 'function'
          ? await finalConfig.logger()
          : finalConfig.logger;

        // Check if we should log based on response status
        const shouldLog = (response.status >= 400 && finalConfig.logErrors) ||
          (response.status < 400 && finalConfig.logSuccess);

        if (!shouldLog) return;

        // Create and log audit event
        const auditEvent = await createAuditEvent(context, request, response, finalConfig);
        await logger.log(auditEvent);
      } catch (error) {
        console.error('Audit middleware error:', error);
      }
    };

    // Log asynchronously or synchronously
    if (finalConfig.async) {
      // Don't await - log in background
      logAuditEvent();
    } else {
      await logAuditEvent();
    }

    return response;
  };
}

/**
 * Pre-configured middleware for common use cases
 */
export const auditMiddlewares = {
  /**
   * Audit all API routes with basic configuration
   */
  api: (logger: AuditLogger | (() => Promise<AuditLogger>)) =>
    createAuditMiddleware({
      logger,
      includeRoutes: ['/api/**'],
      excludeRoutes: ['/api/health', '/api/metrics'],
    }),

  /**
   * Audit authentication-related routes
   */
  auth: (logger: AuditLogger | (() => Promise<AuditLogger>)) =>
    createAuditMiddleware({
      logger,
      includeRoutes: ['/api/auth/**', '/auth/**', '/login', '/logout', '/register'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      getAction: (request) => {
        const path = request.nextUrl.pathname.toLowerCase();
        if (path.includes('login')) return 'login';
        if (path.includes('logout')) return 'logout';
        if (path.includes('register')) return 'register';
        return getDefaultAction(request.method);
      },
    }),

  /**
   * Audit admin operations with enhanced logging
   */
  admin: (logger: AuditLogger | (() => Promise<AuditLogger>)) =>
    createAuditMiddleware({
      logger,
      includeRoutes: ['/api/admin/**', '/admin/**'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      includeBody: true,
      maxBodySize: 2048,
      getLevel: (request, response) => {
        if (response.status >= 400) return 'error';
        if (['DELETE', 'PUT', 'PATCH'].includes(request.method)) return 'warn';
        return 'info';
      },
    }),
};

/**
 * Utility to create a middleware with environment-based logger
 */
export function createAuditMiddlewareWithEnv(
  overrides?: Partial<AuditMiddlewareConfig>
) {
  return createAuditMiddleware({
    logger: () => createAuditLogger(),
    ...overrides,
  });
}

// Type exports for middleware configuration
export type { AuditMiddlewareConfig };
