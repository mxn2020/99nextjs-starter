import { Transport } from '../types/logger-types';

export interface TransportConfig {
  type: Transport;
  options?: Record<string, any>;
}

export function createTransports(transports: TransportConfig[] = []) {
  return transports.map(transport => {
    switch (transport.type) {
      case 'console':
        return {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ...transport.options,
          },
        };
      
      case 'file':
        return {
          target: 'pino/file',
          options: {
            destination: transport.options?.path || './app.log',
            ...transport.options,
          },
        };
      
      case 'http':
        return {
          target: 'pino-http-send',
          options: {
            url: transport.options?.url,
            method: transport.options?.method || 'POST',
            ...transport.options,
          },
        };
      
      default:
        return transport.options;
    }
  });
}