#!/usr/bin/env node

// Vercel Ignored Build Step contract: exit 0 skips, exit 1 builds.
const ref = process.env.VERCEL_GIT_COMMIT_REF ?? '';
if (ref === 'data') {
  console.log('Skipping Vercel deployment for data branch.');
  process.exit(0);
}

console.log(`Building Vercel deployment for branch: ${ref || '(unknown)'}`);
process.exit(1);
