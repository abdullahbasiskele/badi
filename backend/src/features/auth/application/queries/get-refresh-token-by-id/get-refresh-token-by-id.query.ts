import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { RefreshToken } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export class GetRefreshTokenByIdQuery extends Query<RefreshToken | null> {
  constructor(public readonly tokenId: string) {
    super();
  }
}

@QueryHandler(GetRefreshTokenByIdQuery)
export class GetRefreshTokenByIdHandler
  implements IQueryHandler<GetRefreshTokenByIdQuery, RefreshToken | null>
{
  constructor(private readonly prisma: PrismaService) {}

  execute(query: GetRefreshTokenByIdQuery): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { id: query.tokenId },
    });
  }
}
