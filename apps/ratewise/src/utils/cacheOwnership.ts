/** 此兩個函式也原樣嵌入 hydration 前的 recovery bootstrap；保持無外部依賴。 */
export function isRatewiseCache(name: string, scope: string): boolean {
  return (
    name.startsWith('ratewise-') ||
    name === 'workbox-precache-v2-ratewise' ||
    (name.startsWith('workbox-precache-') && name.endsWith(`-${scope}`)) ||
    [
      'history-validated-v2',
      'history-aggregate-cache',
      'history-rates-cdn',
      'history-rates-raw',
      'latest-rate-cache',
      'static-resources',
      'seo-files-cache',
      'critical-launch-cache',
    ].includes(name)
  );
}

export async function clearRatewiseCaches(
  storage: CacheStorage,
  scope: string,
  names?: string[],
): Promise<number> {
  const selectedNames = names ?? (await storage.keys());
  const scopeUrl = new URL(scope);
  const deleted = await Promise.all(
    selectedNames.map(async (name) => {
      if (isRatewiseCache(name, scope)) return storage.delete(name);
      // 舊版通用名稱被其他 app 共用，只清除自己的 URL，不能刪整個 cache。
      if (['html-cache', 'image-cache', 'font-cache'].includes(name)) {
        const cache = await storage.open(name);
        const requests = await cache.keys();
        await Promise.all(
          requests
            .filter((request) => {
              const url = new URL(request.url);
              return url.origin === scopeUrl.origin && url.pathname.startsWith(scopeUrl.pathname);
            })
            .map((request) => cache.delete(request)),
        );
      }
      return false;
    }),
  );
  return deleted.filter(Boolean).length;
}
