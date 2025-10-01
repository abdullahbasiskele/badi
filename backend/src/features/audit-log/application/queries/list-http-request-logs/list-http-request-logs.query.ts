import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';
import { HttpRequestLogRepository } from '@features/audit-log/infrastructure/repositories/http-request-log.repository';
import { HttpRequestLogListItemDto } from '@features/audit-log/application/dto/http-request-log-list-item.dto';
import { HttpRequestLogListResponseDto } from '@features/audit-log/application/dto/http-request-log-list-response.dto';
import { AppAbility } from '@shared/application/policies/ability.factory';
import type { AuthUser } from '@shared/application/policies/interfaces/auth-user.interface';

export interface HttpRequestLogListFilters {
  page?: number;
  pageSize?: number;
  from?: Date | null;
  to?: Date | null;
  userId?: string | null;
  statusCodes?: number[] | null;
  minDurationMs?: number | null;
  maxDurationMs?: number | null;
  path?: string | null;
}

export class ListHttpRequestLogsQuery extends Query<HttpRequestLogListResponseDto> {
  constructor(
    public readonly ability: AppAbility,
    public readonly filters: HttpRequestLogListFilters,
    public readonly authUser: AuthUser | null,
  ) {
    super();
  }
}

@QueryHandler(ListHttpRequestLogsQuery)
export class ListHttpRequestLogsHandler
  implements IQueryHandler<ListHttpRequestLogsQuery, HttpRequestLogListResponseDto>
{
  constructor(private readonly repository: HttpRequestLogRepository) {}

  async execute(
    query: ListHttpRequestLogsQuery,
  ): Promise<HttpRequestLogListResponseDto> {
    const result = await this.repository.listHttpRequestLogs(
      query.ability,
      query.filters,
      query.authUser,
    );

    return plainToInstance(HttpRequestLogListResponseDto, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      items: result.items.map((item) =>
        plainToInstance(HttpRequestLogListItemDto, {
          id: item.id,
          occurredAt: item.occurredAt,
          method: item.method,
          path: item.path,
          statusCode: item.statusCode,
          durationMs: item.durationMs,
          userId: item.userId,
          organizationId: item.organizationId,
          roles: item.roles,
          subjectScopes: item.subjectScopes,
          ipAddress: item.ipAddress,
          forwardedFor: item.forwardedFor,
          userAgent: item.userAgent,
          correlationId: item.correlationId,
          bodyDigest: item.bodyDigest,
          responseDigest: item.responseDigest,
          queryJson: item.queryJson,
          paramsJson: item.paramsJson,
        }),
      ),
    });
  }
}
