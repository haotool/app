export interface ObjectReference {
  path: string;
  sha256: string;
}

export interface ReleaseProvider {
  providerId: string;
  snapshot: ObjectReference;
  checkStatus: 'ok' | 'failed' | 'carried_forward';
  lastSuccessfulCheckAt: string;
}

export interface ReleaseManifest {
  providers: ReleaseProvider[];
  history: Array<{ providerId: string; date: string; snapshot: ObjectReference }>;
}

export interface PublicationResult {
  current: { releaseId: string; manifest: ObjectReference };
  manifest: ReleaseManifest;
  snapshots: Map<string, unknown>;
}

export function publishRelease(
  root: string,
  inputs: Record<string, unknown | null>,
  now?: string,
  history?: ReleaseManifest['history'],
): Promise<PublicationResult>;

export function sunsetAt(activatedAt: string | null): string | null;
export function bytesHash(bytes: string | Uint8Array): string;

export function legacyPayload(
  snapshot: unknown,
  original: { details: Record<string, { name?: string }> },
): { details: Record<string, { name?: string }> };
