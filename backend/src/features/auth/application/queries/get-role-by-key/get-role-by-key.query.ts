import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { Role, RoleKey } from '@prisma/client';
import { RoleRepository } from '@features/auth/infrastructure/repositories';

export class GetRoleByKeyQuery extends Query<Role | null> {
  constructor(public readonly key: RoleKey) {
    super();
  }
}

@QueryHandler(GetRoleByKeyQuery)
export class GetRoleByKeyHandler
  implements IQueryHandler<GetRoleByKeyQuery, Role | null>
{
  constructor(private readonly roles: RoleRepository) {}

  execute(query: GetRoleByKeyQuery): Promise<Role | null> {
    return this.roles.findByKey(query.key);
  }
}
