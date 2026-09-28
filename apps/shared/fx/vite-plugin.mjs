import { FX_V3_PUBLIC } from './public.ts';

/**
 * 建置期 v3 閘門（RateWise 與 split-meow 共用）：
 * - define `__FX_V3_PUBLIC_BUILD__` 為字面常數，供 public.ts 的 isFxV3Public() 使用；
 * - 將 App 原始碼中的 `isFxV3Public()` 呼叫改寫為字面值。rolldown 不做跨模組常數折疊，
 *   也不內聯函式，只有呼叫點本身是字面值，tree-shaking 才能移除 v3 分支與其靜態匯入。
 * ponytail: 以文字比對改寫呼叫點；若日後 bundler 能跨模組折疊常數，可刪除 transform 只留 define。
 */
export function fxV3PublicPlugin() {
  const literal = JSON.stringify(FX_V3_PUBLIC);
  return {
    name: 'fx-v3-public',
    enforce: 'pre',
    // shared/fx 只有純函式與常數；workspace 原始碼不經 node_modules 解析，package.json sideEffects
    // 不生效，故在此宣告無副作用，未使用的 v3 匯入（schema 驗證器、decimal、release client）整個移除。
    config: () => ({
      define: { __FX_V3_PUBLIC_BUILD__: literal },
      build: {
        rolldownOptions: {
          treeshake: {
            moduleSideEffects: [{ test: /[\\/]shared[\\/]fx[\\/]/, sideEffects: false }],
          },
        },
      },
    }),
    transform(code, id) {
      if (id.includes('/node_modules/') || !/\.[cm]?[jt]sx?$/.test(id.split('?')[0])) return null;
      if (!code.includes('isFxV3Public()') || /[\\/]shared[\\/]fx[\\/]public\.ts$/.test(id))
        return null;
      // 只改寫獨立呼叫：排除 `ns.isFxV3Public()` 與 `xisFxV3Public()` 等成員／前綴名稱。
      return { code: code.replace(/(?<![\w$.])isFxV3Public\(\)/g, literal), map: null };
    },
  };
}
