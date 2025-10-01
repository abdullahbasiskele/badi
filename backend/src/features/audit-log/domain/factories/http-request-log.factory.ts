import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { HttpRequestLog } from '../entities/http-request-log.entity';

export interface HttpRequestLogSnapshot {
  id: string;
  occurredAt: Date;
  userId: string | null;
  organizationId: string | null;
  roles: string[];
  subjectScopes: string[];
  ipAddress: string | null;
  forwardedFor: string | null;
  userAgent: string | null;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  queryJson: Record<string, unknown> | null;
  paramsJson: Record<string, unknown> | null;
  bodyDigest: string | null;
  responseDigest: string | null;
  correlationId: string | null;
}

export interface HttpRequestLogFactoryInput {
  occurredAt?: Date;
  userId?: string | null;
  organizationId?: string | null;
  roles?: string[] | null;
  subjectScopes?: string[] | null;
  ipAddress?: string | null;
  forwardedFor?: string | null;
  userAgent?: string | null;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  query?: Record<string, unknown> | null;
  params?: Record<string, unknown> | null;
  body?: unknown;
  responseBody?: unknown;
  correlationId?: string | null;
}

export interface AuthActivityLogInput {
  occurredAt?: Date;
  userId?: string | null;
  organizationId?: string | null;
  roles?: string[] | null;
  subjectScopes?: string[] | null;
  ipAddress?: string | null;
  forwardedFor?: string | null;
  userAgent?: string | null;
  event: 'login' | 'logout' | 'refresh-token' | string;
  statusCode: number;
  durationMs: number;
  details?: Record<string, unknown> | null;
  correlationId?: string | null;
}

@Injectable()
export class HttpRequestLogFactory {
  private readonly maxStringLength = 512;
  private readonly maxUserAgentLength = 1024;
  private readonly maxPathLength = 512;
  private readonly maxObjectKeys = 32;
  private readonly maxArrayItems = 25;
  private readonly maxDepth = 5;
  private readonly maxDigestSourceLength = 4096;

  createFromHttpRequest(input: HttpRequestLogFactoryInput): HttpRequestLog {
    const snapshot: HttpRequestLogSnapshot = {
      id: randomUUID(),
      occurredAt: input.occurredAt ?? new Date(),
      userId: input.userId ?? null,
      organizationId: input.organizationId ?? null,
      roles: this.normalizeStringList(input.roles),
      subjectScopes: this.normalizeStringList(input.subjectScopes),
      ipAddress: this.cleanSingleLine(input.ipAddress),
      forwardedFor: this.cleanSingleLine(input.forwardedFor),
      userAgent: this.cleanSingleLine(input.userAgent, this.maxUserAgentLength),
      method: this.cleanMethod(input.method),
      path: this.cleanPath(input.path),
      statusCode: this.clampStatusCode(input.statusCode),
      durationMs: this.clampDuration(input.durationMs),
      queryJson: this.prepareJson(input.query),
      paramsJson: this.prepareJson(input.params),
      bodyDigest: this.prepareDigest(input.body),
      responseDigest: this.prepareDigest(input.responseBody),
      correlationId: this.cleanSingleLine(input.correlationId),
    };

    return HttpRequestLog.create(snapshot);
  }

  createAuthActivityLog(input: AuthActivityLogInput): HttpRequestLog {
    const syntheticPath = `/auth/activity/${this.cleanMethod(input.event)}`;
    return this.createFromHttpRequest({
      occurredAt: input.occurredAt,
      userId: input.userId,
      organizationId: input.organizationId,
      roles: input.roles,
      subjectScopes: input.subjectScopes,
      ipAddress: input.ipAddress,
      forwardedFor: input.forwardedFor,
      userAgent: input.userAgent,
      method: 'AUTH',
      path: syntheticPath,
      statusCode: input.statusCode,
      durationMs: this.clampDuration(input.durationMs),
      body: input.details ?? null,
      responseBody: null,
      query: null,
      params: null,
      correlationId: input.correlationId,
    });
  }

  private cleanMethod(method: string): string {
    const value = method?.trim().toUpperCase() ?? 'UNKNOWN';
    return value.slice(0, 16) || 'UNKNOWN';
  }

  private cleanPath(path: string): string {
    const trimmed = path?.trim() ?? '/unknown';
    return trimmed.slice(0, this.maxPathLength) || '/unknown';
  }

  private cleanSingleLine(value?: string | null, maxLength = this.maxStringLength): string | null {
    if (!value) {
      return null;
    }
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return null;
    }
    return normalized.slice(0, maxLength);
  }

  private normalizeStringList(values?: string[] | null): string[] {
    if (!values || values.length === 0) {
      return [];
    }
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of values) {
      const sanitized = this.cleanSingleLine(value, 64);
      if (!sanitized) {
        continue;
      }
      if (seen.has(sanitized)) {
        continue;
      }
      seen.add(sanitized);
      result.push(sanitized);
      if (result.length >= this.maxArrayItems) {
        break;
      }
    }
    return result;
  }

  private clampStatusCode(statusCode: number): number {
    if (!Number.isFinite(statusCode)) {
      return 0;
    }
    return Math.max(0, Math.min(999, Math.trunc(statusCode)));
  }

  private clampDuration(durationMs: number): number {
    if (!Number.isFinite(durationMs)) {
      return 0;
    }
    return Math.max(0, Math.min(60_000, Math.trunc(durationMs)));
  }

  private prepareJson(value?: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!value) {
      return null;
    }
    const sanitized = this.sanitizeValue(value, 0);
    if (!sanitized || typeof sanitized !== 'object' || Array.isArray(sanitized)) {
      return null;
    }
    if (Object.keys(sanitized).length === 0) {
      return null;
    }
    return sanitized as Record<string, unknown>;
  }

  private prepareDigest(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const sanitized = this.sanitizeValue(value, 0);
    if (sanitized === null || sanitized === undefined) {
      return null;
    }
    const serialized = this.stringifySafe(sanitized);
    if (!serialized) {
      return null;
    }
    const truncated = serialized.slice(0, this.maxDigestSourceLength);
    return this.hash(truncated);
  }

  private sanitizeValue(value: unknown, depth: number): unknown {
    if (value === null || value === undefined) {
      return null;
    }

    if (depth >= this.maxDepth) {
      return '[depth-limit]';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return this.sanitizeArray(value, depth + 1);
    }

    switch (typeof value) {
      case 'string':
        return this.sanitizeString(value);
      case 'number':
        if (!Number.isFinite(value)) {
          return '[non-finite-number]';
        }
        return value;
      case 'boolean':
        return value;
      case 'object':
        return this.sanitizeObject(value as Record<string, unknown>, depth + 1);
      default:
        return `[${typeof value}]`;
    }
  }

  private sanitizeString(value: string): string {
    const normalized = value.trim();
    if (!normalized) {
      return '';
    }

    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    const phoneRegex = /(?:\+?\d[\d\s-]{7,}\d)/g;
    const maskedEmail = normalized.replace(emailRegex, '[redacted-email]');
    const maskedPhone = maskedEmail.replace(phoneRegex, '[redacted-phone]');
    const collapsedWhitespace = maskedPhone.replace(/\s+/g, ' ');

    if (collapsedWhitespace.length <= this.maxStringLength) {
      return collapsedWhitespace;
    }

    return `${collapsedWhitespace.slice(0, this.maxStringLength - 3)}...`;
  }

  private sanitizeArray(values: unknown[], depth: number): unknown[] {
    if (values.length === 0) {
      return [];
    }
    const limited = values.slice(0, this.maxArrayItems);
    return limited.map((item) => this.sanitizeValue(item, depth));
  }

  private sanitizeObject(objectValue: Record<string, unknown>, depth: number): Record<string, unknown> {
    const entries = Object.entries(objectValue).slice(0, this.maxObjectKeys);
    const sanitized: Record<string, unknown> = {};
    for (const [key, rawValue] of entries) {
      const safeKey = this.sanitizeKey(key);
      sanitized[safeKey] = this.sanitizeValue(rawValue, depth);
    }
    return sanitized;
  }

  private sanitizeKey(key: string): string {
    const normalized = key.trim();
    if (!normalized) {
      return 'key';
    }
    return normalized.slice(0, 64);
  }

  private stringifySafe(value: unknown): string | null {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  private hash(content: string): string {
    const digest = createHash('sha256').update(content, 'utf8').digest('base64url');
    return `sha256:${digest}`;
  }
}
