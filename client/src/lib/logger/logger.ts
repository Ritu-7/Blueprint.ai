type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  tag?: string;
  requestId?: string;
  userId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

class Logger {
  private isProd = process.env.NODE_ENV === 'production';

  private format(level: LogLevel, message: string, context?: LogContext, error?: unknown): string {
    const timestamp = new Date().toISOString();

    if (this.isProd) {
      // Structured JSON logging for cloud observability (Datadog / CloudWatch / Vercel)
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        tag: context?.tag,
        requestId: context?.requestId,
        userId: context?.userId,
        durationMs: context?.durationMs,
        context: context ? { ...context, tag: undefined, requestId: undefined, userId: undefined, durationMs: undefined } : undefined,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      });
    }

    const tagPart = context?.tag ? ` [${context.tag}]` : '';
    const reqPart = context?.requestId ? ` [req:${context.requestId.slice(0, 8)}]` : '';
    return `[${timestamp}] [${level.toUpperCase()}]${tagPart}${reqPart} ${message}`;
  }

  info(message: string, tagOrContext?: string | LogContext, ...args: unknown[]) {
    const ctx = typeof tagOrContext === 'string' ? { tag: tagOrContext } : tagOrContext;
    console.log(this.format('info', message, ctx), ...args);
  }

  warn(message: string, tagOrContext?: string | LogContext, ...args: unknown[]) {
    const ctx = typeof tagOrContext === 'string' ? { tag: tagOrContext } : tagOrContext;
    console.warn(this.format('warn', message, ctx), ...args);
  }

  error(message: string, tagOrContext?: string | LogContext, error?: unknown) {
    const ctx = typeof tagOrContext === 'string' ? { tag: tagOrContext } : tagOrContext;
    console.error(this.format('error', message, ctx, error));
  }

  debug(message: string, tagOrContext?: string | LogContext, ...args: unknown[]) {
    if (process.env.NODE_ENV === 'development') {
      const ctx = typeof tagOrContext === 'string' ? { tag: tagOrContext } : tagOrContext;
      console.debug(this.format('debug', message, ctx), ...args);
    }
  }
}

export const logger = new Logger();
