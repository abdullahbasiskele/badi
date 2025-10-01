export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: string;
  userId: string;
  email: string;
  displayName: string | null;
  roles: string[];
  subjectScopes: string[];
  organizationId: string | null;
  organizationName: string | null;
  permissions: string[];
}

export interface AuthProfile {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
  subjectScopes: string[];
  organizationId: string | null;
  organizationName: string | null;
  permissions: string[];
}
