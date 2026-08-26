import { mkdirSync, writeFileSync } from 'node:fs';
import type { FullConfig } from '@playwright/test';

export default function globalSetup(config: FullConfig): void {
  const port = process.env['SP_DEV_PORT'] ?? '3007';
  const origin = `http://localhost:${port}`;
  const storagePath = `test-results/e2e-storage-state-${port}.json`;
  mkdirSync('test-results', { recursive: true });
  writeFileSync(
    storagePath,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin,
          localStorage: [
            {
              name: 'sp-settings',
              value: JSON.stringify({
                schemaVersion: 2,
                audioMuted: false,
                hapticsEnabled: true,
                wakeLockEnabled: true,
                reducedMotion: false,
                controlHintsEnabled: true,
                controlHintsPlayCount: 0,
                guidedTutorialStatus: 'skipped',
                guidanceEnabled: true,
                guidanceCompletedLessons: [],
                screenShake: 'full',
                shellRotation: null,
                keyLayout: null,
              }),
            },
          ],
        },
      ],
    }),
  );
  void config;
}
