import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import {
  LoginUserCommand,
  RefreshAccessTokenCommand,
  RegisterUserCommand,
  RevokeRefreshTokenCommand,
} from '../../application/commands';
import { LoginRequestDto } from '../../application/dto/login-request.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import { RegisterRequestDto } from '../../application/dto/register-request.dto';
import { TokenResponseDto } from '../../application/dto/token-response.dto';
import { JwtAccessGuard } from '../../application/guards/jwt-access.guard';
import { AuthProfileDto } from '../../application/dto/auth-profile.dto';
import { GetAuthUserByIdQuery } from '../../application/queries/get-auth-user-by-id/get-auth-user-by-id.query';
import { AuthUser } from '@shared/application/policies/interfaces/auth-user.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterRequestDto): Promise<TokenResponseDto> {
    return this.commandBus.execute(
      new RegisterUserCommand(dto.email, dto.password, dto.displayName),
    );
  }

  @Post('login')
  async login(@Body() dto: LoginRequestDto): Promise<TokenResponseDto> {
    return this.commandBus.execute(
      new LoginUserCommand(dto.email, dto.password),
    );
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.commandBus.execute(
      new RefreshAccessTokenCommand(dto.refreshToken),
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.commandBus.execute(
      new RevokeRefreshTokenCommand(dto.refreshToken),
    );
  }

  @Get('profile')
  @UseGuards(JwtAccessGuard)
  async profile(@Req() request: Request): Promise<AuthProfileDto> {
    const authUser = request.authUser as AuthUser | undefined;
    if (!authUser) {
      throw new UnauthorizedException('Oturum bilgisi bulunamadı.');
    }

    const user = await this.queryBus.execute(
      new GetAuthUserByIdQuery(authUser.id),
    );

    if (!user) {
      throw new UnauthorizedException('Kullanıcı profili bulunamadı.');
    }

    const roles = user.roles.map((r) =>
      r.role.key.toLowerCase().replace(/_/g, '-'),
    );
    const subjectScopes = user.subjectScopes.map((scope) => scope.subject);
    const organizationName = user.organization?.name ?? null;

    return plainToInstance(AuthProfileDto, {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? null,
      roles,
      subjectScopes,
      organizationId: user.organizationId ?? null,
      organizationName,
      permissions: [],
    });
  }
}
