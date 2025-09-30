import type { AccessTokenClaims } from "@/shared/types/auth";
import { decodeJwtPayload } from "./jwt";

const ROLE_PRIORITY: string[] = ["system-admin", "organization-admin", "teacher", "participant"];

const ROLE_REDIRECT_MAP: Record<string, string> = {
  "system-admin": "/admin",
  "organization-admin": "/admin",
  teacher: "/teacher",
  participant: "/",
};

export function extractAccessTokenClaims(token: string): AccessTokenClaims | null {
  return decodeJwtPayload<AccessTokenClaims>(token);
}

export function normalizeRoles(roles: unknown): string[] {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles
    .filter((role): role is string => typeof role === "string" && role.length > 0)
    .map(role => role.toLowerCase().replace(/_/g, "-"));
}

export function normalizeSubjectScopes(scopes: unknown): string[] {
  if (!Array.isArray(scopes)) {
    return [];
  }

  return scopes.filter((scope): scope is string => typeof scope === "string" && scope.length > 0);
}

export function extractNormalizedRoles(token: string): string[] {
  const claims = extractAccessTokenClaims(token);
  return normalizeRoles(claims?.roles);
}

export function resolveRedirectPath(roles: string[]): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role) && ROLE_REDIRECT_MAP[role]) {
      return ROLE_REDIRECT_MAP[role];
    }
  }
  return "/dashboard";
}