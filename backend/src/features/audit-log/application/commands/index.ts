import { DeleteOldHttpLogsHandler } from './delete-old-http-logs/delete-old-http-logs.handler';
import { RecordAuthActivityHandler } from './record-auth-activity/record-auth-activity.handler';
import { RecordHttpRequestLogHandler } from './record-http-log/record-http-request-log.handler';

export const auditLogCommandHandlers = [
  RecordHttpRequestLogHandler,
  RecordAuthActivityHandler,
  DeleteOldHttpLogsHandler,
];
