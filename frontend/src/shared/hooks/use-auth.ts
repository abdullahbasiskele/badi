import { useCallback, useMemo } from "react";
import {
  authService,
  LoginPayload,
  RegisterPayload,
} from "@/features/auth/services/auth-service";
import type { AuthProfile, TokenResponse } from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/shared/store/auth-store";

export function useAuth() {
  const {
    accessToken,
    refreshToken,
    expiresAt,
    refreshExpiresAt,
    roles,
    organizationId,
    organizationName,
    subjectScopes,
    userId,
    email,
    displayName,
    permissions,
    setTokens,
    setProfile,
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
        console.error("Logout failed", error);
      }
    }
    clear();
  }, [refreshToken, clear]);

  const fetchProfile = useCallback(async (): Promise<AuthProfile> => {
    const profile = await authService.getProfile();
    setProfile({
      roles: profile.roles,
      subjectScopes: profile.subjectScopes,
      organizationId: profile.organizationId,
      organizationName: profile.organizationName,
      displayName: profile.displayName,
      email: profile.email,
      permissions: profile.permissions,
      userId: profile.id,
    });
    return profile;
  }, [setProfile]);

  const isAuthenticated = useMemo(() => Boolean(accessToken), [accessToken]);

  return {
    accessToken,
    refreshToken,
    expiresAt,
    refreshExpiresAt,
    roles,
    organizationId,
    organizationName,
    subjectScopes,
    userId,
    email,
    displayName,
    permissions,
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
  };
}
