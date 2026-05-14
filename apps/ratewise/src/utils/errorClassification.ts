import { isChunkLoadError } from './chunkLoadRecovery';

export type UnhandledRejectionKind =
  | 'chunk-load'
  | 'expected-history-miss'
  | 'generic-fetch-failure'
  | 'unknown';

export function getUnhandledRejectionMessage(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.message;
  }

  if (typeof reason === 'string') {
    return reason;
  }

  if (reason && typeof reason === 'object' && 'message' in reason) {
    const message = (reason as { message: unknown }).message;
    return typeof message === 'string' ? message : JSON.stringify(reason);
  }

  return '';
}

export function toError(reason: unknown): Error {
  return reason instanceof Error
    ? reason
    : new Error(getUnhandledRejectionMessage(reason) || 'Unhandled rejection');
}

function isVerifiedHistoryMiss(message: string): boolean {
  return /\/rates\/history\/[^/\s]+\.json/i.test(message) && /\b404\b/.test(message);
}

// Safari 的 TypeError("Load failed") 由 isChunkLoadError 接手，這裡不再匹配，
// 以免奪走 chunk recovery 路由。Safari 字面訊息為 WebKit 將 NSURLError 轉譯後暴露給 JS，須精確比對。
const GENERIC_FETCH_FAILURE_PATTERNS: readonly RegExp[] = [
  /Failed to fetch/i, // Chromium / Edge
  /NetworkError when attempting to fetch resource/i, // Firefox
  /The Internet connection appears to be offline/i, // Safari：離線
  /The network connection was lost/i, // Safari：連線中斷
  /A server with the specified hostname could not be found/i, // Safari：DNS 失敗
  /Could not connect to the server/i, // Safari：無法連線
];

function isGenericFetchFailure(message: string): boolean {
  return GENERIC_FETCH_FAILURE_PATTERNS.some((pattern) => pattern.test(message));
}

export function classifyUnhandledRejection(reason: unknown): UnhandledRejectionKind {
  const error = toError(reason);
  const message = getUnhandledRejectionMessage(reason);

  if (isChunkLoadError(error)) {
    return 'chunk-load';
  }

  if (isVerifiedHistoryMiss(message)) {
    return 'expected-history-miss';
  }

  if (isGenericFetchFailure(message)) {
    return 'generic-fetch-failure';
  }

  return 'unknown';
}

export function isHydrationSuppressionEnabled(input: {
  prod: boolean;
  flag: string | undefined;
}): boolean {
  return !input.prod && input.flag === 'true';
}
