import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { TokenResponseDto } from './application/dto/token-response.dto';

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    roles: { include: { role: true } };
    subjectScopes: true;
    organization: true;
  };
}>;

@Injectable()
export class AuthService {
  private static readonly DEFAULT_REFRESH_LIMIT = 3;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async generateTokenResponse(user: UserWithRelations): Promise<TokenResponseDto> {
    const roles = user.roles.map(r => r.role.key);
    const subjectScopes = user.subjectScopes.map(scope => scope.subject);
    const organizationId = user.organizationId ?? undefined;

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET', 'change-me');
    const accessTtl = this.configService.get<string>('JWT_ACCESS_TTL', '15m');
    const refreshTtl = this.configService.get<string>('JWT_REFRESH_TTL', '7d');
    const issuer = this.configService.get<string>('JWT_ISSUER', 'badi-backend');
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

    const refreshToken = await this.issueRefreshToken({ userId: user.id, refreshTtl });

    return this.buildTokenResponse({
      accessToken,
      refreshToken: refreshToken.token,
      accessExpiresIn: this.parseDurationToSeconds(accessTtl),
      refreshExpiresIn: this.parseDurationToSeconds(refreshTtl),
    });
  }

  async refresh(rawRefreshToken: string): Promise<TokenResponseDto> {
    const token = this.parseRefreshToken(rawRefreshToken);

    const tokenRecord = await this.prisma.refreshToken.findUnique({ where: { id: token.tokenId } });
    if (!tokenRecord || tokenRecord.revokedAt) {
      throw new UnauthorizedException('Yenileme tokenı bulunamadı veya geçersiz.');
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      await this.prisma.refreshToken.update({ where: { id: tokenRecord.id }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException('Yenileme tokenının süresi dolmuş.');
    }

    const matches = await argon2.verify(tokenRecord.tokenHash, token.secret);
    if (!matches) {
      await this.prisma.refreshToken.update({ where: { id: tokenRecord.id }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException('Yenileme tokenı doğrulanamadı.');
    }

    await this.prisma.refreshToken.update({ where: { id: tokenRecord.id }, data: { revokedAt: new Date() } });

    const user = await this.findUserWithRelations(tokenRecord.userId);
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı.');
    }

    return this.generateTokenResponse(user);
  }

  async revoke(rawRefreshToken: string): Promise<void> {
    try {
      const token = this.parseRefreshToken(rawRefreshToken);
      await this.prisma.refreshToken.update({
        where: { id: token.tokenId },
        data: { revokedAt: new Date() },
      });
    } catch {
      // format hatalıysa veya kayıt yoksa ekstra işlem gerekmiyor
    }
  }

  private async issueRefreshToken(params: { userId: string; refreshTtl: string }) {
    const limit = this.getRefreshTokenLimit();

    return this.prisma.$transaction(async tx => {
      const activeTokens = await tx.refreshToken.findMany({
        where: {
          userId: params.userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'asc' },
      });

      const tokensToRevokeCount = Math.max(0, activeTokens.length + 1 - limit);
      if (tokensToRevokeCount > 0) {
        const tokensToRevoke = activeTokens.slice(0, tokensToRevokeCount);
        const now = new Date();
        await Promise.all(
          tokensToRevoke.map(token =>
            tx.refreshToken.update({ where: { id: token.id }, data: { revokedAt: now } }),
          ),
        );
      }

      const tokenId = randomUUID();
      const secret = randomBytes(48).toString('base64url');
      const token = `${tokenId}.${secret}`;
      const expiresAt = this.calculateExpiresAt(params.refreshTtl);

      await tx.refreshToken.create({
        data: {
          id: tokenId,
          userId: params.userId,
          tokenHash: await argon2.hash(secret, { type: argon2.argon2id }),
          expiresAt,
        },
      });

      return { token, tokenId, expiresAt };
    });
  }

  private parseRefreshToken(token: string): { tokenId: string; secret: string } {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Geçersiz yenileme tokenı.');
    }
    const parts = token.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new UnauthorizedException('Geçersiz yenileme tokenı.');
    }
    return { tokenId: parts[0], secret: parts[1] };
  }

  private async findUserWithRelations(userId: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        subjectScopes: true,
        organization: true,
      },
    });
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
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
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
}
