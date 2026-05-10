import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT_DIR = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const SCRIPT_PATH = join(ROOT_DIR, 'scripts/lighthouse-production.mjs');
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir: string = mkdtempSync(join(tmpdir(), 'ratewise-lighthouse-production-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('lighthouse-production SSOT controls', () => {
  it('rejects non-positive LH_MAX_ATTEMPTS before running Lighthouse', () => {
    const workDir = makeTempDir();
    const result = spawnSync(process.execPath, [SCRIPT_PATH], {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      env: {
        ...process.env,
        LH_BASELINE_PATH: join(workDir, 'baseline.json'),
        LH_OUTPUT_DIR: join(workDir, 'reports'),
        LH_MAX_ATTEMPTS: '0',
        LH_OUTPUT_ONLY: '1',
        LH_RUNS: '1',
      },
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain('Invalid LH_MAX_ATTEMPTS: 0');
  });

  it('keeps refreshed summary fields after spreading an existing baseline', () => {
    const source = readFileSync(SCRIPT_PATH, 'utf8');
    const existingBaselineWrite = source.match(
      /JSON\.stringify\(\s*\{\s*\.\.\.baseline[\s\S]*?paths: summary\.paths,[\s\S]*?\}\s*,\s*null,\s*2,\s*\)/,
    );

    expect(existingBaselineWrite).not.toBeNull();
    const existingBaselineWriteBlock = existingBaselineWrite?.[0];
    if (!existingBaselineWriteBlock) {
      throw new Error('Existing baseline write block not found.');
    }

    const baselineSpreadIndex: number = existingBaselineWriteBlock.indexOf('...baseline');
    const refreshedPathsIndex: number = existingBaselineWriteBlock.indexOf('paths: summary.paths');

    expect(baselineSpreadIndex).toBeLessThan(refreshedPathsIndex);
  });

  it('guards production baseline drift with relative and absolute tolerance', () => {
    const source = readFileSync(SCRIPT_PATH, 'utf8');

    expect(source).toContain(
      'function compareDirection(current, baseline, compareDirection, absoluteTolerance = 0)',
    );
    expect(source).toContain('absoluteChanged > absoluteTolerance');
    expect(source).toContain('lcpMs: 500');
    expect(source).toContain('driftAbsoluteTolerance: DRIFT_ABSOLUTE_TOLERANCE.inpMs');
    expect(source).toContain('actual: current');
  });
});
