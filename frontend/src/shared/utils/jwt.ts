export function decodeJwtPayload<T extends Record<string, unknown>>(token: string): T | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  const payload = segments[1];
  if (!payload) {
    return null;
  }

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const base64 = normalized + padding;

  try {
    let json: string;
    if (typeof window === 'undefined') {
      json = Buffer.from(base64, 'base64').toString('utf-8');
    } else {
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      json = new TextDecoder().decode(bytes);
    }

    return JSON.parse(json) as T;
  } catch (error) {
    console.error('decodeJwtPayload failed', error);
    return null;
  }
}