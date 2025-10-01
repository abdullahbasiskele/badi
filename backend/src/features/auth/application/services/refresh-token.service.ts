import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'crypto';
import { RefreshTokenRepository } from '@features/auth/infrastructure/repositories';
import { PrismaUnitOfWork } from '@shared/infrastructure/prisma/prisma-unit-of-work';

interface IssueTokenParams {
  userId: string;
  expiresAt: Date;
  limit: number;
}

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly tokens: RefreshTokenRepository,
    private readonly unitOfWork: PrismaUnitOfWork,
  ) {}

  async issueToken({ userId, expiresAt, limit }: IssueTokenParams): Promise<{
    token: string;
    tokenId: string;
    expiresAt: Date;
  }> {
    return this.unitOfWork.withTransaction(async (tx) => {
      const activeTokens = await this.tokens.findActiveByUser(userId, tx);

      const tokensToRevokeCount = Math.max(0, activeTokens.length + 1 - limit);
      if (tokensToRevokeCount > 0) {
        const ids = activeTokens.slice(0, tokensToRevokeCount).map((token) => token.id);
        await this.tokens.revokeMany(ids, new Date(), tx);
      }

      const tokenId = randomUUID();
      const secret = randomBytes(48).toString('base64url');
      const token = `${tokenId}.${secret}`;

      await this.tokens.create(
        {
          id: tokenId,
          userId,
          tokenHash: await argon2.hash(secret, { type: argon2.argon2id }),
          expiresAt,
        },
        tx,
      );

      return { token, tokenId, expiresAt };
    });
  }

  findById(tokenId: string) {
    return this.tokens.findById(tokenId);
  }

  async revoke(tokenId: string, prisma?: Prisma.TransactionClient): Promise<void> {
    await this.tokens.revoke(tokenId, new Date(), prisma);
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
