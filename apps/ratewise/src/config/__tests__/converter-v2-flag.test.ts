/**
 * converter-v2 flag 基建測試：URL override 優先序、localStorage 持久化、CustomEvent 廣播、
 * server snapshot 恆為 legacy（SSG 不變性紅線）。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CONVERTER_V2_CHANGE_EVENT,
  DEFAULT_CONVERTER_V2_VARIANT,
  getConverterV2ServerSnapshot,
  getConverterV2Snapshot,
  getConverterV2Variant,
  setConverterV2Variant,
  subscribeConverterV2Variant,
} from '../converter-v2-flag';

describe('converter-v2-flag', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('預設為 legacy（flag off）', () => {
    expect(DEFAULT_CONVERTER_V2_VARIANT).toBe('legacy');
    expect(getConverterV2Variant()).toBe('legacy');
    expect(getConverterV2Snapshot()).toBe(false);
  });

  it('server snapshot 恆為 false，保證 SSG 輸出不受 flag 影響', () => {
    window.localStorage.setItem('ratewise:converterV2', 'v2');
    expect(getConverterV2ServerSnapshot()).toBe(false);
  });

  it('localStorage 值為 v2 時啟用 v2', () => {
    window.localStorage.setItem('ratewise:converterV2', 'v2');
    expect(getConverterV2Variant()).toBe('v2');
    expect(getConverterV2Snapshot()).toBe(true);
  });

  it('localStorage 非法值時回退預設', () => {
    window.localStorage.setItem('ratewise:converterV2', 'bogus');
    expect(getConverterV2Variant()).toBe('legacy');
  });

  it('URL ?converter=v2 覆蓋 localStorage 的 legacy', () => {
    window.localStorage.setItem('ratewise:converterV2', 'legacy');
    window.history.replaceState(null, '', '/?converter=v2');
    expect(getConverterV2Variant()).toBe('v2');
  });

  it('URL ?converter=legacy 覆蓋 localStorage 的 v2', () => {
    window.localStorage.setItem('ratewise:converterV2', 'v2');
    window.history.replaceState(null, '', '/?converter=legacy');
    expect(getConverterV2Variant()).toBe('legacy');
  });

  it('setConverterV2Variant 寫入 localStorage 並派發 CustomEvent', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeConverterV2Variant(listener);

    setConverterV2Variant('v2');

    expect(window.localStorage.getItem('ratewise:converterV2')).toBe('v2');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getConverterV2Variant()).toBe('v2');

    unsubscribe();
    setConverterV2Variant('legacy');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('CustomEvent 名稱固定，供跨模組訂閱', () => {
    expect(CONVERTER_V2_CHANGE_EVENT).toBe('ratewise:converter-v2-change');
  });
});
