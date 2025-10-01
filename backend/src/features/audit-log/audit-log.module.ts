import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { auditLogCommandHandlers } from '@features/audit-log/application/commands';
import { auditLogQueryHandlers } from '@features/audit-log/application/queries';
import { AuditLogRetentionService } from '@features/audit-log/application/services/audit-log-retention.service';
import { AuditTrailService } from '@features/audit-log/application/services/audit-trail.service';
import { HttpRequestLogFactory } from '@features/audit-log/domain/factories/http-request-log.factory';
import { HttpRequestLogRepository } from '@features/audit-log/infrastructure/repositories/http-request-log.repository';
import { AuditLogQueueProducer, AUDIT_LOG_QUEUE_PRODUCER } from '@features/audit-log/infrastructure/workers/audit-log-queue.producer';
import { AuditLogWorkerService } from '@features/audit-log/infrastructure/workers/audit-log-worker.service';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    HttpRequestLogFactory,
    HttpRequestLogRepository,
    AuditTrailService,
    AuditLogRetentionService,
    AuditLogWorkerService,
    {
      provide: AUDIT_LOG_QUEUE_PRODUCER,
      useClass: AuditLogQueueProducer,
    },
    ...auditLogCommandHandlers,
    ...auditLogQueryHandlers,
  ],
  exports: [AuditTrailService],
})
export class AuditLogModule {}
