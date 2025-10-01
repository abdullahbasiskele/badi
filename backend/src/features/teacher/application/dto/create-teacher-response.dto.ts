import { Expose } from 'class-transformer';

export class CreateTeacherResponseDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  displayName!: string | null;

  @Expose()
  subject!: string;

  @Expose()
  organizationId!: string | null;

  @Expose()
  temporaryPassword?: string | null;
}
