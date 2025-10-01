import { TransactionalCommand } from '@shared/application/pipeline/decorators/transactional-command.decorator';
import type { AuthUser } from '@shared/application/policies/interfaces/auth-user.interface';

@TransactionalCommand()
export class CreateTeacherCommand {
  constructor(
    public readonly email: string,
    public readonly displayName: string,
    public readonly subject: string,
    public readonly createdBy: AuthUser,
    public readonly organizationId?: string | null,
    public readonly password?: string | null,
  ) {}
}
