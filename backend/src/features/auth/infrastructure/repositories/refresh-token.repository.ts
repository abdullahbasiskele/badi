import { Injectable } from '@nestjs/common';
import type { Prisma, RefreshToken } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(prisma?: Prisma.TransactionClient) {
    return prisma ?? this.prisma;
  }

  async findById(id: string, prisma?: Prisma.TransactionClient): Promise<RefreshToken | null> {
    return this.getClient(prisma).refreshToken.findUnique({ where: { id } });
  }

  async findActiveByUser(
    userId: string,
    prisma?: Prisma.TransactionClient,
  ): Promise<RefreshToken[]> {
    return this.getClient(prisma).refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async revokeMany(ids: string[], revokedAt: Date, prisma?: Prisma.TransactionClient): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.getClient(prisma).refreshToken.updateMany({
      where: { id: { in: ids } },
      data: { revokedAt },
    });
  }

  async create(
    data: {
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    },
    prisma?: Prisma.TransactionClient,
  ): Promise<RefreshToken> {
    return this.getClient(prisma).refreshToken.create({ data });
  }

  async revoke(id: string, revokedAt: Date, prisma?: Prisma.TransactionClient): Promise<void> {
    await this.getClient(prisma).refreshToken.update({
      where: { id },
      data: { revokedAt },
    });
  }
}
