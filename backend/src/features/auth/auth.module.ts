import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AbilityFactory } from '../../shared/application/policies/ability.factory';
import { KeycloakClient } from '../../shared/infrastructure/oauth/keycloak.client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './infrastructure/strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './infrastructure/strategies/jwt-refresh.strategy';
import { KeycloakOAuthStrategy } from './infrastructure/strategies/keycloak.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt-access', property: 'authUser' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET', 'change-me'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_TTL', '15m'),
          issuer: config.get<string>('JWT_ISSUER', 'badi-platform'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    KeycloakClient,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    KeycloakOAuthStrategy,
    AbilityFactory,
  ],
  exports: [AuthService, AbilityFactory, PassportModule],
})
export class AuthModule {}

