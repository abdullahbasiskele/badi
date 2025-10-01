import { TransactionalCommand } from '@shared/application/pipeline/decorators/transactional-command.decorator';

@TransactionalCommand()
export class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly displayName?: string,
  ) {}
}
