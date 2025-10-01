import { Injectable, Logger } from '@nestjs/common';

export type LogMetadata = Record<string, unknown>;

export interface ContextualLogger {
  log(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  debug(message: string, metadata?: LogMetadata): void;
  verbose(message: string, metadata?: LogMetadata): void;
  error(message: string, error?: unknown, metadata?: LogMetadata): void;
}

type LogLevel = 'log' | 'warn' | 'debug' | 'verbose';

@Injectable()
export class AppLoggerService implements ContextualLogger {
  private readonly defaultContext = 'App';

  log(message: string, metadata?: LogMetadata): void {
    this.write('log', this.defaultContext, message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.write('warn', this.defaultContext, message, metadata);
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.write('debug', this.defaultContext, message, metadata);
  }

  verbose(message: string, metadata?: LogMetadata): void {
    this.write('verbose', this.defaultContext, message, metadata);
  }

  error(message: string, error?: unknown, metadata?: LogMetadata): void {
    this.writeError(this.defaultContext, message, error, metadata);
  }

  forContext(context: string): ContextualLogger {
    const finalContext = context || this.defaultContext;
    return {
      log: (message: string, metadata?: LogMetadata) =>
        this.write('log', finalContext, message, metadata),
      warn: (message: string, metadata?: LogMetadata) =>
        this.write('warn', finalContext, message, metadata),
      debug: (message: string, metadata?: LogMetadata) =>
        this.write('debug', finalContext, message, metadata),
      verbose: (message: string, metadata?: LogMetadata) =>
        this.write('verbose', finalContext, message, metadata),
      error: (message: string, error?: unknown, metadata?: LogMetadata) =>
        this.writeError(finalContext, message, error, metadata),
    };
  }

  private write(level: LogLevel, context: string, message: string, metadata?: LogMetadata): void {
    const formattedMessage = this.composeMessage(message, metadata);
    switch (level) {
      case 'log':
        Logger.log(formattedMessage, context);
        break;
      case 'warn':
        Logger.warn(formattedMessage, context);
        break;
      case 'debug':
        Logger.debug(formattedMessage, context);
        break;
      case 'verbose':
        Logger.verbose(formattedMessage, context);
        break;
      default:
        Logger.log(formattedMessage, context);
        break;
    }
  }

  private writeError(context: string, message: string, error?: unknown, metadata?: LogMetadata): void {
    const { stack, meta: errorMeta } = this.describeError(error);
    const combinedMeta = this.combineMetadata(metadata, errorMeta);
    const formattedMessage = this.composeMessage(message, combinedMeta);
    Logger.error(formattedMessage, stack, context);
  }

  private composeMessage(message: string, metadata?: LogMetadata): string {
    const serializedMetadata = this.serializeMetadata(metadata);
    return serializedMetadata ? `${message} ${serializedMetadata}` : message;
  }

  private serializeMetadata(metadata?: LogMetadata): string | undefined {
    if (!metadata || Object.keys(metadata).length === 0) {
      return undefined;
    }

    try {
      return JSON.stringify(metadata);
    } catch {
      return '[unserializable-metadata]';
    }
  }

  private describeError(error?: unknown): {
    stack?: string;
    meta?: LogMetadata;
  } {
    if (!error) {
      return {};
    }

    if (error instanceof Error) {
      return {
        stack: error.stack,
        meta: {
          errorName: error.name,
          errorMessage: error.message,
        },
      };
    }

    if (typeof error === 'string') {
      return {
        meta: {
          errorMessage: error,
        },
      };
    }

    return {
      meta: {
        error,
      },
    };
  }

  private combineMetadata(
    metadata?: LogMetadata,
    extra?: LogMetadata,
  ): LogMetadata | undefined {
    if (!metadata && !extra) {
      return undefined;
    }

    return {
      ...(metadata ?? {}),
      ...(extra ?? {}),
    };
  }
}
