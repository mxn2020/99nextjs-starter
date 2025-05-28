import { nanoid } from 'nanoid';
import type { AuditEvent, AuditEventAction, AuditLevel, AuditResource, AuditContext } from '../types';

/**
 * Generate a unique audit event ID
 */
export function generateAuditId(): string {
  return nanoid();
}

/**
 * Create a formatted timestamp
 */
export function createTimestamp(): Date {
  return new Date();
}

/**
 * Sanitize sensitive data from an object
 */
export function sanitizeData(
  data: Record<string, any>, 
  sensitiveFields: string[] = ['password', 'token', 'secret', 'key', 'authorization'],
  replacement = '[REDACTED]'
): Record<string, any> {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  
  const sanitizeRecursive = (obj: any, path = ''): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => sanitizeRecursive(item, `${path}[${index}]`));
    }

    const result = { ...obj };
    
    for (const [key, value] of Object.entries(result)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check if field should be sanitized
      const shouldSanitize = sensitiveFields.some(field => {
        const fieldLower = field.toLowerCase();
        const keyLower = key.toLowerCase();
        const pathLower = currentPath.toLowerCase();
        
        return keyLower.includes(fieldLower) || 
               pathLower.includes(fieldLower) ||
               keyLower === fieldLower;
      });

      if (shouldSanitize) {
        result[key] = replacement;
      } else if (value && typeof value === 'object') {
        result[key] = sanitizeRecursive(value, currentPath);
      }
    }
    
    return result;
  };

  return sanitizeRecursive(sanitized);
}

/**
 * Extract IP address from various sources
 */
export function extractIpAddress(headers: Record<string, string | string[]>): string | undefined {
  const possibleHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'x-cluster-client-ip',
    'forwarded-for',
    'forwarded'
  ];

  for (const header of possibleHeaders) {
    const value = headers[header];
    if (value) {
      const ip = Array.isArray(value) ? value[0] : value;
      // Extract first IP from comma-separated list
      const firstIp = ip?.split(',')[0]?.trim();
      if (firstIp && isValidIp(firstIp)) {
        return firstIp;
      }
    }
  }

  return undefined;
}

/**
 * Validate IP address format
 */
function isValidIp(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Create audit context from request-like object
 */
export function createAuditContext(request: {
  headers?: Record<string, string | string[]>;
  method?: string;
  url?: string;
  ip?: string;
}): AuditContext {
  const headers = request.headers || {};
  
  return {
    ipAddress: request.ip || extractIpAddress(headers),
    userAgent: Array.isArray(headers['user-agent']) 
      ? headers['user-agent'][0] 
      : headers['user-agent'],
    method: request.method,
    endpoint: request.url,
    referrer: Array.isArray(headers.referer) 
      ? headers.referer[0] 
      : headers.referer,
  };
}

/**
 * Calculate audit level based on action and resource
 */
export function calculateAuditLevel(
  action: AuditEventAction, 
  resource: AuditResource,
  success: boolean
): AuditLevel {
  // Critical security events
  if (!success && ['login', 'login_failed', 'permission_denied', 'access_denied'].includes(action)) {
    return 'critical';
  }

  // High priority events
  if (['delete', 'account_locked', 'password_change', 'permission_granted'].includes(action)) {
    return 'high';
  }

  // System and data changes
  if (['create', 'update', 'config_change', 'system_start', 'system_stop'].includes(action)) {
    return 'medium';
  }

  // Read operations and general events
  return 'low';
}

/**
 * Format duration in human readable format
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }
  
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(2)}m`;
  }
  
  const hours = minutes / 60;
  return `${hours.toFixed(2)}h`;
}

/**
 * Deep clone an object safely
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * Debounce function for batching
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
