export interface JwtAccessPayload {
  sub: string;
  roles?: string[];
  subjectScopes?: string[];
  organizationId?: string;
  permissions?: string[];
  [key: string]: unknown;
}

export interface JwtRefreshPayload {
  sub: string;
  tokenId: string;
  issuedAt?: number;
  jwtid?: string;
  [key: string]: unknown;
}
