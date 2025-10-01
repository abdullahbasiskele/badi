import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AppAbility } from '@shared/application/policies/ability.factory';

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(prisma?: Prisma.TransactionClient) {
    return prisma ?? this.prisma;
  }

  async findAccessibleCourses(
    ability: AppAbility,
    subjectFilter?: string | null,
    prisma?: Prisma.TransactionClient,
  ) {
    const filters: Prisma.CourseWhereInput[] = [];
    const abilityFilter = accessibleBy(ability).Course as Prisma.CourseWhereInput;
    if (abilityFilter) {
      filters.push(abilityFilter);
    }

    if (subjectFilter) {
      filters.push({ subject: subjectFilter });
    }

    const where = filters.length > 0 ? { AND: filters } : {};

    return this.getClient(prisma).course.findMany({
      where,
      select: {
        id: true,
        title: true,
        subject: true,
        organizationId: true,
        isArchived: true,
        published: true,
        organization: { select: { name: true } },
        instructorId: true,
        instructor: { select: { displayName: true } },
      },
      orderBy: [{ title: 'asc' }],
    });
  }
}
