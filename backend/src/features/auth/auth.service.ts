import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ExchangeTokenDto } from './application/dto/exchange-token.dto';
import { TokenResponseDto } from './application/dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(private readonly _jwtService: JwtService, private readonly _configService: ConfigService) {}

  async exchangeAuthorizationCode(_dto: ExchangeTokenDto): Promise<TokenResponseDto> {
    throw new NotImplementedException('OAuth2 code exchange to be implemented');
  }

  async refresh(_refreshToken: string): Promise<TokenResponseDto> {
    throw new NotImplementedException('Refresh token rotation to be implemented');
  }

  async revoke(_refreshToken: string): Promise<void> {
    // TODO: persist refresh token blacklist and revoke logic (refresh token storage will rely on UUID primary keys).
  }

  protected buildTokenResponse(params: {
    accessToken: string;
    refreshToken: string;
    accessExpiresIn: number;
    refreshExpiresIn: number;
  }): TokenResponseDto {
    return {
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      expiresIn: params.accessExpiresIn,
      refreshExpiresIn: params.refreshExpiresIn,
      tokenType: 'Bearer',
    };
  }
}


