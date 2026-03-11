export function getVersionFromCommitCount(
  baseVersion: string,
  rawCommitCount: string | null,
): string | null {
  if (!rawCommitCount) {
    return null;
  }

  const commitCount = rawCommitCount.trim();
  if (!/^\d+$/.test(commitCount)) {
    return null;
  }

  return `${baseVersion}+build.${commitCount}`;
}
