import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AuthUserWithRelations } from '../../application/models/auth-user.model';

@Injectable()
export class AuthUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(prisma?: Prisma.TransactionClient) {
    return prisma ?? this.prisma;
  }

  async findAuthUserByEmail(
    email: string,
    prisma?: Prisma.TransactionClient,
  ): Promise<AuthUserWithRelations | null> {
    return this.getClient(prisma).user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
        subjectScopes: true,
        organization: true,
      },
    });
  }

  async findAuthUserById(
    id: string,
    prisma?: Prisma.TransactionClient,
  ): Promise<AuthUserWithRelations | null> {
    return this.getClient(prisma).user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        subjectScopes: true,
        organization: true,
      },
    });
  }

  async existsByEmail(email: string, prisma?: Prisma.TransactionClient): Promise<boolean> {
    const existing = await this.getClient(prisma).user.findUnique({
      where: { email },
      select: { id: true },
    });
    return Boolean(existing);
  }

  async createParticipant(
    params: {
      email: string;
      passwordHash: string;
      displayName?: string | null;
      roleId: string;
    },
    prisma?: Prisma.TransactionClient,
  ): Promise<AuthUserWithRelations> {
    return this.getClient(prisma).user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        displayName: params.displayName ?? null,
        roles: {
          create: [{ role: { connect: { id: params.roleId } } }],
        },
      },
      include: {
        roles: { include: { role: true } },
        subjectScopes: true,
        organization: true,
      },
    });
  }
}
