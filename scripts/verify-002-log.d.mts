// verify-002-log.mjs 型別宣告（#900）：供 scripts/__tests__ 在 strict tsc 下取得
// 精確回傳型別；實作以 .mjs 為 SSOT，本檔僅描述既有 export 形狀。
export const LOG_PATH: string;

export interface Header002 {
  line: string;
  delta: number;
  reward: number;
  penalty: number;
  neutral: number;
  total: number;
}

export interface Entry002 {
  id: string | null;
  lines: string[];
  fields: Record<string, string>;
  errors: string[];
}

export interface ParsedEntries002 {
  entries: Entry002[];
  globalErrors: string[];
}

export function scanRawIds(content: string | null | undefined): Set<string>;
export function parseStrictHeader(content: string): Header002 | null;
export function parsePreviousTotal(content: string): number | null;
export function parseEntries(content: string): ParsedEntries002;
export function validate002(input: {
  stagedContent: string;
  headContent: string | null | undefined;
}): { errors: string[] };
