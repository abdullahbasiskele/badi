import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AuthUserWithRelations } from '../../models/auth-user.model';

export class GetAuthUserByIdQuery extends Query<AuthUserWithRelations | null> {
  constructor(public readonly userId: string) {
    super();
  }
}

@QueryHandler(GetAuthUserByIdQuery)
export class GetAuthUserByIdHandler
  implements IQueryHandler<GetAuthUserByIdQuery, AuthUserWithRelations | null>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetAuthUserByIdQuery,
  ): Promise<AuthUserWithRelations | null> {
    const { userId } = query;
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        subjectScopes: true,
        organization: true,
      },
    });
  }
}
