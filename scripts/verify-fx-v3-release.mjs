#!/usr/bin/env node
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyRelease } from './publish-fx-release.mjs';

export function verifyDataRoot(dataRoot) {
  const manifest = verifyRelease(resolve(dataRoot, 'v3'));
  return {
    generatedAt: manifest.generatedAt,
    providers: manifest.providers.length,
    history: manifest.history.length,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const index = process.argv.indexOf('--data-root');
  if (index < 0 || !process.argv[index + 1])
    throw new Error('Usage: node scripts/verify-fx-v3-release.mjs --data-root <public/rates>');
  console.log(JSON.stringify(verifyDataRoot(resolve(process.argv[index + 1]))));
}
