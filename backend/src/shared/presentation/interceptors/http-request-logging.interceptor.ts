import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AuditTrailService } from '@features/audit-log/application/services/audit-trail.service';
import type { RecordHttpRequestLogPayload } from '@features/audit-log/application/commands/record-http-log/record-http-request-log.command';
import type { AuthUser } from '@shared/application/policies/interfaces/auth-user.interface';
import { AppLoggerService, type ContextualLogger, type LogMetadata } from '@shared/infrastructure/logging/app-logger.service';

@Injectable()
export class HttpRequestLoggingInterceptor implements NestInterceptor {
  private readonly logger: ContextualLogger;

  constructor(
    appLogger: AppLoggerService,
    private readonly auditTrail: AuditTrailService,
  ) {
    this.logger = appLogger.forContext(HttpRequestLoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request & { authUser?: AuthUser | null }>();
    const response = httpContext.getResponse<Response>();

    if (!request) {
      return next.handle();
    }

    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    const scopedLogger = this.logger.forContext(`${controllerName}.${handlerName}`);
    const startedAt = Date.now();

    const metadata: LogMetadata = {
      method: request.method,
      url: request.originalUrl ?? request.url,
    };

    if (request.params && Object.keys(request.params).length > 0) {
      metadata.params = request.params;
    }

    if (request.query && Object.keys(request.query).length > 0) {
      metadata.query = request.query;
    }

    if (request.body && typeof request.body === 'object' && !Array.isArray(request.body)) {
      metadata.bodyKeys = Object.keys(request.body as Record<string, unknown>);
    }

    scopedLogger.debug('HTTP request received', metadata);

    const captureLog = (payload: Partial<RecordHttpRequestLogPayload>) => {
      const auditPayload: RecordHttpRequestLogPayload = {
        method: request.method,
        path: this.extractPath(request),
        statusCode: payload.statusCode ?? response?.statusCode ?? 0,
        durationMs: Date.now() - startedAt,
        occurredAt: new Date(),
        ipAddress: this.extractIp(request),
        forwardedFor: this.headerToString(request.headers['x-forwarded-for']),
        userAgent: this.headerToString(request.headers['user-agent']),
        query: this.extractRecord(request.query),
        params: this.extractRecord(request.params),
        body: this.shouldCaptureBody(request.method) ? request.body : undefined,
        responseBody: payload.responseBody,
        authUser: request.authUser ?? null,
        correlationId: this.extractCorrelationId(request),
      };

      void this.auditTrail.captureHttpRequest(auditPayload);
    };

    return next.handle().pipe(
      tap({
        next: (value) => {
          const statusCode = response?.statusCode ?? 200;
          captureLog({ statusCode, responseBody: value });
          scopedLogger.debug('HTTP request completed', {
            statusCode,
            durationMs: Date.now() - startedAt,
          });
        },
      }),
      catchError((error) => {
        const statusCode = this.resolveStatusCode(error, response);
        captureLog({ statusCode, responseBody: this.extractErrorPayload(error) });
        scopedLogger.error('HTTP request failed', error, {
          statusCode,
          durationMs: Date.now() - startedAt,
        });
        return throwError(() => error);
      }),
    );
  }

  private extractPath(request: Request): string {
    if (request.path) {
      return request.path;
    }
    const url = request.originalUrl ?? request.url ?? '/';
    const [pathname] = url.split('?');
    return pathname || '/';
  }

  private shouldCaptureBody(method: string): boolean {
    const normalized = method?.toUpperCase() ?? 'GET';
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalized);
  }

  private extractIp(request: Request): string | null {
    if (typeof request.ip === 'string' && request.ip.trim().length > 0) {
      return request.ip;
    }
    const realIp = this.headerToString(request.headers['x-real-ip']);
    return realIp ?? null;
  }

  private headerToString(value: string | string[] | undefined): string | null {
    if (!value) {
      return null;
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private extractRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private extractCorrelationId(request: Request): string | null {
    return (
      this.headerToString(request.headers['x-correlation-id']) ??
      this.headerToString(request.headers['x-request-id']) ??
      this.headerToString(request.headers['x-trace-id'])
    );
  }

  private resolveStatusCode(error: unknown, response: Response | undefined): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }
    if (response?.statusCode) {
      return response.statusCode;
    }
    return 500;
  }

  private extractErrorPayload(error: unknown): unknown {
    if (error instanceof HttpException) {
      return error.getResponse();
    }
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
      };
    }
    return error;
  }
}

