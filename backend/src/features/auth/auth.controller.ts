import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ExchangeTokenDto } from './application/dto/exchange-token.dto';
import { RefreshTokenDto } from './application/dto/refresh-token.dto';
import { TokenResponseDto } from './application/dto/token-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  async exchangeToken(@Body() dto: ExchangeTokenDto): Promise<TokenResponseDto> {
    return this.authService.exchangeAuthorizationCode(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.revoke(dto.refreshToken);
  }
}
