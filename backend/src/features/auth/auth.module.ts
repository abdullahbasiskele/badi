import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AbilityFactory } from '../../shared/application/policies/ability.factory';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { commandHandlers } from './application/commands';
import { queryHandlers } from './application/queries';
import { RefreshTokenService } from './application/services/refresh-token.service';
import { JwtAccessGuard } from './application/guards/jwt-access.guard';
import { JwtAccessStrategy } from './infrastructure/strategies/jwt-access.strategy';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    PassportModule.register({
      defaultStrategy: 'jwt-access',
      property: 'authUser',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_ACCESS_TTL'),
          issuer: config.getOrThrow<string>('JWT_ISSUER'),
          audience: config.get<string>('JWT_ACCESS_AUDIENCE'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    JwtAccessStrategy,
    JwtAccessGuard,
    AbilityFactory,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [AuthService, AbilityFactory, PassportModule, JwtAccessGuard],
})
export class AuthModule {}
