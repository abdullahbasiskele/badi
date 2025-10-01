import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { accessibleBy } from '@casl/prisma';
import type { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { AppAbility } from '@shared/application/policies/ability.factory';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CourseListItemDto } from '../../dto/course-list-item.dto';

export class ListCoursesQuery extends Query<CourseListItemDto[]> {
  constructor(
    public readonly ability: AppAbility,
    public readonly subject?: string | null,
  ) {
    super();
  }
}

@QueryHandler(ListCoursesQuery)
export class ListCoursesHandler
  implements IQueryHandler<ListCoursesQuery, CourseListItemDto[]>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListCoursesQuery): Promise<CourseListItemDto[]> {
    const { ability, subject } = query;
    const filters: Prisma.CourseWhereInput[] = [];

    const abilityFilter = accessibleBy(ability).Course as
      | Prisma.CourseWhereInput
      | undefined;
    if (abilityFilter) {
      filters.push(abilityFilter);
    }

    if (subject) {
      filters.push({ subject });
    }

    const where: Prisma.CourseWhereInput =
      filters.length > 0 ? { AND: filters } : {};

    const courses = await this.prisma.course.findMany({
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

    return courses.map((course) =>
      plainToInstance(CourseListItemDto, {
        id: course.id,
        title: course.title,
        subject: course.subject,
        organizationId: course.organizationId ?? null,
        organizationName: course.organization?.name ?? null,
        instructorId: course.instructorId ?? null,
        instructorName: course.instructor?.displayName ?? null,
        isArchived: course.isArchived,
        published: course.published,
      }),
    );
  }
}
