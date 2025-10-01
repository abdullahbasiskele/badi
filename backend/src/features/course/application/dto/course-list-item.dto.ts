import { Expose } from 'class-transformer';

export class CourseListItemDto {
  @Expose()
  id!: string;

  @Expose()
  title!: string;

  @Expose()
  subject!: string;

  @Expose()
  organizationId?: string | null;

  @Expose()
  organizationName?: string | null;

  @Expose()
  instructorId?: string | null;

  @Expose()
  instructorName?: string | null;

  @Expose()
  isArchived!: boolean;

  @Expose()
  published!: boolean;
}
