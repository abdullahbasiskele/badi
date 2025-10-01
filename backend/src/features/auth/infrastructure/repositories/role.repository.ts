import { Injectable } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(prisma?: Prisma.TransactionClient) {
    return prisma ?? this.prisma;
  }

  findByKey(key: RoleKey, prisma?: Prisma.TransactionClient) {
    return this.getClient(prisma).role.findUnique({ where: { key } });
  }
}
