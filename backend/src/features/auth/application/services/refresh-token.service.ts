import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

interface IssueTokenParams {
  userId: string;
  expiresAt: Date;
  limit: number;
}

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async issueToken({ userId, expiresAt, limit }: IssueTokenParams): Promise<{
    token: string;
    tokenId: string;
    expiresAt: Date;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const activeTokens = await tx.refreshToken.findMany({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'asc' },
      });

      const tokensToRevokeCount = Math.max(0, activeTokens.length + 1 - limit);
      if (tokensToRevokeCount > 0) {
        const ids = activeTokens
          .slice(0, tokensToRevokeCount)
          .map((token) => token.id);
        const now = new Date();
        await tx.refreshToken.updateMany({
          where: { id: { in: ids } },
          data: { revokedAt: now },
        });
      }

      const tokenId = randomUUID();
      const secret = randomBytes(48).toString('base64url');
      const token = `${tokenId}.${secret}`;

      await tx.refreshToken.create({
        data: {
          id: tokenId,
          userId,
          tokenHash: await argon2.hash(secret, { type: argon2.argon2id }),
          expiresAt,
        },
      });

      return { token, tokenId, expiresAt };
    });
  }

  async findById(tokenId: string) {
    return this.prisma.refreshToken.findUnique({ where: { id: tokenId } });
  }

  async revoke(tokenId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeSilently(tokenId: string): Promise<void> {
    try {
      await this.revoke(tokenId);
    } catch {
      // record may already be revoked or missing
    }
  }

  async verifySecret(hash: string, secret: string): Promise<boolean> {
    return argon2.verify(hash, secret);
  }
}
