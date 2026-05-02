import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

interface EnsurePrerenderDistOptions {
  projectRoot: string;
  distRoot: string;
  requiredPaths?: string[];
  sourcePaths?: string[];
}

const LOCK_STALE_MS = 10 * 60 * 1000;
const LOCK_WAIT_TIMEOUT_MS = 120 * 1000;
const LOCK_WAIT_INTERVAL_MS = 500;

const hasArtifacts = (paths: string[]): boolean => paths.every((path) => existsSync(path));

const newestMtimeMs = (paths: string[]): number =>
  paths.reduce((latest, path) => {
    if (!existsSync(path)) return latest;
    return Math.max(latest, statSync(path).mtimeMs);
  }, 0);

const isArtifactStale = (artifactPath: string, sourcePaths: string[]): boolean => {
  if (!existsSync(artifactPath)) return true;
  if (sourcePaths.length === 0) return false;

  return statSync(artifactPath).mtimeMs < newestMtimeMs(sourcePaths);
};

const isStaleLock = (lockDir: string): boolean => {
  try {
    return Date.now() - statSync(lockDir).mtimeMs > LOCK_STALE_MS;
  } catch {
    return false;
  }
};

const acquireBuildLock = async (lockDir: string): Promise<boolean> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < LOCK_WAIT_TIMEOUT_MS) {
    try {
      mkdirSync(lockDir);
      return true;
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== 'EEXIST') {
        throw error;
      }

      if (isStaleLock(lockDir)) {
        rmSync(lockDir, { recursive: true, force: true });
        continue;
      }

      await delay(LOCK_WAIT_INTERVAL_MS);
    }
  }

  return false;
};

export const ensurePrerenderDist = async ({
  projectRoot,
  distRoot,
  requiredPaths = [],
  sourcePaths = [],
}: EnsurePrerenderDistOptions): Promise<void> => {
  const requiredArtifacts = [resolve(distRoot, 'index.html'), ...requiredPaths];
  const entryHtml = resolve(distRoot, 'index.html');
  const needsBuild = !hasArtifacts(requiredArtifacts) || isArtifactStale(entryHtml, sourcePaths);

  if (!needsBuild) return;

  const tmpRoot = resolve(projectRoot, '.tmp');
  const lockDir = resolve(tmpRoot, 'prerender-dist-test.lock');
  mkdirSync(tmpRoot, { recursive: true });

  const acquired = await acquireBuildLock(lockDir);
  if (!acquired) {
    if (hasArtifacts(requiredArtifacts) && !isArtifactStale(entryHtml, sourcePaths)) return;
    throw new Error(`timed out waiting for prerender dist build lock: ${lockDir}`);
  }

  try {
    if (!hasArtifacts(requiredArtifacts) || isArtifactStale(entryHtml, sourcePaths)) {
      const result = spawnSync('pnpm', ['build'], {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: true,
      });

      if (result.status !== 0) {
        throw new Error(`pnpm build failed with exit code ${result.status ?? 'unknown'}`);
      }
    }

    if (!hasArtifacts(requiredArtifacts) || isArtifactStale(entryHtml, sourcePaths)) {
      throw new Error(
        `prerender artifacts are stale or missing after build: ${requiredArtifacts.join(', ')}`,
      );
    }
  } finally {
    rmSync(lockDir, { recursive: true, force: true });
  }
};
