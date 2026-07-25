import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import type { PlayerHandle } from './player';
import type { ToastSystem } from './toasts';
import { createStarburstDirector, resetStarburstSession } from './starburstDirector';

// EX 純度回歸（§8.4／#814 T6 驗收清單）：EX 進場清除跨關持有蓄能星；
// 非 EX 進場授回持有星。session 狀態以 resetStarburstSession 隔離。

function makeScene(): Phaser.Scene {
  const handlers = new Map<string, Set<(payload: unknown) => void>>();
  const events = {
    on(event: string, fn: (payload: unknown) => void) {
      (handlers.get(event) ?? handlers.set(event, new Set()).get(event))?.add(fn);
    },
    off(event: string, fn: (payload: unknown) => void) {
      handlers.get(event)?.delete(fn);
    },
    once: vi.fn(),
    emit(event: string, payload: unknown) {
      handlers.get(event)?.forEach((fn) => fn(payload));
    },
  };
  return { events } as unknown as Phaser.Scene;
}

// spy 外置（unbound-method 紀律）：斷言走獨立 vi.fn 參照，不自 handle 提取方法。
function makePlayer(phase: string): { handle: PlayerHandle; grant: ReturnType<typeof vi.fn> } {
  const grant = vi.fn();
  const handle = {
    grantStarburstCharge: grant,
    clearStarburst: vi.fn(),
    getStarburst: () => ({ phase }),
  } as unknown as PlayerHandle;
  return { handle, grant };
}

const makeToasts = (): ToastSystem => ({ flavor: vi.fn() }) as unknown as ToastSystem;

describe('starburstDirector：EX 進場清除蓄能星（§8.4 EX 純度）', () => {
  beforeEach(() => {
    resetStarburstSession();
  });

  it('非 EX 進場：跨關持有授回 grantStarburstCharge', () => {
    // 前一關通關快照持有（charged 相位）。
    const prev = makePlayer('charged');
    createStarburstDirector(makeScene(), {
      player: () => prev.handle,
      toasts: makeToasts,
      exMode: false,
    }).noteClear();
    // 下一關（非 EX）進場：授回。
    const next = makePlayer('none');
    createStarburstDirector(makeScene(), {
      player: () => next.handle,
      toasts: makeToasts,
      exMode: false,
    });
    expect(next.grant).toHaveBeenCalledTimes(1);
  });

  it('EX 進場：棄置持有星不授回，且旗標歸零（後續非 EX 也不再授回）', () => {
    const prev = makePlayer('charged');
    createStarburstDirector(makeScene(), {
      player: () => prev.handle,
      toasts: makeToasts,
      exMode: false,
    }).noteClear();
    // EX 進場：清除。
    const ex = makePlayer('none');
    createStarburstDirector(makeScene(), {
      player: () => ex.handle,
      toasts: makeToasts,
      exMode: true,
    });
    expect(ex.grant).not.toHaveBeenCalled();
    // 旗標一併歸零：之後非 EX 進場也無殘留授回。
    const after = makePlayer('none');
    createStarburstDirector(makeScene(), {
      player: () => after.handle,
      toasts: makeToasts,
      exMode: false,
    });
    expect(after.grant).not.toHaveBeenCalled();
  });
});
