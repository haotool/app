/**
 * card-rate flag 讀取端 SSOT 測試（ADR-002 Phase 1）：
 * URL override > 使用者設定（converterStore）> 預設 off、server snapshot 恆為 off（SSG 零暴露紅線）。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCardRateServerSnapshot,
  isCardRateEnabled,
  setCardRateEnabled,
  subscribeCardRateFlag,
} from '../card-rate-flag';
import { useConverterStore } from '../../stores/converterStore';
import { CONVERTER_STORE_KEY } from '../../features/ratewise/storage-keys';

describe('card-rate-flag', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
    useConverterStore.setState({ cardRateEnabled: false });
  });

  it('預設為 off（flag off 前端零暴露）', () => {
    expect(isCardRateEnabled()).toBe(false);
  });

  it('server snapshot 恆為 false，保證 SSG 輸出不受使用者設定影響', () => {
    useConverterStore.setState({ cardRateEnabled: true });
    expect(getCardRateServerSnapshot()).toBe(false);
  });

  it('使用者設定開啟時啟用（converterStore SSOT）', () => {
    useConverterStore.setState({ cardRateEnabled: true });
    expect(isCardRateEnabled()).toBe(true);
  });

  it('URL ?cardRate=on 覆蓋使用者設定的 off', () => {
    window.history.replaceState(null, '', '/?cardRate=on');
    expect(isCardRateEnabled()).toBe(true);
  });

  it('URL ?cardRate=off 覆蓋使用者設定的 on', () => {
    useConverterStore.setState({ cardRateEnabled: true });
    window.history.replaceState(null, '', '/?cardRate=off');
    expect(isCardRateEnabled()).toBe(false);
  });

  it('URL 非法值時回落使用者設定', () => {
    useConverterStore.setState({ cardRateEnabled: true });
    window.history.replaceState(null, '', '/?cardRate=bogus');
    expect(isCardRateEnabled()).toBe(true);
  });

  it('setCardRateEnabled 持久化進 converterStore 並通知訂閱者', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeCardRateFlag(listener);

    setCardRateEnabled(true);

    expect(useConverterStore.getState().cardRateEnabled).toBe(true);
    expect(listener).toHaveBeenCalled();
    expect(isCardRateEnabled()).toBe(true);

    const persisted = JSON.parse(window.localStorage.getItem(CONVERTER_STORE_KEY) ?? '{}') as {
      state?: { cardRateEnabled?: boolean };
    };
    expect(persisted.state?.cardRateEnabled).toBe(true);

    unsubscribe();
    listener.mockClear();
    setCardRateEnabled(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
