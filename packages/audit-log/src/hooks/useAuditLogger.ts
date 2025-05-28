'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AuditAdapter, AuditEvent } from '../types';

export interface UseAuditLoggerOptions {
  adapter: AuditAdapter;
  batchSize?: number;
  flushInterval?: number;
}

export interface UseAuditLoggerReturn {
  log: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => Promise<void>;
  logBatch: (events: Array<Omit<AuditEvent, 'id' | 'timestamp'>>) => Promise<void>;
  flush: () => Promise<void>;
  isLogging: boolean;
  error: string | null;
}

/**
 * Hook for logging audit events with batching support
 */
export function useAuditLogger(options: UseAuditLoggerOptions): UseAuditLoggerReturn {
  const { adapter, batchSize = 10, flushInterval = 5000 } = options;
  
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const batchRef = useRef<AuditEvent[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flush = useCallback(async () => {
    if (batchRef.current.length === 0) return;

    try {
      setIsLogging(true);
      setError(null);
      
      const events = [...batchRef.current];
      batchRef.current = [];
      
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = null;
      }

      await adapter.logBatch(events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log events');
      // Re-add events to batch for retry
      batchRef.current.unshift(...batchRef.current);
    } finally {
      setIsLogging(false);
    }
  }, [adapter]);

  const scheduleFlush = useCallback(() => {
    if (flushTimeoutRef.current) return;
    
    flushTimeoutRef.current = setTimeout(() => {
      flush();
    }, flushInterval);
  }, [flush, flushInterval]);

  const log = useCallback(async (eventData: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...eventData,
    };

    batchRef.current.push(event);

    if (batchRef.current.length >= batchSize) {
      await flush();
    } else {
      scheduleFlush();
    }
  }, [batchSize, flush, scheduleFlush]);

  const logBatch = useCallback(async (eventsData: Array<Omit<AuditEvent, 'id' | 'timestamp'>>) => {
    const events: AuditEvent[] = eventsData.map(data => ({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...data,
    }));

    try {
      setIsLogging(true);
      setError(null);
      await adapter.logBatch(events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log events');
      throw err;
    } finally {
      setIsLogging(false);
    }
  }, [adapter]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      // Attempt to flush remaining events on unmount
      if (batchRef.current.length > 0) {
        flush();
      }
    };
  }, [flush]);

  return {
    log,
    logBatch,
    flush,
    isLogging,
    error,
  };
}