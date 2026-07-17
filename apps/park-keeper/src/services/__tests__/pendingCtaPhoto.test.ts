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

  // HTML 內聯橋接（issue #738）：postbuild bootstrap 將 hydration 前的 CTA 照片
  // 暫存 window.__pkCtaPhoto 並發 pk:cta-photo 事件；模組須涵蓋兩種載入順序。
  describe('pre-hydration 橋接領養', () => {
    it('橋接照片先於模組載入（window.__pkCtaPhoto 已存在）：import 後訂閱即取回', async () => {
      const file = makeFile('bridge-before.jpg');
      window.__pkCtaPhoto = file;

      const channel = await loadFresh();
      expect(window.__pkCtaPhoto).toBeUndefined();

      const callback = vi.fn();
      channel.subscribe(callback);
      expect(callback).toHaveBeenCalledExactlyOnceWith(file);
    });

    it('橋接事件晚於模組載入（pk:cta-photo dispatch）：訂閱者即時收到', async () => {
      const channel = await loadFresh();
      const callback = vi.fn();
      channel.subscribe(callback);

      const file = makeFile('bridge-after.jpg');
      window.__pkCtaPhoto = file;
      window.dispatchEvent(new Event('pk:cta-photo'));

      expect(window.__pkCtaPhoto).toBeUndefined();
      expect(callback).toHaveBeenCalledExactlyOnceWith(file);
    });
  });
});
