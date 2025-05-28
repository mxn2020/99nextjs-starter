import { LoggerOptions } from '../types/logger-types';

export function createFormatters(options: LoggerOptions) {
  return {
    level(label: string, number: number) {
      return { level: number, levelName: label };
    },
    
    bindings(bindings: Record<string, any>) {
      return {
        ...bindings,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.0.0',
      };
    },
    
    log(object: Record<string, any>) {
      const { err, error, ...rest } = object;
      
      if (err || error) {
        const e = err || error;
        return {
          ...rest,
          error: {
            message: e.message,
            name: e.name,
            stack: e.stack,
            code: e.code,
            ...(e.context || {}),
          },
        };
      }
      
      return rest;
    },
  };
}