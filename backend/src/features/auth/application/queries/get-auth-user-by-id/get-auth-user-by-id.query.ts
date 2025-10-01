import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { AuthUserRepository } from '@features/auth/infrastructure/repositories';
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
  constructor(private readonly authUsers: AuthUserRepository) {}

  execute(query: GetAuthUserByIdQuery): Promise<AuthUserWithRelations | null> {
    return this.authUsers.findAuthUserById(query.userId);
  }
}
