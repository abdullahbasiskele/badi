import { useAuthStore } from "@/shared/store/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type FetchOptions = RequestInit & { json?: unknown };

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch<T>(path: string, { json, headers, ...init }: FetchOptions = {}): Promise<T> {
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
      "Content-Type": "application/json",
      ...(authHeaders ?? {}),
      ...(headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      message = data?.message ?? data?.error ?? message;
    } catch (error) {
      console.error(error);
    }
    throw new Error(message ?? "Beklenmeyen bir hata oluştu");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", json: body });
}