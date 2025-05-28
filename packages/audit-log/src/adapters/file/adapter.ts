import { promises as fs } from 'fs';
import { createWriteStream, createReadStream } from 'fs';
import { createInterface } from 'readline';
import path from 'path';
import type { 
  AuditAdapter, 
  AuditEvent, 
  AuditFilter, 
  AuditStats, 
  AdapterConfig 
} from '../../types';
import { auditFilterSchema } from '../../schemas';
import { retry } from '../../utils';

export interface FileAdapterConfig extends AdapterConfig {
  filePath: string;
  maxFileSize?: number;
  rotateFiles?: boolean;
  maxFiles?: number;
}

export class FileAuditAdapter implements AuditAdapter {
  private config: Required<FileAdapterConfig>;
  private isInitialized = false;

  constructor(config: FileAdapterConfig) {
    if (!config.filePath) {
      throw new Error('filePath is required for FileAuditAdapter');
    }

    this.config = {
      filePath: config.filePath,
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 100MB
      rotateFiles: config.rotateFiles ?? true,
      maxFiles: config.maxFiles || 10,
      options: config.options || {},
    };
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Ensure directory exists
    const dir = path.dirname(this.config.filePath);
    await fs.mkdir(dir, { recursive: true });

    this.isInitialized = true;
  }

  async log(event: AuditEvent): Promise<void> {
    await this.initialize();
    await this.rotateIfNeeded();
    
    const line = JSON.stringify(event) + '\n';
    await retry(() => fs.appendFile(this.config.filePath, line, 'utf8'));
  }

  async logBatch(events: AuditEvent[]): Promise<void> {
    if (events.length === 0) return;
    
    await this.initialize();
    await this.rotateIfNeeded();

    const lines = events.map(event => JSON.stringify(event)).join('\n') + '\n';
    await retry(() => fs.appendFile(this.config.filePath, lines, 'utf8'));
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    await this.initialize();
    
    const validatedFilter = auditFilterSchema.parse(filter);
    const events: AuditEvent[] = [];
    let count = 0;
    let skipped = 0;

    // Read all potential files (current + rotated)
    const files = await this.getLogFiles();
    
    for (const filePath of files.reverse()) { // Start with newest
      try {
        const fileEvents = await this.readEventsFromFile(filePath);
        
        for (const event of fileEvents.reverse()) { // Newest first
          if (this.matchesFilter(event, validatedFilter)) {
            if (skipped < validatedFilter.offset) {
              skipped++;
              continue;
            }
            
            if (count < validatedFilter.limit) {
              events.push(event);
              count++;
            }
            
            if (count >= validatedFilter.limit) {
              break;
            }
          }
        }
        
        if (count >= validatedFilter.limit) {
          break;
        }
      } catch (error) {
        console.warn(`Error reading log file ${filePath}:`, error);
      }
    }

    // Sort results
    return this.sortEvents(events, validatedFilter.sortBy, validatedFilter.sortOrder);
  }

  async count(filter: Omit<AuditFilter, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>): Promise<number> {
    await this.initialize();
    
    let count = 0;
    const files = await this.getLogFiles();
    
    for (const filePath of files) {
      try {
        const events = await this.readEventsFromFile(filePath);
        for (const event of events) {
          if (this.matchesFilter(event, filter)) {
            count++;
          }
        }
      } catch (error) {
        console.warn(`Error reading log file ${filePath}:`, error);
      }
    }
    
    return count;
  }

  async getStats(filter: { startDate?: Date; endDate?: Date } = {}): Promise<AuditStats> {
    await this.initialize();
    
    let totalEvents = 0;
    const eventsByAction: Record<string, number> = {};
    const eventsByResource: Record<string, number> = {};
    const eventsByLevel: Record<string, number> = {};
    let successCount = 0;
    let minTimestamp: Date | null = null;
    let maxTimestamp: Date | null = null;

    const files = await this.getLogFiles();
    
    for (const filePath of files) {
      try {
        const events = await this.readEventsFromFile(filePath);
        
        for (const event of events) {
          if (this.matchesFilter(event, filter)) {
            totalEvents++;
            
            // Track by action
            eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;
            
            // Track by resource
            eventsByResource[event.resource] = (eventsByResource[event.resource] || 0) + 1;
            
            // Track by level
            eventsByLevel[event.level] = (eventsByLevel[event.level] || 0) + 1;
            
            // Track success
            if (event.success) {
              successCount++;
            }
            
            // Track time range
            const timestamp = new Date(event.timestamp);
            if (!minTimestamp || timestamp < minTimestamp) {
              minTimestamp = timestamp;
            }
            if (!maxTimestamp || timestamp > maxTimestamp) {
              maxTimestamp = timestamp;
            }
          }
        }
      } catch (error) {
        console.warn(`Error reading log file ${filePath}:`, error);
      }
    }

    const successRate = totalEvents > 0 ? (successCount / totalEvents) * 100 : 0;

    return {
      totalEvents,
      eventsByAction,
      eventsByResource,
      eventsByLevel,
      successRate,
      timeRange: {
        start: minTimestamp || new Date(),
        end: maxTimestamp || new Date(),
      },
    };
  }

  async purge(olderThan: Date): Promise<number> {
    await this.initialize();
    
    let deletedCount = 0;
    const files = await this.getLogFiles();
    
    for (const filePath of files) {
      try {
        const events = await this.readEventsFromFile(filePath);
        const filteredEvents = events.filter(event => {
          const eventDate = new Date(event.timestamp);
          if (eventDate < olderThan) {
            deletedCount++;
            return false;
          }
          return true;
        });
        
        // Rewrite file without purged events
        if (filteredEvents.length !== events.length) {
          if (filteredEvents.length === 0) {
            await fs.unlink(filePath);
          } else {
            const lines = filteredEvents.map(event => JSON.stringify(event)).join('\n') + '\n';
            await fs.writeFile(filePath, lines, 'utf8');
          }
        }
      } catch (error) {
        console.warn(`Error purging log file ${filePath}:`, error);
      }
    }
    
    return deletedCount;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.initialize();
      // Try to write a test entry
      const testFile = this.config.filePath + '.healthcheck';
      await fs.writeFile(testFile, 'test', 'utf8');
      await fs.unlink(testFile);
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    // No cleanup needed for file adapter
  }

  private async readEventsFromFile(filePath: string): Promise<AuditEvent[]> {
    const events: AuditEvent[] = [];
    
    const fileStream = createReadStream(filePath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (line.trim()) {
        try {
          const event = JSON.parse(line) as AuditEvent;
          // Convert timestamp string back to Date if needed
          if (typeof event.timestamp === 'string') {
            event.timestamp = new Date(event.timestamp);
          }
          events.push(event);
        } catch (error) {
          console.warn('Invalid JSON line in log file:', line);
        }
      }
    }

    return events;
  }

  private async getLogFiles(): Promise<string[]> {
    const dir = path.dirname(this.config.filePath);
    const baseName = path.basename(this.config.filePath);
    
    try {
      const files = await fs.readdir(dir);
      const logFiles = files
        .filter(file => file.startsWith(baseName))
        .map(file => path.join(dir, file))
        .sort();
      
      return logFiles;
    } catch {
      return [];
    }
  }

  private async rotateIfNeeded(): Promise<void> {
    if (!this.config.rotateFiles) return;

    try {
      const stats = await fs.stat(this.config.filePath);
      if (stats.size >= this.config.maxFileSize) {
        await this.rotateFile();
      }
    } catch {
      // File doesn't exist yet, no rotation needed
    }
  }

  private async rotateFile(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedPath = `${this.config.filePath}.${timestamp}`;
    
    try {
      await fs.rename(this.config.filePath, rotatedPath);
      
      // Clean up old files if needed
      const files = await this.getLogFiles();
      const rotatedFiles = files.filter(f => f !== this.config.filePath);
      
      if (rotatedFiles.length > this.config.maxFiles) {
        // Delete oldest files
        const filesToDelete = rotatedFiles.slice(0, rotatedFiles.length - this.config.maxFiles);
        for (const file of filesToDelete) {
          await fs.unlink(file);
        }
      }
    } catch (error) {
      console.warn('Error rotating log file:', error);
    }
  }

  private matchesFilter(event: AuditEvent, filter: any): boolean {
    if (filter.startDate && new Date(event.timestamp) < filter.startDate) {
      return false;
    }
    
    if (filter.endDate && new Date(event.timestamp) > filter.endDate) {
      return false;
    }
    
    if (filter.actions?.length && !filter.actions.includes(event.action)) {
      return false;
    }
    
    if (filter.resources?.length && !filter.resources.includes(event.resource)) {
      return false;
    }
    
    if (filter.levels?.length && !filter.levels.includes(event.level)) {
      return false;
    }
    
    if (filter.actorIds?.length && (!event.actorId || !filter.actorIds.includes(event.actorId))) {
      return false;
    }
    
    if (typeof filter.success === 'boolean' && event.success !== filter.success) {
      return false;
    }
    
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const searchableText = [
        event.description,
        event.actorId,
        event.resourceId,
        event.targetId,
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  }

  private sortEvents(events: AuditEvent[], sortBy: string, sortOrder: 'ASC' | 'DESC'): AuditEvent[] {
    return events.sort((a, b) => {
      let aVal = (a as any)[sortBy];
      let bVal = (b as any)[sortBy];
      
      // Handle Date objects
      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;
      
      return sortOrder === 'ASC' ? comparison : -comparison;
    });
  }
}
