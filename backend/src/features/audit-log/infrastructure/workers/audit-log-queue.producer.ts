import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { URL } from 'node:url';
import type { RecordAuthActivityPayload } from '@features/audit-log/application/commands/record-auth-activity/record-auth-activity.command';
import type { RecordHttpRequestLogPayload } from '@features/audit-log/application/commands/record-http-log/record-http-request-log.command';
import { AuditLogJobData, AuditLogJobName, AUDIT_LOG_QUEUE_NAME } from './audit-log-queue.types';
import { AppLoggerService, type ContextualLogger } from '@shared/infrastructure/logging/app-logger.service';

export const AUDIT_LOG_QUEUE_PRODUCER = Symbol('AUDIT_LOG_QUEUE_PRODUCER');

@Injectable()
export class AuditLogQueueProducer implements OnModuleDestroy {
  private readonly logger: ContextualLogger;
  private readonly queue: Queue<AuditLogJobData> | null;
  private readonly jobOptions = {
    removeOnComplete: 1000,
    removeOnFail: 200,
  } as const;

  constructor(
    private readonly configService: ConfigService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(AuditLogQueueProducer.name);
    this.queue = this.createQueue();
  }

  isReady(): boolean {
    return this.queue !== null;
  }

  async enqueueHttpRequestLog(payload: RecordHttpRequestLogPayload): Promise<void> {
    if (!this.queue) {
      throw new Error('Audit-log queue is not configured.');
    }
    await this.queue.add(
      AuditLogJobName.HttpRequestLog,
      {
        type: 'http-request-log',
        payload,
      },
      this.jobOptions,
    );
  }

  async enqueueAuthActivity(payload: RecordAuthActivityPayload): Promise<void> {
    if (!this.queue) {
      throw new Error('Audit-log queue is not configured.');
    }
    await this.queue.add(
      AuditLogJobName.AuthActivity,
      {
        type: 'auth-activity',
        payload,
      },
      this.jobOptions,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
  }

  private createQueue(): Queue<AuditLogJobData> | null {
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

      return new Queue<AuditLogJobData>(AUDIT_LOG_QUEUE_NAME, {
        connection: {
          host: parsed.hostname,
          port,
          username: parsed.username || undefined,
          password: parsed.password || undefined,
          tls: isSecure ? {} : undefined,
        },
      });
    } catch (error) {
      this.logger.error('Failed to set up audit-log queue connection.', error, {
        url,
      });
      return null;
    }
  }
}


