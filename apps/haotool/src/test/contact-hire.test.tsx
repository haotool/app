/**
 * Contact 委託資訊區測試（PRD §5.4）：承接範圍四項、合作流程三步、SLA 承諾列。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import Contact from '../pages/Contact';

afterEach(() => {
  cleanup();
});

describe('Contact 委託資訊區', () => {
  it('渲染委託與合作標題與承接範圍四項', () => {
    render(<Contact />);
    expect(screen.getByRole('heading', { name: '委託與合作' })).toBeInTheDocument();

    const scopeList = screen.getByRole('list', { name: '承接範圍' });
    for (const scope of ['Web 前端', 'PWA', '效能優化', '技術顧問']) {
      expect(scopeList).toHaveTextContent(scope);
    }
  });

  it('渲染合作流程三步（依序）', () => {
    render(<Contact />);
    for (const step of ['聊需求', '報價與時程', '迭代交付']) {
      expect(screen.getByRole('heading', { name: step })).toBeInTheDocument();
    }
  });

  it('渲染 24 小時回覆 SLA 承諾列（單一實例）', () => {
    render(<Contact />);
    expect(screen.getAllByText('通常在 24 小時內回覆。')).toHaveLength(1);
  });
});
