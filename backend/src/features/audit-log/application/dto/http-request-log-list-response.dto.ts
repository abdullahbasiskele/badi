import { Expose, Type } from 'class-transformer';
import { HttpRequestLogListItemDto } from './http-request-log-list-item.dto';

export class HttpRequestLogListResponseDto {
  @Expose()
  total!: number;

  @Expose()
  page!: number;

  @Expose()
  pageSize!: number;

  @Expose()
  hasMore!: boolean;

  @Expose()
  @Type(() => HttpRequestLogListItemDto)
  items!: HttpRequestLogListItemDto[];
}
