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

export function classifyUnhandledRejection(reason: unknown): UnhandledRejectionKind {
  const error = toError(reason);
  const message = getUnhandledRejectionMessage(reason);

  if (isChunkLoadError(error)) {
    return 'chunk-load';
  }

  if (isVerifiedHistoryMiss(message)) {
    return 'expected-history-miss';
  }

  if (message.includes('Failed to fetch')) {
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
