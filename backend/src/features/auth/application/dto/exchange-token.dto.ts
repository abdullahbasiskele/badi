import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExchangeTokenDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  redirectUri!: string;

  @IsString()
  @IsOptional()
  codeVerifier?: string;
}
