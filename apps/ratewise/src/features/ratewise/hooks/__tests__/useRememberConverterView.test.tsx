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
});
