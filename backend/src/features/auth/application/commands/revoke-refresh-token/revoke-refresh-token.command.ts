import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransactionalCommand } from '@shared/application/pipeline/decorators/transactional-command.decorator';
import { AuthService } from '@features/auth/auth.service';
import { RefreshTokenService } from '../../services/refresh-token.service';

@TransactionalCommand()
export class RevokeRefreshTokenCommand {
  constructor(public readonly refreshToken: string) {}
}

@CommandHandler(RevokeRefreshTokenCommand)
export class RevokeRefreshTokenHandler
  implements ICommandHandler<RevokeRefreshTokenCommand, void>
{
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async execute(command: RevokeRefreshTokenCommand): Promise<void> {
    try {
      const token = this.authService.parseRefreshToken(command.refreshToken);
      await this.refreshTokens.revokeSilently(token.tokenId);
    } catch {
      // invalid refresh tokens can be ignored during logout
    }
  }
}
