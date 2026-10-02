/** 這些函式也原樣嵌入 hydration 前的 recovery bootstrap；保持無外部依賴。 */
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
  const allNames = await storage.keys();
  const selectedNames = names ?? allNames;
  // 根路徑部署時，較窄的 peer scope 仍擁有自己的 shared cache 項目。
  const peerScopes = allNames
    .filter((name) => name.startsWith('workbox-precache-') && !isRatewiseCache(name, scope))
    .map((name) => /-(https?:\/\/.*\/)$/.exec(name)?.[1])
    .filter((peer): peer is string => Boolean(peer && peer !== scope && peer.startsWith(scope)));
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
              return (
                url.origin === scopeUrl.origin &&
                url.pathname.startsWith(scopeUrl.pathname) &&
                !peerScopes.some((peer) => url.href.startsWith(peer))
              );
            })
            .map((request) => cache.delete(request)),
        );
      }
      return false;
    }),
  );
  return deleted.filter(Boolean).length;
}

/** 清 runtime 前確認目前 precache 仍有首頁；否則保留最後的 HTML 備份。 */
export async function clearRatewiseRuntimeCaches(
  storage: CacheStorage,
  scope: string,
  precacheName = `workbox-precache-v2-${scope}`,
): Promise<number> {
  const names = await storage.keys();
  let hasShell = false;
  try {
    hasShell =
      names.includes(precacheName) &&
      Boolean(
        await (
          await storage.open(precacheName)
        ).match(new URL('index.html', scope).href, { ignoreSearch: true }),
      );
  } catch {
    /* 無法確認首頁時保留備份。 */
  }
  return clearRatewiseCaches(
    storage,
    scope,
    names.filter(
      (name) =>
        !name.startsWith('workbox-precache-') &&
        (hasShell ||
          ![
            'ratewise-html-cache',
            'html-cache',
            'ratewise-critical-launch-cache',
            'critical-launch-cache',
          ].includes(name)),
    ),
  );
}
