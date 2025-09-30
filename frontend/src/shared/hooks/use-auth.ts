import { useCallback, useMemo } from "react";
import { authService, LoginPayload, RegisterPayload } from "@/features/auth/services/auth-service";
import type { TokenResponse } from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/shared/store/auth-store";

export function useAuth() {
  const {
    accessToken,
    refreshToken,
    expiresAt,
    refreshExpiresAt,
    roles,
    organizationId,
    subjectScopes,
    setTokens,
    clear,
  } = useAuthStore();

  const login = useCallback(async (payload: LoginPayload): Promise<TokenResponse> => {
    const tokens = await authService.login(payload);
    setTokens(tokens);
    return tokens;
  }, [setTokens]);

  const register = useCallback(async (payload: RegisterPayload): Promise<TokenResponse> => {
    const tokens = await authService.register(payload);
    setTokens(tokens);
    return tokens;
  }, [setTokens]);

  const logout = useCallback(async (): Promise<void> => {
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (error) {
        console.error('Logout failed', error);
      }
    }
    clear();
  }, [refreshToken, clear]);

  const isAuthenticated = useMemo(() => Boolean(accessToken), [accessToken]);

  return {
    accessToken,
    refreshToken,
    expiresAt,
    refreshExpiresAt,
    roles,
    organizationId,
    subjectScopes,
    isAuthenticated,
    login,
    register,
    logout,
  };
}