import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AuthUserWithRelations } from '../../models/auth-user.model';

export class GetAuthUserByEmailQuery extends Query<AuthUserWithRelations | null> {
  constructor(public readonly email: string) {
    super();
  }
}

@QueryHandler(GetAuthUserByEmailQuery)
export class GetAuthUserByEmailHandler
  implements
    IQueryHandler<GetAuthUserByEmailQuery, AuthUserWithRelations | null>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetAuthUserByEmailQuery,
  ): Promise<AuthUserWithRelations | null> {
    const { email } = query;
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
        subjectScopes: true,
        organization: true,
      },
    });
  }
}
