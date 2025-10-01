import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';
import { CourseRepository } from '@features/course/infrastructure/repositories/course.repository';
import { AppAbility } from '@shared/application/policies/ability.factory';
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
  constructor(private readonly courses: CourseRepository) {}

  async execute(query: ListCoursesQuery): Promise<CourseListItemDto[]> {
    const records = await this.courses.findAccessibleCourses(
      query.ability,
      query.subject,
    );

    return records.map((course) =>
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
