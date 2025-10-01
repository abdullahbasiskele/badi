import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpRequestLogFactory } from '@features/audit-log/domain/factories/http-request-log.factory';
import { HttpRequestLogRepository } from '@features/audit-log/infrastructure/repositories/http-request-log.repository';
import type { AuthUser } from '@shared/application/policies/interfaces/auth-user.interface';
import { RecordHttpRequestLogCommand } from './record-http-request-log.command';

@CommandHandler(RecordHttpRequestLogCommand)
@Injectable()
export class RecordHttpRequestLogHandler
  implements ICommandHandler<RecordHttpRequestLogCommand, void>
{
  constructor(
    private readonly factory: HttpRequestLogFactory,
    private readonly repository: HttpRequestLogRepository,
  ) {}

  async execute(command: RecordHttpRequestLogCommand): Promise<void> {
    const payload = command.payload;
    const authUser: AuthUser | null = payload.authUser ?? null;

    const log = this.factory.createFromHttpRequest({
      occurredAt: payload.occurredAt,
      method: payload.method,
      path: payload.path,
      statusCode: payload.statusCode,
      durationMs: payload.durationMs,
      ipAddress: payload.ipAddress ?? null,
      forwardedFor: payload.forwardedFor ?? null,
      userAgent: payload.userAgent ?? null,
      correlationId: payload.correlationId ?? null,
      query: this.pickRecord(payload.query),
      params: this.pickRecord(payload.params),
      body: payload.body,
      responseBody: payload.responseBody,
      userId: authUser?.id ?? null,
      organizationId: authUser?.organizationId ?? null,
      roles: authUser?.roles ?? null,
      subjectScopes: authUser?.subjectScopes ?? null,
    });

    await this.repository.createHttpRequestLog(log);
  }

  private pickRecord(value?: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!value) {
      return null;
    }
    return value;
  }
}
