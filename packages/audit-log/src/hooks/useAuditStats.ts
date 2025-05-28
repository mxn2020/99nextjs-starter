'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AuditAdapter, AuditEventFilter, AuditStats } from '../types';

export interface UseAuditStatsOptions {
  adapter: AuditAdapter;
  filter?: AuditEventFilter;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseAuditStatsReturn {
  stats: AuditStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for loading audit statistics
 */
export function useAuditStats(options: UseAuditStatsOptions): UseAuditStatsReturn {
  const {
    adapter,
    filter = {},
    autoRefresh = false,
    refreshInterval = 60000,
  } = options;

  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await adapter.getStats(filter);
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [adapter, filter]);

  const refresh = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  // Initial load
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        loadStats();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, loadStats]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}

