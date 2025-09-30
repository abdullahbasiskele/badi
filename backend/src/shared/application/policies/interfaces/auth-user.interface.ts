/**
 * Authenticated user context passed around guards and policies.
 * All identifiers are expected to be UUID strings.
 */
export interface AuthUser {
  id: string;
  roles: string[];
  subjectScopes: string[];
  organizationId?: string;
  permissions?: string[];
  [key: string]: unknown;
}
