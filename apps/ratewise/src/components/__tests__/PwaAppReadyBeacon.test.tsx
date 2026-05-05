import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { PwaAppReadyBeacon } from '../PwaAppReadyBeacon';

describe('PwaAppReadyBeacon', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-ratewise-app-ready');
  });

  it('應在首次 React commit 後才送出 app-ready 訊號', async () => {
    render(<PwaAppReadyBeacon />);

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-ratewise-app-ready')).toBe('true');
    });
  });
});
