import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

export const bytesHash = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function writeObject(root, data, prefix = 'objects') {
  const text = JSON.stringify(data) + '\n';
  const sha256 = bytesHash(text);
  const path = `${prefix}/${sha256}.json`;
  const destination = resolve(root, path);
  mkdirSync(dirname(destination), { recursive: true });
  if (existsSync(destination)) {
    if (readFileSync(destination, 'utf8') !== text) throw new Error('Immutable object conflict');
  } else writeFileSync(destination, text, { flag: 'wx' });
  return { path, sha256 };
}
