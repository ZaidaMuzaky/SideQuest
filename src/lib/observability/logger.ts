export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type SafeLogContext = Record<string, unknown>;

const SENSITIVE_KEY = /(token|password|secret|credential|authorization|cookie|signed.?url|proof|coordinate|latitude|longitude|access.?key|refresh.?key)/i;

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') return value.length > 256 ? `${value.slice(0, 256)}…` : value;
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => sanitize(item, seen));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? '[REDACTED]' : sanitize(item, seen)]));
}

export function createCorrelationId(): string {
  return `sq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface Observability {
  log(level: LogLevel, message: string, context?: SafeLogContext): void;
  captureError(error: unknown, context?: SafeLogContext): string;
  track(event: string, context?: SafeLogContext): void;
}

export function createObservability(enabled = __DEV__): Observability {
  const emit = (level: LogLevel, message: string, context?: SafeLogContext) => {
    if (!enabled) return;
    const output = { message, correlationId: createCorrelationId(), ...(context ? sanitize(context) as SafeLogContext : {}) };
    console[level](JSON.stringify(output));
  };
  return {
    log: emit,
    captureError: (error, context) => {
      const correlationId = createCorrelationId();
      emit('error', 'Unhandled application error', { ...context, correlationId, error: error instanceof Error ? error.name : 'UnknownError' });
      return correlationId;
    },
    track: () => undefined,
  };
}

export const observability = createObservability();
