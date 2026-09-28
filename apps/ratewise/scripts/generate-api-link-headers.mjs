import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FX_PUBLISHER } from '../../shared/fx/publisher-metadata.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const path = resolve(ROOT, 'public/_headers');
const template = readFileSync(path, 'utf8');
const rules = [...template.matchAll(/Link: <[^>]+>; rel="terms-of-service"/g)];
if (rules.length < 2 || !template.includes('# API 使用條款提示')) {
  throw new Error('Missing API terms Link header rules in public/_headers');
}
writeFileSync(
  path,
  template.replace(/(Link: <)[^>]+(>; rel="terms-of-service")/g, `$1${FX_PUBLISHER.termsUrl}$2`),
);
console.log('✅ API terms Link headers generated from FX_PUBLISHER');
