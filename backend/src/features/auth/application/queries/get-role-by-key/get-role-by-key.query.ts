import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { Role, RoleKey } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export class GetRoleByKeyQuery extends Query<Role | null> {
  constructor(public readonly key: RoleKey) {
    super();
  }
}

@QueryHandler(GetRoleByKeyQuery)
export class GetRoleByKeyHandler
  implements IQueryHandler<GetRoleByKeyQuery, Role | null>
{
  constructor(private readonly prisma: PrismaService) {}

  execute(query: GetRoleByKeyQuery): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { key: query.key } });
  }
}
