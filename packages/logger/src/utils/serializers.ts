import { serializeError } from 'serialize-error';

export function createErrorSerializer() {
  return (error: any) => {
    if (error instanceof Error) {
      return serializeError(error);
    }
    return error;
  };
}

export function createRequestSerializer() {
  return (req: any) => {
    return {
      method: req.method,
      url: req.url,
      headers: req.headers,
      remoteAddress: req.connection?.remoteAddress,
      remotePort: req.connection?.remotePort,
    };
  };
}

export function createResponseSerializer() {
  return (res: any) => {
    return {
      statusCode: res.statusCode,
      headers: res.getHeaders?.(),
    };
  };
}

export function redactSensitiveData(
  data: any,
  fieldsToRedact: string[] = ['password', 'token', 'secret', 'key', 'authorization']
): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const redacted = Array.isArray(data) ? [...data] : { ...data };

  for (const key in redacted) {
    if (fieldsToRedact.some(field => key.toLowerCase().includes(field))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key], fieldsToRedact);
    }
  }

  return redacted;
}