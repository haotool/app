/**
 * 併發請求去重（#669）：同鍵請求共享同一 in-flight promise，完成後自清。
 * 各 service 自持 Map（clear 生命週期獨立），本模組只收斂共享演算法。
 */

export function shareInFlight<T>(
  inFlight: Map<string, Promise<unknown>>,
  key: string,
  factory: () => Promise<T>,
): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;
  const request = factory().finally(() => {
    // 僅在登記者仍為自身時移除：防 clear 後新註冊的同鍵請求被舊 finally 誤刪。
    if (inFlight.get(key) === request) {
      inFlight.delete(key);
    }
  });
  inFlight.set(key, request);
  return request;
}
