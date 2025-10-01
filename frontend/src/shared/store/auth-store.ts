import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TokenResponse } from "@/features/auth/types/auth.types";
import {
  extractAccessTokenClaims,
  normalizeRoles,
  normalizeSubjectScopes,
} from "@/shared/utils/auth";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  refreshExpiresAt: number | null;
  roles: string[];
  organizationId: string | null;
  organizationName: string | null;
  subjectScopes: string[];
  userId: string | null;
  email: string | null;
  displayName: string | null;
  permissions: string[];
  setTokens: (tokens: TokenResponse) => void;
  setProfile: (profile: Partial<Omit<AuthState, "setTokens" | "setProfile" | "clear">>) => void;
  clear: () => void;
}

const baseState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  refreshExpiresAt: null,
  roles: [] as string[],
  organizationId: null as string | null,
  organizationName: null as string | null,
  subjectScopes: [] as string[],
  userId: null as string | null,
  email: null as string | null,
  displayName: null as string | null,
  permissions: [] as string[],
};

type BaseState = typeof baseState;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...baseState,
      setTokens: ({
        accessToken,
        refreshToken,
        expiresIn,
        refreshExpiresIn,
        roles,
        subjectScopes,
        organizationId,
        organizationName,
        displayName,
        email,
        userId,
        permissions,
      }) => {
        const now = Date.now();
        const claims = extractAccessTokenClaims(accessToken);
        const normalizedRoles = roles?.length
          ? normalizeRoles(roles)
          : normalizeRoles(claims?.roles);
        const normalizedScopes = subjectScopes?.length
          ? normalizeSubjectScopes(subjectScopes)
          : normalizeSubjectScopes(claims?.subjectScopes);

        set({
          accessToken,
          refreshToken,
          expiresAt: now + expiresIn * 1000,
          refreshExpiresAt: now + refreshExpiresIn * 1000,
          roles: normalizedRoles,
          organizationId:
            typeof organizationId === "string" && organizationId.length > 0
              ? organizationId
              : typeof claims?.organizationId === "string"
                ? claims.organizationId
                : null,
          organizationName: organizationName ?? null,
          subjectScopes: normalizedScopes,
          userId: userId ?? (typeof claims?.sub === "string" ? claims.sub : null),
          email: email ?? null,
          displayName: displayName ?? null,
          permissions: Array.isArray(permissions) ? permissions : [],
        });
      },
      setProfile: (profile) =>
        set((state) => ({
          ...state,
          roles: profile.roles?.length ? normalizeRoles(profile.roles) : state.roles,
          subjectScopes: profile.subjectScopes?.length
            ? normalizeSubjectScopes(profile.subjectScopes)
            : state.subjectScopes,
          organizationId:
            profile.organizationId !== undefined
              ? profile.organizationId
              : state.organizationId,
          organizationName:
            profile.organizationName !== undefined
              ? profile.organizationName
              : state.organizationName,
          displayName:
            profile.displayName !== undefined ? profile.displayName : state.displayName,
          email: profile.email !== undefined ? profile.email : state.email,
          permissions: profile.permissions ?? state.permissions,
          userId: profile.userId !== undefined ? profile.userId : state.userId,
        })),
      clear: () => set({ ...baseState }),
    }),
    {
      name: "badi-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        refreshExpiresAt: state.refreshExpiresAt,
        roles: state.roles,
        organizationId: state.organizationId,
        organizationName: state.organizationName,
        subjectScopes: state.subjectScopes,
        userId: state.userId,
        email: state.email,
        displayName: state.displayName,
        permissions: state.permissions,
      }) satisfies BaseState,
    },
  ),
);
