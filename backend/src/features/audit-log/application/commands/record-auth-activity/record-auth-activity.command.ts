import type { AuthUser } from '@shared/application/policies/interfaces/auth-user.interface';

declare type AuthActivityEvent = 'login' | 'logout' | 'refresh-token' | string;

export interface RecordAuthActivityPayload {
  event: AuthActivityEvent;
  statusCode: number;
  durationMs: number;
  occurredAt?: Date;
  ipAddress?: string | null;
  forwardedFor?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown> | null;
  authUser?: AuthUser | null;
  correlationId?: string | null;
}

export class RecordAuthActivityCommand {
  constructor(public readonly payload: RecordAuthActivityPayload) {}
}
