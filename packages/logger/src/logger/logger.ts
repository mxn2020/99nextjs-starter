import pino, { Logger as PinoLogger } from 'pino';
import chalk from 'chalk';
import { LoggerOptions, LogLevel, LogContext } from '../types/logger-types';
import { createFormatters } from './formatters';
import { createTransports } from './transports';

export class Logger {
  private pino: PinoLogger;
  private context: LogContext;
  private useEmoji: boolean;
  private enabled: boolean;

  private static readonly emojis: Record<LogLevel, string> = {
    trace: '🔬',
    debug: '🔍',
    info: '💡',
    warn: '⚠️',
    error: '❌',
    fatal: '💀',
  };

  constructor(options: LoggerOptions = {}) {
    const {
      name = 'app',
      level = (process.env.LOG_LEVEL as LogLevel) || 'info',
      context = {},
      prettyPrint = process.env.NODE_ENV !== 'production',
      useEmoji = process.env.LOG_EMOJI === 'true',
      enabled = process.env.LOG_ENABLED !== 'false',
      redact = ['password', 'token', 'secret', 'authorization'],
      serializers = {},
    } = options;

    this.context = context;
    this.useEmoji = useEmoji;
    this.enabled = enabled;

    // Disable pino-pretty transport in Next.js environments to avoid worker thread issues
    const isNextJs = typeof window !== 'undefined' || process.env.VERCEL || process.env.NEXT_RUNTIME;
    const transport = prettyPrint && !isNextJs
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        }
      : undefined;

    this.pino = pino({
      name,
      level,
      enabled: this.enabled,
      redact,
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        ...serializers,
      },
      formatters: createFormatters(options),
      transport,
    });
  }

  private formatMessage(level: LogLevel, message: string): string {
    if (!this.useEmoji) return message;
    return `${Logger.emojis[level]} ${message}`;
  }

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.context, ...context };
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  child(options: Partial<LoggerOptions> & { context?: LogContext }): Logger {
    const childLogger = new Logger({
      name: this.pino.bindings().name,
      level: this.pino.level as LogLevel,
      context: this.mergeContext(options.context),
      useEmoji: this.useEmoji,
      enabled: this.enabled,
      ...options,
    });
    return childLogger;
  }

  // Logging methods
  trace(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    this.pino.trace(this.mergeContext(context), this.formatMessage('trace', message));
  }

  debug(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    this.pino.debug(this.mergeContext(context), this.formatMessage('debug', message));
  }

  info(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    this.pino.info(this.mergeContext(context), this.formatMessage('info', message));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.enabled) return;
    this.pino.warn(this.mergeContext(context), this.formatMessage('warn', message));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.enabled) return;
    const ctx = this.mergeContext(context);
    if (error) {
      ctx.error = error;
    }
    this.pino.error(ctx, this.formatMessage('error', message));
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.enabled) return;
    const ctx = this.mergeContext(context);
    if (error) {
      ctx.error = error;
    }
    this.pino.fatal(ctx, this.formatMessage('fatal', message));
  }

  // Performance logging
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`${label} completed`, { duration, label });
    };
  }

  // HTTP logging helpers
  logRequest(req: any, res?: any, context?: LogContext): void {
    this.info('HTTP Request', {
      ...this.mergeContext(context),
      req,
      res,
    });
  }

  logResponse(req: any, res: any, duration: number, context?: LogContext): void {
    const level = res.statusCode >= 400 ? 'error' : 'info';
    this[level]('HTTP Response', {
      ...this.mergeContext(context),
      req,
      res,
      duration,
    });
  }
}

// Factory function
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}

// Default logger instance
export const logger = createLogger({
  name: process.env.LOG_NAME || 'app',
});