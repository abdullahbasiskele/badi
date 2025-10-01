import type { TokenResponse } from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/shared/store/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const REFRESH_ENDPOINT = "/auth/refresh";

type FetchOptions = RequestInit & {
  json?: unknown;
  skipAuthRefresh?: boolean;
};

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function requestRefresh(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(buildUrl(REFRESH_ENDPOINT), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Yenileme isteği başarısız oldu.");
  }

  return (await response.json()) as TokenResponse;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
  attempt = 0,
): Promise<T> {
  const { json, headers, skipAuthRefresh, ...init } = options;
  const url = buildUrl(path);
  const body = json ? JSON.stringify(json) : init.body;
  const authState = useAuthStore.getState();
  const authHeaders = authState.accessToken
    ? { Authorization: `Bearer ${authState.accessToken}` }
    : undefined;

  const response = await fetch(url, {
    ...init,
    body,
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(authHeaders ?? {}),
      ...(headers ?? {}),
    },
    cache: "no-store",
  });

  const shouldAttemptRefresh =
    response.status === 401 &&
    !skipAuthRefresh &&
    attempt === 0 &&
    !!authState.refreshToken &&
    !url.endsWith(REFRESH_ENDPOINT);

  if (shouldAttemptRefresh) {
    try {
      const refreshed = await requestRefresh(authState.refreshToken as string);
      authState.setTokens(refreshed);
      return apiFetch<T>(
        path,
        { ...options, skipAuthRefresh: true },
        attempt + 1,
      );
    } catch (error) {
      authState.clear();
      throw new Error("Oturum süresi doldu. Lütfen yeniden giriş yapın.");
    }
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      message = data?.message ?? data?.error ?? message;
    } catch (error) {
      console.error(error);
    }
    throw new Error(message ?? "Beklenmeyen bir hata oluştu.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: Omit<FetchOptions, "json">,
): Promise<T> {
  return apiFetch<T>(path, { ...(options ?? {}), method: "POST", json: body });
}

