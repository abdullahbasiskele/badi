import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtRefreshPayload } from '@shared/infrastructure/security/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET', 'change-me-too'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(_request: unknown, payload: JwtRefreshPayload): JwtRefreshPayload {
    if (!payload?.sub || !payload?.tokenId) {
      throw new UnauthorizedException('Refresh token payload missing subject or token id');
    }

    return payload;
  }
}

