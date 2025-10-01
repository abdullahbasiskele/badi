import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class TeacherRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(prisma?: Prisma.TransactionClient) {
    return prisma ?? this.prisma;
  }

  async createTeacher(
    params: {
      email: string;
      passwordHash: string;
      displayName: string;
      organizationId: string | null;
      roleId: string;
      subject: string;
    },
    prisma?: Prisma.TransactionClient,
  ) {
    return this.getClient(prisma).user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        displayName: params.displayName,
        organizationId: params.organizationId,
        roles: {
          create: [{ role: { connect: { id: params.roleId } } }],
        },
        subjectScopes: {
          create: [{ subject: params.subject }],
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        organizationId: true,
        subjectScopes: {
          select: { subject: true },
        },
      },
    });
  }
}
