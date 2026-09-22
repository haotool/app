export interface ObjectReference {
  path: string;
  sha256: string;
}

export interface MigrationEntry {
  path: string;
  date: string;
  providerId: 'bot' | 'moneybox';
  sourceHash: string;
  sourceVersion: string | null;
  methodVersion: '1';
  status: 'converted' | 'quarantined';
  reason: string | null;
  evidence: ObjectReference;
  outputHash?: string;
  snapshot?: ObjectReference;
  coverage?: string[];
  units?: string[];
  unsupportedFields?: string[];
}

export interface MigrationResult {
  revision: string;
  total: number;
  converted: number;
  quarantined: number;
  entries: MigrationEntry[];
}

export function migrateHistory(revision: string, output: string): MigrationResult;
