import type Phaser from 'phaser';
import { VIEW, computeLogicalWidth } from './config';
import { isPortrait, pointerToLocal } from '../systems/controls';

// v4 旋轉殼佈局模組（recon-v4 A/B）：殼量測、Phaser 量測/指標原語補償、resize 節流
// 集中於此；main.ts 以 initialShellWidth() 定 boot 寬後，僅需呼叫 initShellLayout(game)。
// Phaser 僅 type import：模組無載入期副作用，純函式可直接進 vitest node 環境。

export interface ShellSize {
  w: number;
  h: number;
}

// 量測基準（硬規則 5）：殼 clientWidth/Height 為 layout 值，不受 CSS rotate 影響，
// 即 canvas CSS px 所在的殼局部座標空間。
export function measureShell(): ShellSize | null {
  const shell = document.getElementById('game-shell');
  if (!shell || shell.clientWidth <= 0 || shell.clientHeight <= 0) return null;
  return { w: shell.clientWidth, h: shell.clientHeight };
}

// 殼尺寸 → 邏輯遊戲尺寸（§28）：高固定 480、寬 clamp 854–1200；量測不足回退最小寬。
export function computeGameSize(shell: ShellSize | null): { width: number; height: number } {
  return {
    width: shell ? computeLogicalWidth(shell.w, shell.h) : VIEW.minWidth,
    height: VIEW.height,
  };
}

// boot 定寬（recon-v4 B.2）：模組執行時殼與樣式已就緒，直接以殼比例決定初始邏輯寬，
// 場景自 create 起讀到的 scale.width 即為正確值。
export function initialShellWidth(): number {
  return computeGameSize(measureShell()).width;
}

// Phaser 私有 API 補償集中處：getParentBounds 與 transformPointer 皆為引擎內部量測原語，
// 非公開擴充點；旋轉殼下 getBoundingClientRect 的 AABB 寬高互換是 phaser#7175 已知缺口。
// 升版檢查點：Phaser major/minor 升級時須確認兩原語簽名與內部呼叫路徑未變，
// 並以 e2e portrait.spec.ts（視寬 1039、DOM 鈕、搖桿重映射）回歸驗證。
export function initShellLayout(game: Phaser.Game): void {
  // FIT 的 canvas 樣式以 parentSize 計算，而 ScaleManager 每次 refresh 內部都以
  // getBoundingClientRect 重量測 parent——旋轉殼下該 AABB 寬高互換，會把 canvas 誤縮成
  // 直式。改寫量測原語為殼局部尺寸，所有內部 refresh 路徑一次矯正。
  game.scale.getParentBounds = function getShellBounds(): boolean {
    const shell = measureShell();
    if (!shell) return false;
    const parentSize = this.parentSize;
    if (parentSize.width === shell.w && parentSize.height === shell.h) return false;
    parentSize.setSize(shell.w, shell.h);
    return true;
  };

  // canvas 指標補償（recon-v4 A.3 備選）：portrait 殼旋轉下 Phaser 以 canvasBounds AABB 反推
  // 座標會錯位（phaser#7175）。改寫座標轉換原語：先轉 canvas 局部座標（90 度逆變換）再換算
  // 邏輯座標，殘存 canvas 互動（靜音鈕等）兩種持向皆正確；landscape 走原生路徑。
  const nativeTransformPointer = game.input.transformPointer.bind(game.input);
  game.input.transformPointer = (pointer, pageX, pageY, wasMove) => {
    if (!isPortrait()) {
      nativeTransformPointer(pointer, pageX, pageY, wasMove);
      return;
    }
    const canvas = game.canvas;
    const local = pointerToLocal(
      canvas.getBoundingClientRect(),
      canvas.clientWidth,
      canvas.clientHeight,
      true,
      pageX - window.scrollX,
      pageY - window.scrollY,
    );
    pointer.prevPosition.set(pointer.position.x, pointer.position.y);
    pointer.position.set(
      (local.x * game.scale.width) / canvas.clientWidth,
      (local.y * game.scale.height) / canvas.clientHeight,
    );
  };

  // 旋轉殼佈局（recon-v4 A/B）：CSS 殼先穩定 → 量測殼 → setGameSize → refresh + updateBounds。
  // setGameSize 只在此呼叫（硬規則 7）；scale resize 事件內禁止再呼叫。
  function applyShellLayout(): void {
    const shell = measureShell();
    if (!shell) return;
    const { width } = computeGameSize(shell);
    game.scale.getParentBounds();
    if (width !== game.scale.width) game.scale.setGameSize(width, VIEW.height);
    game.scale.refresh();
    game.scale.updateBounds();
  }

  // resize 節流 150ms；orientationchange 後 iOS viewport 尺寸非同步就緒，延遲 350ms（recon C.9）。
  let layoutTimer: ReturnType<typeof setTimeout> | undefined;
  function scheduleLayout(delayMs: number): void {
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(applyShellLayout, delayMs);
  }
  window.addEventListener('resize', () => scheduleLayout(150));
  window.addEventListener('orientationchange', () => scheduleLayout(350));

  // boot 定寬：READY 時殼 CSS 已穩定，依殼比例一次設定邏輯寬（854–1200）。
  // 'ready' 即 Phaser.Core.Events.READY；用字面值避免 phaser 值層 import 破壞純測試環境。
  game.events.once('ready', applyShellLayout);
}
