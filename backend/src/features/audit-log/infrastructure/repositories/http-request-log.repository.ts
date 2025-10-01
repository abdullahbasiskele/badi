import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import type { Prisma } from '@prisma/client';
import { Prisma as PrismaNS } from '@prisma/client';
import { HttpRequestLog } from '@features/audit-log/domain/entities/http-request-log.entity';
import { HttpRequestLogSnapshot } from '@features/audit-log/domain/factories/http-request-log.factory';
import { AppAction, AppAbility } from '@shared/application/policies/ability.factory';
import type { AuthUser } from '@shared/application/policies/interfaces/auth-user.interface';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { HttpRequestLogListFilters } from '../../application/queries/list-http-request-logs/list-http-request-logs.query';

interface HttpRequestLogRecord extends HttpRequestLogSnapshot {}

interface ListResult {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  items: HttpRequestLogRecord[];
}

@Injectable()
export class HttpRequestLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createHttpRequestLog(log: HttpRequestLog, prisma?: Prisma.TransactionClient): Promise<void> {
    const snapshot = log.toSnapshot();
    const client = prisma ?? this.prisma;
    await client.httpRequestLog.create({
      data: {
        id: snapshot.id,
        occurredAt: snapshot.occurredAt,
        userId: snapshot.userId,
        organizationId: snapshot.organizationId,
        roles: snapshot.roles,
        subjectScopes: snapshot.subjectScopes,
        ipAddress: snapshot.ipAddress,
        forwardedFor: snapshot.forwardedFor,
        userAgent: snapshot.userAgent,
        method: snapshot.method,
        path: snapshot.path,
        statusCode: snapshot.statusCode,
        durationMs: snapshot.durationMs,
        queryJson: snapshot.queryJson,
        paramsJson: snapshot.paramsJson,
        bodyDigest: snapshot.bodyDigest,
        responseDigest: snapshot.responseDigest,
        correlationId: snapshot.correlationId,
      },
    });
  }

  async listHttpRequestLogs(
    ability: AppAbility,
    filters: HttpRequestLogListFilters,
    authUser: AuthUser | null,
  ): Promise<ListResult> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
    const skip = (page - 1) * pageSize;

    const whereConditions: Prisma.HttpRequestLogWhereInput[] = [];
    const abilityFilter = accessibleBy(ability, AppAction.Manage)
      .HttpRequestLog as Prisma.HttpRequestLogWhereInput;
    if (abilityFilter) {
      whereConditions.push(abilityFilter);
    }

    if (filters.from) {
      whereConditions.push({ occurredAt: { gte: filters.from } });
    }
    if (filters.to) {
      whereConditions.push({ occurredAt: { lte: filters.to } });
    }
    if (filters.userId) {
      whereConditions.push({ userId: filters.userId });
    }
    if (filters.statusCodes && filters.statusCodes.length > 0) {
      whereConditions.push({ statusCode: { in: filters.statusCodes } });
    }
    if (filters.minDurationMs !== null && filters.minDurationMs !== undefined) {
      whereConditions.push({ durationMs: { gte: Math.max(0, filters.minDurationMs) } });
    }
    if (filters.maxDurationMs !== null && filters.maxDurationMs !== undefined) {
      whereConditions.push({ durationMs: { lte: Math.max(0, filters.maxDurationMs) } });
    }
    if (filters.path) {
      whereConditions.push({ path: { contains: filters.path, mode: 'insensitive' } });
    }

    const where: Prisma.HttpRequestLogWhereInput = whereConditions.length
      ? { AND: whereConditions }
      : {};

    return this.prisma.$transaction(async (tx) => {
      await this.applyRlsContext(tx, ability, authUser);

      const [total, records] = await Promise.all([
        tx.httpRequestLog.count({ where }),
        tx.httpRequestLog.findMany({
          where,
          orderBy: { occurredAt: 'desc' },
          skip,
          take: pageSize,
          select: {
            id: true,
            occurredAt: true,
            userId: true,
            organizationId: true,
            roles: true,
            subjectScopes: true,
            ipAddress: true,
            forwardedFor: true,
            userAgent: true,
            method: true,
            path: true,
            statusCode: true,
            durationMs: true,
            queryJson: true,
            paramsJson: true,
            bodyDigest: true,
            responseDigest: true,
            correlationId: true,
          },
        }),
      ]);

      const hasMore = skip + records.length < total;

      return {
        total,
        page,
        pageSize,
        hasMore,
        items: records.map((record) => ({
          id: record.id,
          occurredAt: record.occurredAt,
          userId: record.userId,
          organizationId: record.organizationId,
          roles: record.roles ?? [],
          subjectScopes: record.subjectScopes ?? [],
          ipAddress: record.ipAddress,
          forwardedFor: record.forwardedFor,
          userAgent: record.userAgent,
          method: record.method,
          path: record.path,
          statusCode: record.statusCode,
          durationMs: record.durationMs,
          queryJson: (record.queryJson as Record<string, unknown> | null) ?? null,
          paramsJson: (record.paramsJson as Record<string, unknown> | null) ?? null,
          bodyDigest: record.bodyDigest,
          responseDigest: record.responseDigest,
          correlationId: record.correlationId,
        })),
      } satisfies ListResult;
    });
  }

  async deleteOlderThan(cutoffDate: Date): Promise<number> {
    const result = await this.prisma.httpRequestLog.deleteMany({
      where: { occurredAt: { lt: cutoffDate } },
    });
    return result.count;
  }

  private async applyRlsContext(
    tx: Prisma.TransactionClient,
    ability: AppAbility,
    authUser: AuthUser | null,
  ): Promise<void> {
    const isSystemAdmin = ability.can(AppAction.Manage, 'all');
    const organizationId = authUser?.organizationId ?? null;

    await tx.$executeRaw(
      PrismaNS.sql`select set_config('app.is_system_admin', ${
        isSystemAdmin ? 'true' : 'false'
      }, true)`,
    );

    await tx.$executeRaw(
      PrismaNS.sql`select set_config('app.organization_id', ${
        organizationId ?? ''
      }, true)`,
    );
  }
}

