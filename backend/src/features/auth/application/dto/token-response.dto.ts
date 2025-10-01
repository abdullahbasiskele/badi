import { Expose } from 'class-transformer';

export class TokenResponseDto {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;

  @Expose()
  expiresIn!: number;

  @Expose()
  refreshExpiresIn!: number;

  @Expose()
  tokenType: string = 'Bearer';

  @Expose()
  userId!: string;

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
