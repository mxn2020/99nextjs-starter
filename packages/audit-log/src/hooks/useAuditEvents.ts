'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AuditAdapter, AuditEventFilter, PaginatedResult, AuditEvent } from '../types';

export interface UseAuditEventsOptions {
  adapter: AuditAdapter;
  initialFilter?: AuditEventFilter;
  autoRefresh?: boolean;
  refreshInterval?: number;
  pageSize?: number;
}

export interface UseAuditEventsReturn {
  events: AuditEvent[];
  total: number;
  loading: boolean;
  error: string | null;
  filter: AuditEventFilter;
  hasMore: boolean;
  // Actions
  setFilter: (filter: AuditEventFilter) => void;
  updateFilter: (updates: Partial<AuditEventFilter>) => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing audit events with filtering, pagination, and real-time updates
 */
export function useAuditEvents(options: UseAuditEventsOptions): UseAuditEventsReturn {
  const {
    adapter,
    initialFilter = {},
    autoRefresh = false,
    refreshInterval = 30000,
    pageSize = 50,
  } = options;

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<AuditEventFilter>(initialFilter);
  const [hasMore, setHasMore] = useState(false);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadEvents = useCallback(async (
    currentFilter: AuditEventFilter = filter,
    append = false
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);

      const offset = append ? events.length : 0;
      const queryFilter = {
        ...currentFilter,
        limit: pageSize,
        offset,
        sortBy: currentFilter.sortBy || 'timestamp',
        sortOrder: (currentFilter.sortOrder || 'desc').toUpperCase() as 'ASC' | 'DESC',
      };

      const result: PaginatedResult<AuditEvent> = await adapter.query(queryFilter);

      if (append) {
        setEvents(prev => [...prev, ...result.data]);
      } else {
        setEvents(result.data);
      }
      
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [adapter, filter, events.length, pageSize]);

  const setFilter = useCallback((newFilter: AuditEventFilter) => {
    setFilterState(newFilter);
    setEvents([]); // Reset events when filter changes
    loadEvents(newFilter, false);
  }, [loadEvents]);

  const updateFilter = useCallback((updates: Partial<AuditEventFilter>) => {
    const newFilter = { ...filter, ...updates };
    setFilter(newFilter);
  }, [filter, setFilter]);

  const refresh = useCallback(async () => {
    await loadEvents(filter, false);
  }, [loadEvents, filter]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await loadEvents(filter, true);
    }
  }, [hasMore, loading, loadEvents, filter]);

  const reset = useCallback(() => {
    setFilterState(initialFilter);
    setEvents([]);
    setTotal(0);
    setError(null);
    setHasMore(false);
    loadEvents(initialFilter, false);
  }, [initialFilter, loadEvents]);

  // Initial load
  useEffect(() => {
    loadEvents(filter, false);
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, refresh]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    events,
    total,
    loading,
    error,
    filter,
    hasMore,
    setFilter,
    updateFilter,
    refresh,
    loadMore,
    reset,
  };
}