import {
  applyLayoutToDom,
  clampKeyPositionForLayer,
  getDefaultLayout,
  loadLayout,
  saveLayout,
  type ControlLayout,
} from '../core/layout';
import {
  applyRotationClass,
  getShellRotation,
  loadRotationPref,
  pointerToLocal,
  saveRotationPref,
  type PortraitRotationPref,
} from '../core/rotation';

// 按鈕配置模式（GAME_DESIGN §34）：純 DOM 實作——直接拖曳真實虛擬鍵即時預覽，
// 儲存 localStorage（schema 版本化於 core/layout.ts）、恢復預設與取消（還原進入時
// snapshot 且不儲存）。KISS：不做網格對齊與進階編輯器。

let open = false;
let dismissWithoutSave: (() => void) | null = null;

export function isKeyConfigOpen(): boolean {
  return open;
}

export function closeKeyConfig(): void {
  dismissWithoutSave?.();
}

function addAction(
  bar: HTMLElement,
  action: string,
  label: string,
  onPress: () => void,
): HTMLButtonElement {
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
  return button;
}

export function openKeyConfig(onClose?: () => void): void {
  if (open) return;
  const shell = document.getElementById('game-shell');
  const controls = document.getElementById('controls');
  const layer = document.getElementById('keys-layer');
  if (!shell || !controls || !layer) return;
  open = true;

  // snapshot 供「取消」還原；先掛顯示 class 再套布局，使動態夾限可量測層尺寸。
  const working: ControlLayout = structuredClone(loadLayout());
  const original: ControlLayout = structuredClone(working);

  shell.classList.add('is-configuring');
  controls.classList.add('is-config');
  applyLayoutToDom(layer, working);

  const backdrop = document.createElement('div');
  backdrop.className = 'cfg-overlay';
  // cfg-bar 直欄結構（§91）：hint 與操作列分列，鈕群空間不足時整鈕換列（禁字內斷行）。
  const bar = document.createElement('div');
  bar.className = 'cfg-bar';
  const hint = document.createElement('div');
  hint.className = 'cfg-hint';
  hint.textContent = '拖曳虛擬鍵調整位置';
  bar.appendChild(hint);
  const actions = document.createElement('div');
  actions.className = 'cfg-actions';
  bar.appendChild(actions);

  const cleanups: (() => void)[] = [];

  const teardown = (): void => {
    cleanups.forEach((fn) => fn());
    cleanups.length = 0;
    backdrop.remove();
    bar.remove();
    shell.classList.remove('is-configuring');
    controls.classList.remove('is-config');
    open = false;
    dismissWithoutSave = null;
    onClose?.();
  };

  const cancelWithoutSave = (): void => {
    applyLayoutToDom(layer, original);
    teardown();
  };
  dismissWithoutSave = cancelWithoutSave;

  addAction(actions, 'reset', '恢復預設', () => {
    Object.assign(working, getDefaultLayout());
    applyLayoutToDom(layer, working);
  });
  addAction(actions, 'save', '儲存', () => {
    saveLayout(working);
    teardown();
  });
  // 取消：還原進入時 snapshot、不寫入 localStorage。
  addAction(actions, 'cancel', '取消', cancelWithoutSave);

  // 直持持向切換（§90）：即點即存即生效（顯示偏好非布局草稿，不隨「取消」回滾）；
  // 橫持下無視覺變化，下次直持依偏好呈現。
  const rotationLabel = (pref: PortraitRotationPref): string =>
    pref === 'ccw' ? '直持鏡頭朝右' : '直持鏡頭朝左';
  let rotationPref = loadRotationPref();
  const rotationButton = addAction(actions, 'rotation', rotationLabel(rotationPref), () => {
    rotationPref = rotationPref === 'ccw' ? 'cw' : 'ccw';
    saveRotationPref(rotationPref);
    applyRotationClass(rotationPref);
    rotationButton.textContent = rotationLabel(rotationPref);
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
        getShellRotation(),
        event.clientX,
        event.clientY,
      );
      // 動態夾限含鍵半徑（審查修復）：短 keys-layer 也保證圓鍵完整在層內。
      working[name] = clampKeyPositionForLayer(
        local.x / layer.clientWidth,
        local.y / layer.clientHeight,
        layer.clientWidth,
        layer.clientHeight,
        el.offsetWidth,
      );
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
