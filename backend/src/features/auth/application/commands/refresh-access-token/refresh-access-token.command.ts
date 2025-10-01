import { UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { TransactionalCommand } from '@shared/application/pipeline/decorators/transactional-command.decorator';
import { AuthService } from '@features/auth/auth.service';
import { TokenResponseDto } from '../../dto/token-response.dto';
import { RefreshTokenService } from '../../services/refresh-token.service';
import { GetAuthUserByIdQuery } from '../../queries/get-auth-user-by-id/get-auth-user-by-id.query';
import { GetRefreshTokenByIdQuery } from '../../queries/get-refresh-token-by-id/get-refresh-token-by-id.query';

@TransactionalCommand()
export class RefreshAccessTokenCommand {
  constructor(public readonly refreshToken: string) {}
}

@CommandHandler(RefreshAccessTokenCommand)
export class RefreshAccessTokenHandler
  implements ICommandHandler<RefreshAccessTokenCommand, TokenResponseDto>
{
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: RefreshAccessTokenCommand): Promise<TokenResponseDto> {
    const token = this.authService.parseRefreshToken(command.refreshToken);

    const tokenRecord = await this.queryBus.execute(
      new GetRefreshTokenByIdQuery(token.tokenId),
    );
    if (!tokenRecord || tokenRecord.revokedAt) {
      throw new UnauthorizedException(
        'Yenileme tokeni bulunamadı veya geçersiz.',
      );
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      await this.refreshTokens.revokeSilently(tokenRecord.id);
      throw new UnauthorizedException('Yenileme tokeninin süresi doldu.');
    }

    const matches = await this.refreshTokens.verifySecret(
      tokenRecord.tokenHash,
      token.secret,
    );
    if (!matches) {
      await this.refreshTokens.revokeSilently(tokenRecord.id);
      throw new UnauthorizedException('Yenileme tokeni doğrulanamadı.');
    }

    await this.refreshTokens.revoke(tokenRecord.id);

    const user = await this.queryBus.execute(
      new GetAuthUserByIdQuery(tokenRecord.userId),
    );
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı.');
    }

    return this.authService.generateTokenResponse(user);
  }
}
