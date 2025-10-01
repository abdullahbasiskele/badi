import { Expose } from 'class-transformer';

export class AuthProfileDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  displayName?: string | null;

  @Expose()
  roles: string[] = [];

  @Expose()
  subjectScopes: string[] = [];

  @Expose()
  organizationId?: string | null;

  @Expose()
  organizationName?: string | null;

  @Expose()
  permissions: string[] = [];
}
