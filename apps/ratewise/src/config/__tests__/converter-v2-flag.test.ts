/**
 * converter-v2 flag 讀取端 SSOT 測試：URL override > 使用者設定（converterStore）> 預設 off、
 * 持久化與訂閱通知、server snapshot 恆為 legacy（SSG 不變性紅線）。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_CONVERTER_V2_VARIANT,
  getConverterV2ServerSnapshot,
  getConverterV2Snapshot,
  getConverterV2Variant,
  getConverterV2VariantServerSnapshot,
  setConverterV2Variant,
  subscribeConverterV2Variant,
} from '../converter-v2-flag';
import { useConverterStore } from '../../stores/converterStore';
import { CONVERTER_STORE_KEY } from '../../features/ratewise/storage-keys';

describe('converter-v2-flag', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
    useConverterStore.setState({ singleConverterVariant: DEFAULT_CONVERTER_V2_VARIANT });
  });

  it('預設為 legacy（flag off）', () => {
    expect(DEFAULT_CONVERTER_V2_VARIANT).toBe('legacy');
    expect(getConverterV2Variant()).toBe('legacy');
    expect(getConverterV2Snapshot()).toBe(false);
  });

  it('server snapshot 恆為 false，保證 SSG 輸出不受使用者設定影響', () => {
    useConverterStore.setState({ singleConverterVariant: 'v2' });
    expect(getConverterV2ServerSnapshot()).toBe(false);
  });

  it('variant server snapshot 恆為預設 legacy（設定頁 override 提示 hydration 安全）', () => {
    useConverterStore.setState({ singleConverterVariant: 'v2' });
    expect(getConverterV2VariantServerSnapshot()).toBe(DEFAULT_CONVERTER_V2_VARIANT);
  });

  it('使用者設定為 v2 時啟用 v2（converterStore SSOT）', () => {
    useConverterStore.setState({ singleConverterVariant: 'v2' });
    expect(getConverterV2Variant()).toBe('v2');
    expect(getConverterV2Snapshot()).toBe(true);
  });

  it('URL ?converter=v2 覆蓋使用者設定的 legacy', () => {
    window.history.replaceState(null, '', '/?converter=v2');
    expect(getConverterV2Variant()).toBe('v2');
  });

  it('URL ?converter=legacy 覆蓋使用者設定的 v2', () => {
    useConverterStore.setState({ singleConverterVariant: 'v2' });
    window.history.replaceState(null, '', '/?converter=legacy');
    expect(getConverterV2Variant()).toBe('legacy');
  });

  it('URL 非法值時回落使用者設定', () => {
    useConverterStore.setState({ singleConverterVariant: 'v2' });
    window.history.replaceState(null, '', '/?converter=bogus');
    expect(getConverterV2Variant()).toBe('v2');
  });

  it('setConverterV2Variant 持久化進 converterStore 並通知訂閱者', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeConverterV2Variant(listener);

    setConverterV2Variant('v2');

    expect(useConverterStore.getState().singleConverterVariant).toBe('v2');
    expect(listener).toHaveBeenCalled();
    expect(getConverterV2Variant()).toBe('v2');

    // 持久化與 lastConverterView 同域（'ratewise-converter'），無獨立 flag key。
    const persisted = JSON.parse(window.localStorage.getItem(CONVERTER_STORE_KEY) ?? '{}') as {
      state?: { singleConverterVariant?: string };
    };
    expect(persisted.state?.singleConverterVariant).toBe('v2');
    expect(window.localStorage.getItem('ratewise:converterV2')).toBeNull();

    unsubscribe();
    listener.mockClear();
    setConverterV2Variant('legacy');
    expect(listener).not.toHaveBeenCalled();
  });
});
