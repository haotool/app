import { describe, expect, it } from 'vitest';
import { FX_V3_PUBLIC, isFxV3Public } from './public';
import { fxV3PublicPlugin } from './vite-plugin.mjs';

describe('v3 公開閘門', () => {
  it('無 define 的環境不拋 ReferenceError，回落至 FX_V3_PUBLIC', () => {
    expect(isFxV3Public()).toBe(FX_V3_PUBLIC);
  });

  it('建置 plugin 把 App 呼叫點改寫為字面值並注入 define 與無副作用宣告', () => {
    const plugin = fxV3PublicPlugin() as {
      config: () => {
        define: Record<string, string>;
        build: { rolldownOptions: { treeshake: { moduleSideEffects: { test: RegExp }[] } } };
      };
      transform: (code: string, id: string) => { code: string } | null;
    };
    const config = plugin.config();
    expect(config.define['__FX_V3_PUBLIC_BUILD__']).toBe(JSON.stringify(FX_V3_PUBLIC));
    expect(
      config.build.rolldownOptions.treeshake.moduleSideEffects[0]?.test.test(
        '/x/shared/fx/index.ts',
      ),
    ).toBe(true);
    const out = plugin.transform('if (isFxV3Public()) load();', '/app/src/a.tsx');
    expect(out?.code).toBe(`if (${JSON.stringify(FX_V3_PUBLIC)}) load();`);
    expect(plugin.transform('isFxV3Public()', '/app/node_modules/x/a.js')).toBeNull();
    expect(plugin.transform('return isFxV3Public()', '/app/shared/fx/public.ts')).toBeNull();
  });
});
