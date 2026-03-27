import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemberAvatar } from '../MemberAvatar';

describe('MemberAvatar', () => {
  it('seed 字串時渲染 boring-avatar span', () => {
    render(<MemberAvatar seed="random-uuid-seed" alt="Alice" />);
    expect(screen.getByRole('img', { name: 'Alice' })).toBeInTheDocument();
  });

  it('data: URL 時 fallback 成 <img>', () => {
    render(<MemberAvatar seed="data:image/png;base64,abc" alt="Legacy" size={48} />);
    const img = screen.getByRole('img', { name: 'Legacy' }) as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
    expect(img.src).toContain('data:image/png');
  });

  it('http URL 時 fallback 成 <img>', () => {
    render(<MemberAvatar seed="https://example.com/avatar.png" alt="Remote" />);
    const img = screen.getByRole('img', { name: 'Remote' }) as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
  });

  it('/ URL 時 fallback 成 <img>', () => {
    render(<MemberAvatar seed="/local/avatar.png" alt="Local" />);
    const img = screen.getByRole('img', { name: 'Local' }) as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
  });

  it('預設 alt 為空字串時渲染 span[role=img]', () => {
    const { container } = render(<MemberAvatar seed="some-seed" />);
    const span = container.querySelector('span[role="img"]');
    expect(span).toBeInTheDocument();
  });

  it('className 套用到元素', () => {
    const { container } = render(<MemberAvatar seed="seed-abc" alt="Test" className="grayscale" />);
    const el = container.firstElementChild;
    expect(el?.className).toContain('grayscale');
  });

  it('自訂 size 傳遞正確寬高', () => {
    render(<MemberAvatar seed="data:image/png;base64,x" alt="Sized" size={64} />);
    const img = screen.getByRole('img', { name: 'Sized' }) as HTMLImageElement;
    expect(img.width).toBe(64);
    expect(img.height).toBe(64);
  });
});
