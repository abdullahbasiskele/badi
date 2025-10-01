import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { AuthUserRepository } from '@features/auth/infrastructure/repositories';
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
  constructor(private readonly authUsers: AuthUserRepository) {}

  execute(query: GetAuthUserByEmailQuery): Promise<AuthUserWithRelations | null> {
    return this.authUsers.findAuthUserByEmail(query.email);
  }
}
