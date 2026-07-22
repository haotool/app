// Node 24 type stripping 橋接：repo TS 慣例為無副檔名 import，Node 原生解析
// 需要顯式 .ts——以 registerHooks 對相對路徑補 .ts 重試，讓 CLI 直接 import
// src/game/logic 純函式 SSOT（公式/門檻零複製）。
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const relative = specifier.startsWith('./') || specifier.startsWith('../');
      if (relative && !/\.[a-z]+$/i.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

// 匯入集中於此：呼叫端拿到已解析模組，避免四散的動態 import 樣板。
export async function loadLogic() {
  const [difficulty, levels] = await Promise.all([
    import('../../src/game/logic/difficulty.ts'),
    import('../../src/game/logic/levels.ts'),
  ]);
  return { difficulty, levels };
}
