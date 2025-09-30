import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakClient {
  constructor(private readonly configService: ConfigService) {}

  // Placeholder for future HTTP exchange with Keycloak
  async exchangeCode(_params: { code: string; redirectUri: string; codeVerifier?: string }): Promise<void> {
    const tokenUrl = this.configService.get<string>('KEYCLOAK_TOKEN_URL');
    if (!tokenUrl) {
      throw new Error('KEYCLOAK_TOKEN_URL is not configured');
    }

    // TODO: implement fetch call to Keycloak token endpoint
  }
}
