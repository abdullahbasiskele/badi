export interface AccessTokenClaims {
  sub: string;
  roles?: string[];
  organizationId?: string | null;
  subjectScopes?: string[];
  [key: string]: unknown;
}