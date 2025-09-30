import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy, VerifyCallback } from 'passport-oauth2';

@Injectable()
export class KeycloakOAuthStrategy extends PassportStrategy(OAuth2Strategy, 'keycloak') {
  constructor(configService: ConfigService) {
    super({
      authorizationURL: configService.get<string>('KEYCLOAK_AUTH_URL', ''),
      tokenURL: configService.get<string>('KEYCLOAK_TOKEN_URL', ''),
      clientID: configService.get<string>('KEYCLOAK_CLIENT_ID', ''),
      clientSecret: configService.get<string>('KEYCLOAK_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>('KEYCLOAK_CALLBACK_URL', ''),
      scope: ['openid', 'profile', 'email'],
      passReqToCallback: false,
    });
  }

  validate(accessToken: string, refreshToken: string, profile: unknown, done: VerifyCallback): void {
    done(null, { accessToken, refreshToken, profile });
  }
}
