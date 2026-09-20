type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private formatPrefix(level: LogLevel, tag?: string): string {
    const timestamp = new Date().toISOString();
    const tagPart = tag ? ` [${tag}]` : '';
    return `[${timestamp}] [${level.toUpperCase()}]${tagPart}`;
  }

  info(message: string, tag?: string, ...args: unknown[]) {
    console.log(this.formatPrefix('info', tag), message, ...args);
  }

  warn(message: string, tag?: string, ...args: unknown[]) {
    console.warn(this.formatPrefix('warn', tag), message, ...args);
  }

  error(message: string, tag?: string, error?: unknown) {
    console.error(this.formatPrefix('error', tag), message, error || '');
  }

  debug(message: string, tag?: string, ...args: unknown[]) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatPrefix('debug', tag), message, ...args);
    }
  }
}

export const logger = new Logger();
