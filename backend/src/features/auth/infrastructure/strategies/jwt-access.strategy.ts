import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '@shared/application/policies/interfaces/auth-user.interface';
import { JwtAccessPayload } from '@shared/infrastructure/security/jwt-payload.interface';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,
      audience: configService.get<string>('JWT_ACCESS_AUDIENCE'),
      issuer: configService.getOrThrow<string>('JWT_ISSUER'),
    });
  }

  validate(payload: JwtAccessPayload): AuthUser {
    return {
      id: payload.sub,
      roles: payload.roles ?? [],
      subjectScopes: payload.subjectScopes ?? [],
      organizationId: payload.organizationId,
      permissions: payload.permissions ?? [],
    };
  }
}
