import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { LoginUserCommand, RegisterUserCommand } from './application/commands';
import { LoginRequestDto } from './application/dto/login-request.dto';
import { RefreshTokenDto } from './application/dto/refresh-token.dto';
import { RegisterRequestDto } from './application/dto/register-request.dto';
import { TokenResponseDto } from './application/dto/token-response.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus, private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterRequestDto): Promise<TokenResponseDto> {
    return this.commandBus.execute(new RegisterUserCommand(dto.email, dto.password, dto.displayName));
  }

  @Post('login')
  async login(@Body() dto: LoginRequestDto): Promise<TokenResponseDto> {
    return this.commandBus.execute(new LoginUserCommand(dto.email, dto.password));
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
