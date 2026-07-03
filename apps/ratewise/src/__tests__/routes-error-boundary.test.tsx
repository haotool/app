/**
 * 路由層錯誤邊界守門測試
 *
 * 防回歸：root route 與所有 lazy 頂層路由必須掛 errorElement，
 * 避免任何冒到路由層的錯誤落到 react-router 內建
 * "Unexpected Application Error!" 預設頁面。
 */
import { describe, expect, it } from 'vitest';
import { routes } from '../routes';

describe('routes error boundary', () => {
  it('root route（path /）應掛載 errorElement 最後防線', () => {
    const rootRoute = routes.find((route) => route.path === '/');

    expect(rootRoute).toBeDefined();
    expect(rootRoute?.errorElement).toBeTruthy();
  });

  it('所有 lazy 頂層路由（含 /faq 與 *）應掛載 errorElement', () => {
    const lazyRoutes = routes.filter((route) => route.lazy != null);

    expect(lazyRoutes.length).toBeGreaterThan(0);
    expect(lazyRoutes.map((route) => route.path)).toEqual(expect.arrayContaining(['/faq', '*']));

    for (const route of lazyRoutes) {
      expect(route.errorElement, `route ${String(route.path)} 缺少 errorElement`).toBeTruthy();
    }
  });
});
