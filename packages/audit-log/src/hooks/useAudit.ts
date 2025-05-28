import { useState, useEffect, useCallback, useRef } from 'react';
import { AuditAdapter } from '../types';

export interface UseAuditHealthOptions {
  adapter: AuditAdapter;
  checkInterval?: number;
}

export interface UseAuditHealthReturn {
  isHealthy: boolean | null;
  loading: boolean;
  error: string | null;
  lastCheck: Date | null;
  check: () => Promise<void>;
}

/**
 * Hook for monitoring audit adapter health
 */
export function useAuditHealth(options: UseAuditHealthOptions): UseAuditHealthReturn {
  const { adapter, checkInterval = 30000 } = options;
  
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const check = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const healthy = await adapter.healthCheck();
      setIsHealthy(healthy);
      setLastCheck(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  // Initial check
  useEffect(() => {
    check();
  }, [check]);

  // Periodic checks
  useEffect(() => {
    if (checkInterval > 0) {
      intervalRef.current = setInterval(check, checkInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [check, checkInterval]);

  return {
    isHealthy,
    loading,
    error,
    lastCheck,
    check,
  };
}
