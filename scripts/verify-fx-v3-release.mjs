#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HISTORY_WINDOW_DAYS } from '../apps/shared/fx/history.mjs';
import { FX_PROVIDERS, verifyRelease } from './publish-fx-release.mjs';

export function verifyDataRoot(dataRoot) {
  const v3 = resolve(dataRoot, 'v3');
  const manifest = verifyRelease(v3);
  for (const providerId of FX_PROVIDERS) {
    if (!manifest.providers.some((provider) => provider.providerId === providerId))
      throw new Error(`Missing required provider: ${providerId}`);
  }
  const migration = JSON.parse(readFileSync(resolve(v3, 'migration.json'), 'utf8'));
  if (!Array.isArray(migration.entries)) throw new Error('Invalid FX migration manifest');
  const providers = Object.fromEntries(
    manifest.providers.map(({ providerId }) => {
      const dates = manifest.history
        .filter((entry) => entry.providerId === providerId)
        .map((entry) => entry.date)
        .sort();
      if (!dates.length) throw new Error(`No history for provider: ${providerId}`);
      if (dates.length > HISTORY_WINDOW_DAYS)
        throw new Error(`History exceeds retention window for provider: ${providerId}`);
      const dateGaps = [];
      for (let index = 1; index < dates.length; index++) {
        const previous = Date.parse(`${dates[index - 1]}T00:00:00Z`);
        const current = Date.parse(`${dates[index]}T00:00:00Z`);
        const missingDays = (current - previous) / 86400000 - 1;
        if (missingDays > 0)
          dateGaps.push({ after: dates[index - 1], before: dates[index], missingDays });
      }
      return [
        providerId,
        {
          history: dates.length,
          dateGaps,
          quarantined: migration.entries.filter(
            (entry) => entry.providerId === providerId && entry.status === 'quarantined',
          ).length,
        },
      ];
    }),
  );
  return {
    generatedAt: manifest.generatedAt,
    providers,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const index = process.argv.indexOf('--data-root');
  if (index < 0 || !process.argv[index + 1])
    throw new Error('Usage: node scripts/verify-fx-v3-release.mjs --data-root <public/rates>');
  console.log(JSON.stringify(verifyDataRoot(resolve(process.argv[index + 1]))));
}
