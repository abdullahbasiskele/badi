import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { RefreshToken } from '@prisma/client';
import { RefreshTokenRepository } from '@features/auth/infrastructure/repositories';

export class GetRefreshTokenByIdQuery extends Query<RefreshToken | null> {
  constructor(public readonly tokenId: string) {
    super();
  }
}

@QueryHandler(GetRefreshTokenByIdQuery)
export class GetRefreshTokenByIdHandler
  implements IQueryHandler<GetRefreshTokenByIdQuery, RefreshToken | null>
{
  constructor(private readonly refreshTokens: RefreshTokenRepository) {}

  execute(query: GetRefreshTokenByIdQuery): Promise<RefreshToken | null> {
    return this.refreshTokens.findById(query.tokenId);
  }
}
