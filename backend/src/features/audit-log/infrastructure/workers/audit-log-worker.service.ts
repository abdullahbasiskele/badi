import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { QueueScheduler, Worker } from 'bullmq';
import { URL } from 'node:url';
import { RecordAuthActivityCommand } from '@features/audit-log/application/commands/record-auth-activity/record-auth-activity.command';
import { RecordHttpRequestLogCommand } from '@features/audit-log/application/commands/record-http-log/record-http-request-log.command';
import { AuditLogJobData, AuditLogJobName, AUDIT_LOG_QUEUE_NAME } from './audit-log-queue.types';
import { AppLoggerService, type ContextualLogger } from '@shared/infrastructure/logging/app-logger.service';

@Injectable()
export class AuditLogWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger: ContextualLogger;
  private worker: Worker<AuditLogJobData> | null = null;
  private scheduler: QueueScheduler | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(AuditLogWorkerService.name);
  }

  async onModuleInit(): Promise<void> {
    if (!this.shouldEnableWorker()) {
      this.logger.debug('Audit-log worker disabled by configuration.');
      return;
    }

    const connection = this.createConnectionOptions();
    if (!connection) {
      this.logger.warn('Audit-log worker connection configuration not found.');
      return;
    }

    this.scheduler = new QueueScheduler(AUDIT_LOG_QUEUE_NAME, { connection });

    this.worker = new Worker<AuditLogJobData>(
      AUDIT_LOG_QUEUE_NAME,
      async (job) => {
        await this.handleJob(job.data);
      },
      { connection },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error('Audit-log job failed.', error, {
        jobId: job?.id,
        name: job?.name,
      });
    });

    this.worker.on('error', (error) => {
      this.logger.error('Audit-log worker encountered an error.', error);
    });

    this.logger.debug('Audit-log worker started.');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.scheduler) {
      await this.scheduler.close();
      this.scheduler = null;
    }
  }

  private shouldEnableWorker(): boolean {
    const transport = this.configService.get<string>('AUDIT_LOG_TRANSPORT');
    return transport?.toLowerCase() === 'queue';
  }

  private createConnectionOptions(): Record<string, unknown> | null {
    const url =
      this.configService.get<string>('AUDIT_LOG_QUEUE_URL') ??
      this.configService.get<string>('VALKEY_URL') ??
      this.configService.get<string>('REDIS_URL');

    if (!url) {
      return null;
    }

    try {
      const parsed = new URL(url);
      const port = parsed.port ? Number.parseInt(parsed.port, 10) : 6379;
      const isSecure = parsed.protocol === 'rediss:';

      return {
        host: parsed.hostname,
        port,
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        tls: isSecure ? {} : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to resolve audit-log worker connection.', error, {
        url,
      });
      return null;
    }
  }

  private async handleJob(data: AuditLogJobData): Promise<void> {
    switch (data.type) {
      case AuditLogJobName.HttpRequestLog:
        await this.commandBus.execute(new RecordHttpRequestLogCommand(data.payload));
        return;
      case AuditLogJobName.AuthActivity:
        await this.commandBus.execute(new RecordAuthActivityCommand(data.payload));
        return;
      default:
        this.logger.warn('Received unknown audit-log job.', { type: (data as any)?.type });
    }
  }
}



