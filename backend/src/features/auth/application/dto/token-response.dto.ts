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
}
