/** 網路狀態工具：先看 navigator.onLine，再做實際探測。 */

function getProbeUrl(): string {
  const basePath = import.meta.env.BASE_URL || '/';
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const probeUrl = new URL(`${normalizedBase}__network_probe__`, window.location.origin);
  probeUrl.searchParams.set('t', Date.now().toString());
  return probeUrl.toString();
}

/** 檢查瀏覽器的基礎連線狀態。 */
export function checkOnlineStatus(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
}

/** 實際網路探測：命中固定 probe 路徑，避免被頁面快取誤判。 */
export async function checkNetworkConnectivity(timeout = 3000): Promise<boolean> {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    await fetch(getProbeUrl(), {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

/** 混合式偵測：離線狀態直接返回；在線狀態再做實際探測。 */
export async function isOnline(): Promise<boolean> {
  if (!checkOnlineStatus()) {
    return false;
  }
  return await checkNetworkConnectivity();
}
