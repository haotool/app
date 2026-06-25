import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  compareDirection,
  DRIFT_ABSOLUTE_TOLERANCE,
  isHardThresholdBreached,
} from '../lighthouse-drift.mjs';

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
    const productionSource = readFileSync(SCRIPT_PATH, 'utf8');
    const driftSource = readFileSync(join(ROOT_DIR, 'scripts/lighthouse-drift.mjs'), 'utf8');

    expect(productionSource).toContain("from './lighthouse-drift.mjs'");
    expect(productionSource).toContain('driftAbsoluteTolerance: DRIFT_ABSOLUTE_TOLERANCE.inpMs');
    expect(productionSource).toContain('actual: current');
    expect(driftSource).toContain('absoluteChanged > absoluteTolerance');
    expect(driftSource).toContain('inpMs: 30');
  });
});

describe('compareDirection behavioral drift checks', () => {
  const inpTolerance = DRIFT_ABSOLUTE_TOLERANCE.inpMs;

  it('passes INP lab noise within 30ms absolute tolerance (34→60)', () => {
    const result = compareDirection(60, 34, 'lowerBetter', inpTolerance);
    expect(result.absoluteChanged).toBe(26);
    expect(result.exceed).toBe(false);
  });

  it('fails INP drift when absolute change exceeds 30ms (34→66)', () => {
    const result = compareDirection(66, 34, 'lowerBetter', inpTolerance);
    expect(result.absoluteChanged).toBe(32);
    expect(result.exceed).toBe(true);
  });

  it('flags large INP drift and hard threshold breach (34→250)', () => {
    const drift = compareDirection(250, 34, 'lowerBetter', inpTolerance);
    expect(drift.exceed).toBe(true);
    expect(isHardThresholdBreached(250, { direction: 'lowerBetter', threshold: 200 })).toBe(true);
  });
});
