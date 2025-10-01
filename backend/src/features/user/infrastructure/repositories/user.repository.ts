import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(prisma?: Prisma.TransactionClient | null) {
    return prisma ?? this.prisma;
  }

  findById(id: string, prisma?: Prisma.TransactionClient) {
    return this.getClient(prisma).user.findUnique({
      where: { id },
      include: {
        organization: true,
        subjectScopes: true,
        roles: { include: { role: true } },
      },
    });
  }

  updateProfile(
    id: string,
    data: {
      displayName?: string | null;
      locale?: string | null;
    },
    prisma?: Prisma.TransactionClient,
  ) {
    return this.getClient(prisma).user.update({
      where: { id },
      data,
      include: {
        organization: true,
        subjectScopes: true,
        roles: { include: { role: true } },
      },
    });
  }

  listByOrganization(organizationId: string, prisma?: Prisma.TransactionClient) {
    return this.getClient(prisma).user.findMany({
      where: { organizationId },
      include: {
        roles: { include: { role: true } },
        subjectScopes: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
