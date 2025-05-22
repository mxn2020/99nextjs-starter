import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type TimestampFormat = 'iso' | 'locale' | 'unix';

interface LogContext {
  [key: string]: unknown;
}

interface LoggerOptions {
  prefix?: string;
  level?: LogLevel;
  timestampFormat?: TimestampFormat;
  context?: LogContext;
  filter?: (level: LogLevel, message: string, context?: LogContext) => boolean;
  useEmoji?: boolean;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  prefix?: string;
  message: string;
  context?: LogContext;
  requestId?: string;
}

class Logger {
  private prefix: string;
  private level: LogLevel;
  private timestampFormat: TimestampFormat;
  private globalContext: LogContext;
  private filter?: (level: LogLevel, message: string, context?: LogContext) => boolean;
  private useEmoji: boolean;
  private static requestIdKey = 'X-Request-ID';

  // Emoji mappings for different log levels
  private static readonly emojis: Record<LogLevel, string> = {
    debug: '🔍',  // Magnifying glass for debugging/inspection
    info: '💡',   // Light bulb for information
    warn: '⚠️',   // Warning sign
    error: '❌',  // Cross mark for errors
  };

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '';
    this.level = process.env.LOG_LEVEL as LogLevel || options.level || 'info';
    this.timestampFormat = options.timestampFormat || 'iso';
    this.globalContext = options.context || {};
    this.filter = options.filter;
    this.useEmoji = options.useEmoji ?? (process.env.LOG_EMOJI?.toLowerCase() === 'true') ?? false;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.level];
  }

  private formatTimestamp(): string {
    const now = new Date();
    switch (this.timestampFormat) {
      case 'iso':
        return now.toISOString();
      case 'locale':
        return now.toLocaleString();
      case 'unix':
        return Math.floor(now.getTime() / 1000).toString();
      default:
        return now.toISOString();
    }
  }

  private getEmoji(level: LogLevel): string {
    return this.useEmoji ? `${Logger.emojis[level]} ` : '';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = this.formatTimestamp();
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    const requestId = context?.[Logger.requestIdKey] ? `[${context[Logger.requestIdKey]}] ` : '';
    const emoji = this.getEmoji(level);
    
    const contextStr = context || this.globalContext ? 
      JSON.stringify({ ...this.globalContext, ...context }, null, 2) : '';

    return `${timestamp} ${emoji}${prefix}${requestId}${message}${contextStr ? ` ${contextStr}` : ''}`;
  }

  setContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  clearContext(): void {
    this.globalContext = {};
  }

  setRequestId(requestId: string): void {
    this.setContext({ [Logger.requestIdKey]: requestId });
  }

  setEmoji(enabled: boolean): void {
    this.useEmoji = enabled;
  }

  child(options: LoggerOptions): Logger {
    return new Logger({
      ...options,
      context: { ...this.globalContext, ...options.context },
      prefix: options.prefix || this.prefix,
      level: options.level || this.level,
      timestampFormat: options.timestampFormat || this.timestampFormat,
      useEmoji: options.useEmoji ?? this.useEmoji,
    });
  }

  private async log(level: LogLevel, message: string, context?: LogContext): Promise<void> {
    if (!this.shouldLog(level)) return;
    
    if (this.filter && !this.filter(level, message, context)) return;

    const formattedMessage = this.formatMessage(level, message, context);

    // Console output with colors
    switch (level) {
      case 'debug':
        console.debug(chalk.blue(formattedMessage));
        break;
      case 'info':
        console.info(chalk.green(formattedMessage));
        break;
      case 'warn':
        console.warn(chalk.yellow(formattedMessage));
        break;
      case 'error':
        console.error(chalk.red(formattedMessage));
        break;
    }
  }

  async debug(message: string, context?: LogContext): Promise<void> {
    await this.log('debug', message, context);
  }

  async info(message: string, context?: LogContext): Promise<void> {
    await this.log('info', message, context);
  }

  async warn(message: string, context?: LogContext): Promise<void> {
    await this.log('warn', message, context);
  }

  async error(message: string, context?: LogContext): Promise<void> {
    await this.log('error', message, context);
  }
}

export const createLogger = (options?: LoggerOptions): Logger => new Logger(options);

// Default logger instance with emoji support based on environment variable
export const logger = createLogger();

// Export types for consumers
export type { LoggerOptions, LogContext, LogEntry }; 