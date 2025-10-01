import { HttpRequestLogSnapshot } from '../factories/http-request-log.factory';

export class HttpRequestLog {
  private constructor(private readonly snapshot: HttpRequestLogSnapshot) {}

  static create(snapshot: HttpRequestLogSnapshot): HttpRequestLog {
    return new HttpRequestLog(snapshot);
  }

  toSnapshot(): HttpRequestLogSnapshot {
    return { ...this.snapshot };
  }
}
