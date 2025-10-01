import { HttpRequestLogFactory } from '../domain/factories/http-request-log.factory';

describe('HttpRequestLogFactory', () => {
  it('PII verisini maskeleyip hash uretir', () => {
    const factory = new HttpRequestLogFactory();

    const log = factory.createFromHttpRequest({
      method: 'post',
      path: '/api/test',
      statusCode: 201,
      durationMs: 123,
      ipAddress: '192.168.1.10',
      forwardedFor: '10.0.0.1',
      userAgent: 'vitest',
      query: {
        email: 'user@example.com',
        phone: '+90 534 000 0000',
      },
      params: { id: 'abc-123' },
      body: {
        password: 'SuperSecret1!',
        contact: 'user@example.com',
      },
      responseBody: { success: true },
      roles: ['teacher', 'teacher'],
      subjectScopes: ['Music'],
    });

    const snapshot = log.toSnapshot();

    expect(snapshot.roles).toEqual(['teacher']);
    expect(snapshot.subjectScopes).toEqual(['Music']);
    expect(snapshot.queryJson).toMatchObject({
      email: '[redacted-email]',
      phone: '[redacted-phone]',
    });
    expect(snapshot.bodyDigest).toMatch(/^sha256:[A-Za-z0-9_-]{10,}$/);
    expect(snapshot.responseDigest).toMatch(/^sha256:/);
  });
});

