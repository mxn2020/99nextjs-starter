import * as stackTrace from 'stack-trace';

export interface StackFrame {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  functionName: string;
  source: string;
}

export function parseStackTrace(error: Error): StackFrame[] {
  const trace = stackTrace.parse(error);
  
  return trace.map(frame => ({
    fileName: frame.getFileName() || 'unknown',
    lineNumber: frame.getLineNumber() || 0,
    columnNumber: frame.getColumnNumber() || 0,
    functionName: frame.getFunctionName() || 'anonymous',
    source: frame.toString(),
  }));
}

export function cleanStackTrace(stack: string): string {
  const lines = stack.split('\n');
  const cleaned = lines.filter(line => {
    // Remove internal Node.js and framework lines
    return !line.includes('node_modules') &&
           !line.includes('internal/') &&
           !line.includes('async_hooks');
  });
  
  return cleaned.join('\n');
}