import { UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransactionalCommand } from '@shared/application/pipeline/decorators/transactional-command.decorator';
import { AuthService } from '@features/auth/auth.service';
import { AuthUserRepository } from '@features/auth/infrastructure/repositories';
import { TokenResponseDto } from '../../dto/token-response.dto';
import { RefreshTokenService } from '../../services/refresh-token.service';

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
    private readonly authUsers: AuthUserRepository,
  ) {}

  async execute(command: RefreshAccessTokenCommand): Promise<TokenResponseDto> {
    const token = this.authService.parseRefreshToken(command.refreshToken);

    const tokenRecord = await this.refreshTokens.findById(token.tokenId);
    if (!tokenRecord || tokenRecord.revokedAt) {
      throw new UnauthorizedException('Yenileme tokeni bulunamadı veya geçersiz.');
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

    const user = await this.authUsers.findAuthUserById(tokenRecord.userId);
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı.');
    }

    return this.authService.generateTokenResponse(user);
  }
}
