import { Expose, Type } from 'class-transformer';

export class HttpRequestLogListItemDto {
  @Expose()
  id!: string;

  @Expose()
  method!: string;

  @Expose()
  path!: string;

  @Expose()
  statusCode!: number;

  @Expose()
  durationMs!: number;

  @Expose()
  userId!: string | null;

  @Expose()
  organizationId!: string | null;

  @Expose()
  roles!: string[];

  @Expose()
  subjectScopes!: string[];

  @Expose()
  ipAddress!: string | null;

  @Expose()
  forwardedFor!: string | null;

  @Expose()
  userAgent!: string | null;

  @Expose()
  correlationId!: string | null;

  @Expose()
  bodyDigest!: string | null;

  @Expose()
  responseDigest!: string | null;

  @Expose()
  queryJson!: Record<string, unknown> | null;

  @Expose()
  paramsJson!: Record<string, unknown> | null;

  @Expose()
  @Type(() => Date)
  occurredAt!: Date;
}
