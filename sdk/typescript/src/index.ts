/** CiteAlpha public API client — /api/v1 reads. */

export type CiteAlphaOptions = {
  baseUrl?: string;
  apiKey?: string;
  fetchFn?: typeof fetch;
};

export class CiteAlpha {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchFn: typeof fetch;

  constructor(opts: CiteAlphaOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? "https://citealpha.com").replace(/\/$/, "");
    this.apiKey = opts.apiKey;
    this.fetchFn = opts.fetchFn ?? fetch;
  }

  private async get<T>(path: string): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.apiKey) headers["X-API-Key"] = this.apiKey;
    const res = await this.fetchFn(`${this.baseUrl}${path}`, { headers });
    if (!res.ok) throw new Error(`CiteAlpha ${res.status} ${path}`);
    return (await res.json()) as T;
  }

  companies() {
    return this.get<unknown[]>("/api/v1/companies");
  }

  gci(companyId: string) {
    return this.get<Record<string, unknown>>(`/api/v1/companies/${companyId}/gci`);
  }

  history(companyId: string) {
    return this.get<Record<string, unknown>>(`/api/v1/companies/${companyId}/gci/history`);
  }

  rankings() {
    return this.get<Record<string, unknown>>("/api/v1/rankings");
  }

  changelog(companyId?: string) {
    const q = companyId ? `?company_id=${encodeURIComponent(companyId)}` : "";
    return this.get<Record<string, unknown>>(`/api/v1/index/changelog${q}`);
  }

  files() {
    return this.get<Record<string, unknown>>("/api/v1/index/files");
  }

  digest() {
    return this.get<Record<string, unknown>>("/api/v1/index/digest");
  }
}
