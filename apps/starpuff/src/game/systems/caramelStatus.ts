import {
  CARAMEL,
  CARAMEL_CLEAR,
  applyCaramel,
  caramelActive,
  caramelSpeedMul,
  tickCaramel,
  type CaramelState,
} from '../logic/caramel';
import type { FxSystem } from './fx';
import type { PlayerHandle } from './player';

// 焦糖化狀態呈現層（§5 Syrona W2）：糖漿波沾身減速 30%/3s、琥珀腳部沾糖粒子與
// 反制解除（乘噴口氣流吹乾／雷化放電瞬除）；狀態真值收斂 logic/caramel.ts，
// 移速倍率於 sync 與 buff 倍率單點合成後注入 player（防互相覆寫）。

// 腳部沾糖粒子節拍。
const DRIP_FX_INTERVAL_MS = 400;

export interface CaramelStatusDeps {
  player(): PlayerHandle;
  fx(): FxSystem;
  toast(message: string): void;
  // buff 移速/加減速倍率讀取（§69）：與焦糖倍率合成後注入。
  buffMods(): readonly [number, number];
}

export interface CaramelStatus {
  apply(): void;
  update(deltaMs: number): void;
  clear(): void;
  // 倍率重注（buff 拾取/過期時由 GameScene 呼叫）。
  sync(): void;
}

export function createCaramelStatus(deps: CaramelStatusDeps): CaramelStatus {
  let state: CaramelState = CARAMEL_CLEAR;
  let fxAccMs = 0;
  // 首次沾身反制教學浮字（每戰一次）：收斂 closure，避免模組級狀態跨測試/場景殘留。
  let taughtCaramelClear = false;

  const sync = (): void => {
    const [speedMul, rateMul] = deps.buffMods();
    deps.player().setBuffMoveMods(speedMul * caramelSpeedMul(state), rateMul);
  };

  const clear = (): void => {
    if (!caramelActive(state)) return;
    state = CARAMEL_CLEAR;
    sync();
  };

  return {
    apply() {
      // 雷化免疫（§5 反制：放電瞬除語義——帶電體不沾糖）。
      if (deps.player().getTransformState().form === 'volt') return;
      // 沾身中再沾波：僅刷新計時（重疊 shockwave 逐幀觸發，防 FX/浮字轟炸）。
      const refreshOnly = caramelActive(state);
      state = applyCaramel();
      sync();
      if (refreshOnly) return;
      fxAccMs = 0;
      const sprite = deps.player().sprite;
      deps.fx().burstSmall(sprite.x, sprite.y + 18, CARAMEL.tint);
      if (!taughtCaramelClear) {
        taughtCaramelClear = true;
        deps.toast('焦糖黏身！乘噴口氣流吹乾');
      }
    },
    update(deltaMs: number) {
      if (!caramelActive(state)) return;
      // 雷化放電瞬除（§5 反制：變身優勢解）。
      if (deps.player().getTransformState().form === 'volt') {
        clear();
        return;
      }
      state = tickCaramel(state, deltaMs);
      if (!caramelActive(state)) {
        sync();
        return;
      }
      // 琥珀色腳部沾糖視覺：低頻粒子跟隨腳邊。
      fxAccMs += deltaMs;
      if (fxAccMs >= DRIP_FX_INTERVAL_MS) {
        fxAccMs = 0;
        const sprite = deps.player().sprite;
        deps.fx().burstSmall(sprite.x, sprite.y + 20, CARAMEL.tint);
      }
    },
    clear,
    sync,
  };
}
