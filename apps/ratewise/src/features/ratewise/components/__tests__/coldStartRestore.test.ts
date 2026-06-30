// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import {
  __resetColdStartRestoreForTests,
  isPersistedMultiPendingStoreSync,
  readPersistedLastConverterView,
  shouldRestoreToMulti,
} from '../coldStartRestore';
import { CONVERTER_STORE_KEY } from '../../storage-keys';

const multiPersistPayload = JSON.stringify({
  state: { lastConverterView: 'multi' },
  version: 0,
});

describe('coldStartRestore', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetColdStartRestoreForTests();
  });

  it('readPersistedLastConverterView 讀取 persist 中的 lastConverterView', () => {
    localStorage.setItem(CONVERTER_STORE_KEY, multiPersistPayload);
    expect(readPersistedLastConverterView()).toBe('multi');
  });

  it('store 尚未同步 multi 時 shouldRestoreToMulti 仍為 true', () => {
    localStorage.setItem(CONVERTER_STORE_KEY, multiPersistPayload);
    expect(
      shouldRestoreToMulti({
        hydrated: true,
        hasDeepLink: false,
        lastConverterView: 'single',
      }),
    ).toBe(true);
    expect(isPersistedMultiPendingStoreSync('single')).toBe(true);
  });

  it('deep-link 存在時不還原', () => {
    localStorage.setItem(CONVERTER_STORE_KEY, multiPersistPayload);
    expect(
      shouldRestoreToMulti({
        hydrated: true,
        hasDeepLink: true,
        lastConverterView: 'single',
      }),
    ).toBe(false);
  });
});
