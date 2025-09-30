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
  subjectScopes: string[];
  setTokens: (tokens: TokenResponse) => void;
  clear: () => void;
}

const baseState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  refreshExpiresAt: null,
  roles: [] as string[],
  organizationId: null as string | null,
  subjectScopes: [] as string[],
};

type BaseState = typeof baseState;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...baseState,
      setTokens: ({ accessToken, refreshToken, expiresIn, refreshExpiresIn }) => {
        const now = Date.now();
        const claims = extractAccessTokenClaims(accessToken);

        set({
          accessToken,
          refreshToken,
          expiresAt: now + expiresIn * 1000,
          refreshExpiresAt: now + refreshExpiresIn * 1000,
          roles: normalizeRoles(claims?.roles),
          organizationId: typeof claims?.organizationId === "string" ? claims.organizationId : null,
          subjectScopes: normalizeSubjectScopes(claims?.subjectScopes),
        });
      },
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
        subjectScopes: state.subjectScopes,
      }) satisfies BaseState,
    },
  ),
);