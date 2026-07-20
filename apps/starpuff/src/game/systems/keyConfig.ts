import {
  KEY_SCALE,
  applyLayoutToDom,
  clampKeyPositionForLayer,
  clampKeyScale,
  defaultLayoutFor,
  hasStoredLayout,
  loadLayout,
  resetLayout,
  saveLayout,
  type ControlLayout,
} from '../core/layout';
import {
  DEFAULT_PORTRAIT_ROTATION,
  applyRotationClass,
  isPortrait,
  loadRotationPref,
  pointerToLocal,
  saveRotationPref,
  type PortraitRotationPref,
  type ShellRotation,
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
  // cfg-bar 直欄結構（§88）：hint 與操作列分列，鈕群空間不足時整鈕換列（禁字內斷行）。
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

  // 持向為草稿之一（審查修復）：切換即時預覽（掛 class），儲存才落地、取消回滾。
  const originalRotation: PortraitRotationPref = loadRotationPref();
  let rotationPref: PortraitRotationPref = originalRotation;
  // 草稿持向對應的殼旋轉態（§95 D1）：getShellRotation 讀已存偏好，草稿期須以
  // rotationPref 就地推導，預設鍵位才跟得上預覽方向。
  const draftRotation = (): ShellRotation => (isPortrait() ? rotationPref : 'none');

  // 儲存語意（§95 D1）：預設態（從未自訂或按過恢復預設）不落盤——清除儲存值，
  // 讓直橫持各自動態解析預設；使用者拖曳/縮放過才持久化具體布局。
  let usingDefaults = !hasStoredLayout();
  let dirty = false;

  const cancelWithoutSave = (): void => {
    applyLayoutToDom(layer, original);
    applyRotationClass(originalRotation);
    teardown();
  };
  dismissWithoutSave = cancelWithoutSave;

  addAction(actions, 'reset', '恢復預設', () => {
    rotationPref = DEFAULT_PORTRAIT_ROTATION;
    applyRotationClass(rotationPref);
    renderRotation();
    // 依當前持向給對的預設（§95 D1）：直持回拇指帶錨點、橫持回 v14 定案。
    Object.assign(working, defaultLayoutFor(draftRotation()));
    usingDefaults = true;
    dirty = true;
    applyLayoutToDom(layer, working);
    renderScale();
  });
  addAction(actions, 'save', '儲存', () => {
    if (dirty) {
      if (usingDefaults) resetLayout();
      else saveLayout(working);
    }
    saveRotationPref(rotationPref);
    teardown();
  });
  // 取消：還原進入時 snapshot（布局與持向）、不寫入 localStorage。
  addAction(actions, 'cancel', '取消', cancelWithoutSave);

  // 直持持向切換（§87）：即時預覽；橫持下無視覺變化，下次直持依偏好呈現。
  // 切換後重套布局（審查修復）：safe-area 換軸使 keys-layer 尺寸改變，需重新夾限。
  const rotationLabel = (pref: PortraitRotationPref): string =>
    pref === 'ccw' ? '直持鏡頭朝右' : '直持鏡頭朝左';
  const rotationButton = addAction(actions, 'rotation', rotationLabel(rotationPref), () => {
    rotationPref = rotationPref === 'ccw' ? 'cw' : 'ccw';
    applyRotationClass(rotationPref);
    renderRotation();
    // 預設態跟隨新方向重映射（§95 D1）：cw/ccw 拇指帶錨點不同；自訂布局不動。
    if (usingDefaults) Object.assign(working, defaultLayoutFor(draftRotation()));
    applyLayoutToDom(layer, working);
  });
  const renderRotation = (): void => {
    rotationButton.textContent = rotationLabel(rotationPref);
  };

  // 按鈕縮放列（§89）：縮小／放大步進 5%、範圍 80%–130%，即時預覽入 working（隨儲存
  // 持久化、取消回滾）；點按鈕避開旋轉殼內原生 range 拖曳的跨瀏覽器不確定性。
  const scaleRow = document.createElement('div');
  scaleRow.className = 'cfg-actions';
  const scaleLabel = document.createElement('div');
  scaleLabel.className = 'cfg-hint';
  scaleLabel.textContent = '按鈕大小';
  scaleRow.appendChild(scaleLabel);
  const scaleValue = document.createElement('div');
  scaleValue.className = 'cfg-hint';
  scaleValue.dataset['cfg'] = 'scale-value';
  const renderScale = (): void => {
    scaleValue.textContent = `${Math.round(working.scale * 100)}%`;
  };
  const nudgeScale = (delta: number): void => {
    working.scale = clampKeyScale(Math.round((working.scale + delta) * 100) / 100);
    // 縮放屬自訂（§95 D1）：儲存改走具體布局路徑，預設態語意解除。
    usingDefaults = false;
    dirty = true;
    renderScale();
    applyLayoutToDom(layer, working);
  };
  addAction(scaleRow, 'scale-down', '縮小', () => nudgeScale(-KEY_SCALE.step));
  scaleRow.appendChild(scaleValue);
  addAction(scaleRow, 'scale-up', '放大', () => nudgeScale(KEY_SCALE.step));
  renderScale();
  bar.appendChild(scaleRow);

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
      // 拖曳屬自訂（§95 D1）：儲存改走具體布局路徑。
      usingDefaults = false;
      dirty = true;
      // 逆變換取草稿持向（§95 D1 順手修正）：切換持向未儲存期間，殼 class 已跟隨
      // 草稿，getShellRotation 仍讀舊偏好會使拖曳軸向錯置。
      const local = pointerToLocal(
        layer.getBoundingClientRect(),
        layer.clientWidth,
        layer.clientHeight,
        draftRotation(),
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
