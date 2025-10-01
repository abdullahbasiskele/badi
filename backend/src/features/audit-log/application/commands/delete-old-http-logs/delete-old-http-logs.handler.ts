import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppLoggerService, type ContextualLogger } from '@shared/infrastructure/logging/app-logger.service';
import { HttpRequestLogRepository } from '@features/audit-log/infrastructure/repositories/http-request-log.repository';
import { DeleteOldHttpLogsCommand } from './delete-old-http-logs.command';

@CommandHandler(DeleteOldHttpLogsCommand)
@Injectable()
export class DeleteOldHttpLogsHandler
  implements ICommandHandler<DeleteOldHttpLogsCommand, number>
{
  private readonly logger: ContextualLogger;

  constructor(
    private readonly repository: HttpRequestLogRepository,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(DeleteOldHttpLogsHandler.name);
  }

  async execute(command: DeleteOldHttpLogsCommand): Promise<number> {
    const deletedCount = await this.repository.deleteOlderThan(command.cutoffDate);
    this.logger.debug('Purged outdated HTTP logs', {
      cutoffDate: command.cutoffDate.toISOString(),
      deletedCount,
    });
    return deletedCount;
  }
}
