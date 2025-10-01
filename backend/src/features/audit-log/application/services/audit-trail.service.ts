import { Inject, Injectable, Optional } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { RecordHttpRequestLogCommand, type RecordHttpRequestLogPayload } from '@features/audit-log/application/commands/record-http-log/record-http-request-log.command';
import { RecordAuthActivityCommand, type RecordAuthActivityPayload } from '@features/audit-log/application/commands/record-auth-activity/record-auth-activity.command';
import { DeleteOldHttpLogsCommand } from '@features/audit-log/application/commands/delete-old-http-logs/delete-old-http-logs.command';
import { AuditLogQueueProducer, AUDIT_LOG_QUEUE_PRODUCER } from '@features/audit-log/infrastructure/workers/audit-log-queue.producer';
import { AppLoggerService, type ContextualLogger } from '@shared/infrastructure/logging/app-logger.service';

const DEFAULT_RETENTION_DAYS = 180;

type TransportMode = 'command' | 'queue';

@Injectable()
export class AuditTrailService {
  private readonly logger: ContextualLogger;
  private readonly retentionDays: number;
  private readonly transport: TransportMode;
  private readonly queueFallback: boolean;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly configService: ConfigService,
    appLogger: AppLoggerService,
    @Optional()
    @Inject(AUDIT_LOG_QUEUE_PRODUCER)
    private readonly queueProducer: AuditLogQueueProducer | null,
  ) {
    this.logger = appLogger.forContext(AuditTrailService.name);
    this.transport = this.resolveTransport();
    this.retentionDays = this.resolveRetentionDays();
    const queueReady = this.queueProducer?.isReady() ?? false;
    this.queueFallback = this.transport === 'queue' && !queueReady;

    if (this.transport === 'queue' && !queueReady) {
      this.logger.warn(
        'Audit-log queue transport requested but connection is not configured; falling back to command transport.',
      );
    }
  }

  async captureHttpRequest(payload: RecordHttpRequestLogPayload): Promise<void> {
    try {
      if (this.shouldUseQueue()) {
        await this.queueProducer!.enqueueHttpRequestLog(payload);
        return;
      }

      await this.commandBus.execute(new RecordHttpRequestLogCommand(payload));
    } catch (error) {
      this.logger.error('Failed to record HTTP request audit entry.', error, {
        transport: this.transport,
      });
    }
  }

  async recordAuthActivity(payload: RecordAuthActivityPayload): Promise<void> {
    try {
      if (this.shouldUseQueue()) {
        await this.queueProducer!.enqueueAuthActivity(payload);
        return;
      }

      await this.commandBus.execute(new RecordAuthActivityCommand(payload));
    } catch (error) {
      this.logger.error('Failed to record auth activity audit entry.', error, {
        transport: this.transport,
      });
    }
  }

  async purgeExpiredHttpLogs(): Promise<void> {
    const cutoff = this.buildCutoffDate();
    try {
      await this.commandBus.execute(new DeleteOldHttpLogsCommand(cutoff));
    } catch (error) {
      this.logger.error('Failed to prune expired HTTP logs.', error, {
        cutoff: cutoff.toISOString(),
      });
    }
  }

  getRetentionDays(): number {
    return this.retentionDays;
  }

  buildCutoffDate(): Date {
    const now = new Date();
    const cutoff = new Date(now.getTime());
    cutoff.setUTCDate(cutoff.getUTCDate() - this.retentionDays);
    return cutoff;
  }

  private shouldUseQueue(): boolean {
    if (this.transport !== 'queue') {
      return false;
    }
    if (this.queueFallback) {
      return false;
    }
    return (this.queueProducer?.isReady() ?? false) === true;
  }

  private resolveTransport(): TransportMode {
    const raw = this.configService.get<string>('AUDIT_LOG_TRANSPORT');
    if (!raw) {
      return 'command';
    }
    return raw.toLowerCase() === 'queue' ? 'queue' : 'command';
  }

  private resolveRetentionDays(): number {
    const raw = this.configService.get<string>('AUDIT_LOG_RETENTION_DAYS');
    if (!raw) {
      return DEFAULT_RETENTION_DAYS;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return DEFAULT_RETENTION_DAYS;
    }
    return Math.min(parsed, 365);
  }
}
