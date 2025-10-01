import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpRequestLogFactory } from '@features/audit-log/domain/factories/http-request-log.factory';
import { HttpRequestLogRepository } from '@features/audit-log/infrastructure/repositories/http-request-log.repository';
import type { AuthUser } from '@shared/application/policies/interfaces/auth-user.interface';
import { RecordAuthActivityCommand } from './record-auth-activity.command';

@CommandHandler(RecordAuthActivityCommand)
@Injectable()
export class RecordAuthActivityHandler
  implements ICommandHandler<RecordAuthActivityCommand, void>
{
  constructor(
    private readonly factory: HttpRequestLogFactory,
    private readonly repository: HttpRequestLogRepository,
  ) {}

  async execute(command: RecordAuthActivityCommand): Promise<void> {
    const payload = command.payload;
    const authUser: AuthUser | null = payload.authUser ?? null;

    const log = this.factory.createAuthActivityLog({
      occurredAt: payload.occurredAt,
      event: payload.event,
      statusCode: payload.statusCode,
      durationMs: payload.durationMs,
      userId: authUser?.id ?? null,
      organizationId: authUser?.organizationId ?? null,
      roles: authUser?.roles ?? null,
      subjectScopes: authUser?.subjectScopes ?? null,
      ipAddress: payload.ipAddress ?? null,
      forwardedFor: payload.forwardedFor ?? null,
      userAgent: payload.userAgent ?? null,
      details: payload.details ?? null,
      correlationId: payload.correlationId ?? null,
    });

    await this.repository.createHttpRequestLog(log);
  }
}
