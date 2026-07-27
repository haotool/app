// verify-production-resources.mjs 型別宣告（#900）：實作以 .mjs 為 SSOT，本檔僅描述既有 export 形狀。
export type ResourceType = 'seo' | 'image';
export type ProbeOutcome = '200' | 'non200' | 'timeout';

export interface ResourceItem {
  app: string;
  displayName?: string;
  type: ResourceType;
  path: string;
  url: string;
  expectedContentTypes: string[];
}

export interface ProbeResult extends ResourceItem {
  httpStatus: number | null;
  contentType?: string;
  contentTypeOk?: boolean;
  outcome: ProbeOutcome;
  durationMs: number;
  error: string | null;
}

export interface ProbeSummary {
  total: number;
  '200': number;
  non200: number;
  timeout: number;
}

export interface AppConfigLike {
  name: string;
  config: {
    siteUrl?: string;
    displayName?: string;
    resources?: { seoFiles?: string[]; images?: string[] };
  };
}

export function getExpectedContentTypes(resource: { type: string; path: string }): string[];
export function isExpectedContentType(
  contentType: string | null | undefined,
  expectedTypes: string[],
): boolean;
// probeResource 輸入為寬鬆資源形狀（實作僅透傳並讀 url/path/type/expectedContentTypes），
// 供測試以字面物件（type 推斷為 string）直接呼叫。
export interface ProbeResourceInput {
  url: string;
  app?: string;
  displayName?: string;
  type?: string;
  path?: string;
  expectedContentTypes?: string[];
}

export function buildResourceInventory(apps: AppConfigLike[]): ResourceItem[];
export function probeResource(
  resource: ProbeResourceInput,
  options?: {
    timeoutMs?: number;
    fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>;
    maxRetries?: number;
  },
): Promise<ProbeResult>;
export function summarizeProbeResults(results: { outcome: ProbeOutcome }[]): ProbeSummary;
export function runResourceVerification(options?: { appName?: string }): Promise<ProbeSummary>;
