import { validateCurrentRelease, validateReleaseManifest } from './validators.js';
import { validateQuoteSnapshot, validateProviderSnapshot } from './index';
import type { ObjectReference, CurrentRelease, ReleaseManifest, ProviderSnapshot } from './types';

export const FX_BASE_URLS = [
  'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/v3/',
  'https://raw.githubusercontent.com/haotool/app/data/public/rates/v3/',
] as const;
export const ACTIVE_RELEASE_KEY = 'ratewise.fx.v3.active';
export type FxReleaseErrorKind = 'unpublished' | 'transport' | 'integrity';
export class FxReleaseError extends Error {
  constructor(
    public readonly kind: FxReleaseErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'FxReleaseError';
  }
}
export async function hashBytes(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export async function fetchVerifiedText(
  ref: ObjectReference,
  bases: readonly string[] = FX_BASE_URLS,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  if (
    !/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.json$/.test(ref.path) ||
    !/^[a-f0-9]{64}$/.test(ref.sha256)
  )
    throw new Error('Invalid object reference');
  for (const base of bases) {
    try {
      const response = await fetcher(new URL(ref.path, base), {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) continue;
      const text = await response.text();
      if ((await hashBytes(text)) !== ref.sha256) continue;
      JSON.parse(text);
      return text;
    } catch {
      /* 一次 CDN、一次同路徑 raw；不推進未驗證快照。 */
    }
  }
  throw new Error(`Unavailable verified object: ${ref.path}`);
}
export async function fetchVerifiedObject(
  ref: ObjectReference,
  bases: readonly string[] = FX_BASE_URLS,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  return JSON.parse(await fetchVerifiedText(ref, bases, fetcher)) as unknown;
}
export interface ActiveRelease {
  current: CurrentRelease;
  manifest: ReleaseManifest;
  snapshots: ProviderSnapshot[];
  manifestBytes: string;
  snapshotBytes: string[];
}
function validManifest(value: unknown): value is ReleaseManifest {
  return (
    validateReleaseManifest(value) &&
    value.providers.length > 0 &&
    new Set(value.providers.map((p) => p.providerId)).size === value.providers.length &&
    new Set(value.history.map((h) => `${h.providerId}:${h.date}`)).size === value.history.length
  );
}
function validCurrentPointer(value: unknown): value is CurrentRelease {
  return (
    validateCurrentRelease(value) &&
    value.manifest.path === `releases/${value.releaseId}.json` &&
    value.manifest.sha256 === value.releaseId
  );
}
/** Rebuild from verified bytes instead of trusting cached parsed objects from another release. */
export async function restoreRelease(value: unknown): Promise<ActiveRelease | null> {
  try {
    if (!value || typeof value !== 'object') return null;
    const data = value as ActiveRelease;
    if (
      !validCurrentPointer(data.current) ||
      typeof data.manifestBytes !== 'string' ||
      (await hashBytes(data.manifestBytes)) !== data.current.manifest.sha256
    )
      return null;
    const manifest: unknown = JSON.parse(data.manifestBytes);
    if (
      !validManifest(manifest) ||
      !Array.isArray(data.snapshotBytes) ||
      data.snapshotBytes.length !== manifest.providers.length
    )
      return null;
    const snapshots: ProviderSnapshot[] = [];
    for (const [i, provider] of manifest.providers.entries()) {
      const bytes = data.snapshotBytes[i];
      if (typeof bytes !== 'string' || (await hashBytes(bytes)) !== provider.snapshot.sha256)
        return null;
      const snapshot: unknown = JSON.parse(bytes);
      if (!validateProviderSnapshot(snapshot) || snapshot.providerId !== provider.providerId)
        return null;
      snapshots.push(snapshot);
    }
    return {
      current: data.current,
      manifest,
      snapshots,
      manifestBytes: data.manifestBytes,
      snapshotBytes: data.snapshotBytes,
    };
  } catch {
    return null;
  }
}
export async function loadRelease(
  bases: readonly string[] = FX_BASE_URLS,
  fetcher: typeof fetch = fetch,
): Promise<ActiveRelease> {
  let current: CurrentRelease | undefined;
  let onlyNotFound = true;
  let invalidPointer = false;
  for (const base of bases) {
    try {
      const response = await fetcher(new URL('current.json', base), {
        signal: AbortSignal.timeout(8000),
        cache: 'no-cache',
      });
      if (response.status === 404) continue;
      onlyNotFound = false;
      if (!response.ok) continue;
      let value: unknown;
      try {
        value = await response.json();
      } catch {
        invalidPointer = true;
        continue;
      }
      if (validCurrentPointer(value)) {
        current = value;
        break;
      }
      invalidPointer = true;
    } catch {
      onlyNotFound = false;
    }
  }
  if (!current) {
    if (onlyNotFound) throw new FxReleaseError('unpublished', 'Unavailable v3 release pointer');
    if (invalidPointer) throw new FxReleaseError('integrity', 'Invalid v3 release pointer');
    throw new FxReleaseError('transport', 'Unavailable v3 release pointer');
  }
  try {
    const manifestBytes = await fetchVerifiedText(current.manifest, bases, fetcher);
    const manifest: unknown = JSON.parse(manifestBytes);
    if (!validManifest(manifest)) throw new Error('Unsupported or invalid v3 manifest');
    const snapshotBytes = await Promise.all(
      manifest.providers.map((provider) => fetchVerifiedText(provider.snapshot, bases, fetcher)),
    );
    const snapshots = manifest.providers.map((provider, i) => {
      const data: unknown = JSON.parse(snapshotBytes[i] ?? 'null');
      if (
        !validateProviderSnapshot(data) ||
        data.providerId !== provider.providerId ||
        !data.quotes.every(
          (quote) => quote.providerId === provider.providerId && validateQuoteSnapshot(quote),
        )
      )
        throw new Error('Invalid provider snapshot');
      return data;
    });
    return { current, manifest, snapshots, manifestBytes, snapshotBytes };
  } catch (error) {
    if (error instanceof FxReleaseError) throw error;
    throw new FxReleaseError(
      'integrity',
      error instanceof Error ? error.message : 'Invalid v3 release objects',
    );
  }
}
