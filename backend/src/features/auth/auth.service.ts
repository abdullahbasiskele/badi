import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { TokenResponseDto } from './application/dto/token-response.dto';
import { AuthUserWithRelations } from './application/models/auth-user.model';
import { RefreshTokenService } from './application/services/refresh-token.service';

@Injectable()
export class AuthService {
  private static readonly DEFAULT_REFRESH_LIMIT = 3;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async generateTokenResponse(
    user: AuthUserWithRelations,
  ): Promise<TokenResponseDto> {
    const roles = user.roles.map((r) => r.role.key);
    const subjectScopes = user.subjectScopes.map((scope) => scope.subject);
    const organizationId = user.organizationId ?? undefined;

    const accessSecret = this.getRequiredConfig('JWT_ACCESS_SECRET');
    const accessTtl = this.getRequiredConfig('JWT_ACCESS_TTL');
    const refreshTtl = this.getRequiredConfig('JWT_REFRESH_TTL');
    const issuer = this.getRequiredConfig('JWT_ISSUER');
    const audience = this.configService.get<string>('JWT_ACCESS_AUDIENCE');

    const accessPayload = {
      sub: user.id,
      roles,
      subjectScopes,
      organizationId,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: accessSecret,
      expiresIn: accessTtl,
      issuer,
      audience,
    });

    const refreshExpiresAt = this.calculateExpiresAt(refreshTtl);
    const refreshToken = await this.refreshTokens.issueToken({
      userId: user.id,
      expiresAt: refreshExpiresAt,
      limit: this.getRefreshTokenLimit(),
    });

    return this.buildTokenResponse({
      accessToken,
      refreshToken: refreshToken.token,
      accessExpiresIn: this.parseDurationToSeconds(accessTtl),
      refreshExpiresIn: this.parseDurationToSeconds(refreshTtl),
    });
  }

  public parseRefreshToken(token: string): { tokenId: string; secret: string } {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Geçersiz yenileme tokenı.');
    }
    const parts = token.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new UnauthorizedException('Geçersiz yenileme tokenı.');
    }
    return { tokenId: parts[0], secret: parts[1] };
  }

  private calculateExpiresAt(ttl: string): Date {
    const seconds = this.parseDurationToSeconds(ttl);
    return new Date(Date.now() + seconds * 1000);
  }

  private parseDurationToSeconds(value: string): number {
    const match = /^([0-9]+)([smhd])?$/i.exec(value.trim());
    if (!match) {
      throw new Error(`Geçersiz süre formatı: ${value}`);
    }
    const amount = parseInt(match[1], 10);
    const unit = (match[2] || 's').toLowerCase();
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return amount * multipliers[unit];
  }

  private buildTokenResponse(params: {
    accessToken: string;
    refreshToken: string;
    accessExpiresIn: number;
    refreshExpiresIn: number;
  }): TokenResponseDto {
    return {
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      expiresIn: params.accessExpiresIn,
      refreshExpiresIn: params.refreshExpiresIn,
      tokenType: 'Bearer',
    };
  }

  private getRefreshTokenLimit(): number {
    const raw = this.configService.get<string>('AUTH_REFRESH_TOKEN_LIMIT');
    const parsed = raw ? Number(raw) : AuthService.DEFAULT_REFRESH_LIMIT;
    if (Number.isNaN(parsed) || parsed < 1) {
      return AuthService.DEFAULT_REFRESH_LIMIT;
    }
    return Math.floor(parsed);
  }

  private getRequiredConfig(key: string): string {
    return this.configService.getOrThrow<string>(key);
  }
}
