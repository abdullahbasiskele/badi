import { apiPost } from "@/shared/services/http-client";
import { TokenResponse } from "../types/auth.types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  displayName?: string;
}

export const authService = {
  async login(payload: LoginPayload) {
    return apiPost<TokenResponse>("/auth/login", payload);
  },

  async register(payload: RegisterPayload) {
    return apiPost<TokenResponse>("/auth/register", payload);
  },

  async refresh(refreshToken: string) {
    return apiPost<TokenResponse>("/auth/refresh", { refreshToken });
  },

  async logout(refreshToken: string) {
    if (!refreshToken) {
      return;
    }
    try {
      await apiPost<void>("/auth/logout", { refreshToken });
    } catch (error) {
      console.error("Logout request failed", error);
    }
  },
};