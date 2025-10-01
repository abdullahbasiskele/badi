import type { AuthUser } from '@shared/application/policies/interfaces/auth-user.interface';

export interface RecordHttpRequestLogPayload {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  occurredAt?: Date;
  ipAddress?: string | null;
  forwardedFor?: string | null;
  userAgent?: string | null;
  query?: Record<string, unknown> | null;
  params?: Record<string, unknown> | null;
  body?: unknown;
  responseBody?: unknown;
  authUser?: AuthUser | null;
  correlationId?: string | null;
}

export class RecordHttpRequestLogCommand {
  constructor(public readonly payload: RecordHttpRequestLogPayload) {}
}
