import type { RecordAuthActivityPayload } from '@features/audit-log/application/commands/record-auth-activity/record-auth-activity.command';
import type { RecordHttpRequestLogPayload } from '@features/audit-log/application/commands/record-http-log/record-http-request-log.command';

export const AUDIT_LOG_QUEUE_NAME = 'audit-log';

export type AuditLogJobData =
  | {
      type: 'http-request-log';
      payload: RecordHttpRequestLogPayload;
    }
  | {
      type: 'auth-activity';
      payload: RecordAuthActivityPayload;
    };

export enum AuditLogJobName {
  HttpRequestLog = 'http-request-log',
  AuthActivity = 'auth-activity',
}
