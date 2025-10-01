import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditTrailService } from './audit-trail.service';

const DEFAULT_INTERVAL_MINUTES = 1440; // 24 saat

@Injectable()
export class AuditLogRetentionService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly auditTrail: AuditTrailService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    if (!this.isEnabled()) {
      return;
    }

    const intervalMs = this.resolveIntervalMinutes() * 60 * 1000;
    this.timer = setInterval(() => {
      void this.auditTrail.purgeExpiredHttpLogs();
    }, intervalMs).unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private isEnabled(): boolean {
    const raw = this.configService.get<string>('AUDIT_LOG_PRUNE_ENABLED');
    if (!raw) {
      return true;
    }
    return raw.toLowerCase() !== 'false';
  }

  private resolveIntervalMinutes(): number {
    const raw = this.configService.get<string>('AUDIT_LOG_PRUNE_INTERVAL_MINUTES');
    if (!raw) {
      return DEFAULT_INTERVAL_MINUTES;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return DEFAULT_INTERVAL_MINUTES;
    }
    return Math.min(parsed, 24 * 60);
  }
}
