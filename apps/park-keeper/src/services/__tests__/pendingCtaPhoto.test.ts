/**
 * pendingCtaPhoto 測試（issue #725 審查收斂）：
 * 殼→Home 拍照交接通道的 retain-until-consumed 語意。
 * 模組為單例狀態：每案例以 resetModules＋動態載入隔離。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

async function loadFresh() {
  vi.resetModules();
  const mod = await import('../pendingCtaPhoto');
  return mod.pendingCtaPhoto;
}

const makeFile = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

describe('pendingCtaPhoto', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('先 push 再 subscribe：訂閱時取回暫存檔，消費後不重複交付', async () => {
    const channel = await loadFresh();
    const file = makeFile('a.jpg');
    channel.push(file);

    const first = vi.fn();
    channel.subscribe(first);
    expect(first).toHaveBeenCalledExactlyOnceWith(file);

    // 已消費（ack）：後續訂閱不得重複收到。
    const second = vi.fn();
    channel.subscribe(second);
    expect(second).not.toHaveBeenCalled();
  });

  it('先 subscribe 再 push：立即交付', async () => {
    const channel = await loadFresh();
    const callback = vi.fn();
    channel.subscribe(callback);

    const file = makeFile('b.jpg');
    channel.push(file);
    expect(callback).toHaveBeenCalledExactlyOnceWith(file);
  });

  it('unsubscribe 後 push 進入暫存，新訂閱者可取回', async () => {
    const channel = await loadFresh();
    const gone = vi.fn();
    const unsubscribe = channel.subscribe(gone);
    unsubscribe();

    const file = makeFile('c.jpg');
    channel.push(file);
    expect(gone).not.toHaveBeenCalled();

    const next = vi.fn();
    channel.subscribe(next);
    expect(next).toHaveBeenCalledExactlyOnceWith(file);
  });

  it('retain-until-consumed：callback 拋錯不清暫存，重新訂閱仍可取回', async () => {
    const channel = await loadFresh();
    const file = makeFile('d.jpg');
    channel.push(file);

    expect(() =>
      channel.subscribe(() => {
        throw new Error('handler boom');
      }),
    ).toThrow('handler boom');

    const recovered = vi.fn();
    channel.subscribe(recovered);
    expect(recovered).toHaveBeenCalledExactlyOnceWith(file);
  });
});
