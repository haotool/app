import {
  applyLayoutToDom,
  clampKeyPosition,
  loadLayout,
  resetLayout,
  saveLayout,
  type ControlLayout,
} from '../core/layout';
import { pointerToLocal } from './controls';

// 按鈕配置模式（GAME_DESIGN §34）：純 DOM 實作——直接拖曳真實虛擬鍵即時預覽，
// 儲存 localStorage（schema 版本化於 core/layout.ts）、一鍵恢復預設。KISS：不做網格
// 對齊與進階編輯器。

const isPortrait = (): boolean => window.matchMedia('(orientation: portrait)').matches;

let open = false;

export function isKeyConfigOpen(): boolean {
  return open;
}

function addAction(bar: HTMLElement, action: string, label: string, onPress: () => void): void {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cfg-btn';
  button.dataset['cfg'] = action;
  button.textContent = label;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onPress();
  });
  bar.appendChild(button);
}

export function openKeyConfig(onClose?: () => void): void {
  if (open) return;
  const shell = document.getElementById('game-shell');
  const controls = document.getElementById('controls');
  const layer = document.getElementById('keys-layer');
  if (!shell || !controls || !layer) return;
  open = true;

  const working: ControlLayout = structuredClone(loadLayout());
  applyLayoutToDom(layer, working);

  shell.classList.add('is-configuring');
  controls.classList.add('is-config');

  const backdrop = document.createElement('div');
  backdrop.className = 'cfg-overlay';
  const bar = document.createElement('div');
  bar.className = 'cfg-bar';
  const hint = document.createElement('div');
  hint.className = 'cfg-hint';
  hint.textContent = '拖曳虛擬鍵調整位置';
  bar.appendChild(hint);

  const cleanups: (() => void)[] = [];

  const teardown = (): void => {
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;
    backdrop.remove();
    bar.remove();
    shell.classList.remove('is-configuring');
    controls.classList.remove('is-config');
    open = false;
    onClose?.();
  };

  addAction(bar, 'reset', '恢復預設', () => {
    Object.assign(working, structuredClone(resetLayout()));
    applyLayoutToDom(layer, working);
  });
  addAction(bar, 'save', '儲存並返回', () => {
    saveLayout(working);
    teardown();
  });

  // 拖曳：座標經 pointerToLocal 轉 keys-layer 局部空間（portrait 旋轉殼換軸），
  // 中心點比例即時寫回 working 並套用（即時預覽）。
  for (const name of ['a', 'b'] as const) {
    const el = layer.querySelector<HTMLElement>(`[data-btn="${name}"]`);
    if (!el) continue;
    let activeId: number | null = null;
    const onDown = (event: PointerEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      activeId = event.pointerId;
      el.classList.add('is-dragging');
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        /* noop */
      }
    };
    const onMove = (event: PointerEvent): void => {
      if (event.pointerId !== activeId) return;
      event.preventDefault();
      const local = pointerToLocal(
        layer.getBoundingClientRect(),
        layer.clientWidth,
        layer.clientHeight,
        isPortrait(),
        event.clientX,
        event.clientY,
      );
      working[name] = clampKeyPosition(local.x / layer.clientWidth, local.y / layer.clientHeight);
      applyLayoutToDom(layer, working);
    };
    const onUp = (event: PointerEvent): void => {
      if (event.pointerId !== activeId) return;
      activeId = null;
      el.classList.remove('is-dragging');
    };
    el.addEventListener('pointerdown', onDown, { passive: false });
    el.addEventListener('pointermove', onMove, { passive: false });
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    cleanups.push(() => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.classList.remove('is-dragging');
    });
  }

  shell.appendChild(backdrop);
  shell.appendChild(bar);
}
