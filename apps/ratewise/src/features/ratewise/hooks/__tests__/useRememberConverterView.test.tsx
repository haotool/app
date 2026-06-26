// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { CONVERTER_MODES } from '../../constants';
import { useRememberConverterView } from '../useRememberConverterView';
import { useConverterStore } from '../../../../stores/converterStore';

describe('useRememberConverterView', () => {
  beforeEach(() => {
    useConverterStore.setState({ lastConverterView: CONVERTER_MODES[0] });
  });

  it('mount 時寫入 single', async () => {
    renderHook(() => useRememberConverterView(CONVERTER_MODES[0]));

    await waitFor(() => {
      expect(useConverterStore.getState().lastConverterView).toBe('single');
    });
  });

  it('mount 時寫入 multi', async () => {
    renderHook(() => useRememberConverterView(CONVERTER_MODES[1]));

    await waitFor(() => {
      expect(useConverterStore.getState().lastConverterView).toBe('multi');
    });
  });

  it('microtask 執行前卸載時取消寫入（避免冷啟動還原被覆寫）', async () => {
    useConverterStore.setState({ lastConverterView: CONVERTER_MODES[1] });
    const { unmount } = renderHook(() => useRememberConverterView(CONVERTER_MODES[0]));

    // 在排程的 microtask 執行前同步卸載，cleanup 應將寫入取消。
    unmount();
    await Promise.resolve();

    expect(useConverterStore.getState().lastConverterView).toBe('multi');
  });

  it('enabled=false 時不寫入（deep-link 進入不覆寫偏好）', async () => {
    useConverterStore.setState({ lastConverterView: CONVERTER_MODES[1] });
    renderHook(() => useRememberConverterView(CONVERTER_MODES[0], { enabled: false }));

    await Promise.resolve();

    expect(useConverterStore.getState().lastConverterView).toBe('multi');
  });
});
