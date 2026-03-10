import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TestMemoryRouter } from '../test/RouterWrapper';

vi.mock('../components/Counter', () => ({
  Counter: ({ value, suffix }: { value: string; suffix?: string }) => (
    <span>
      {value}
      {suffix && <span>{suffix}</span>}
    </span>
  ),
}));

vi.mock('../components/ThreeHero', () => ({
  default: () => <div data-testid="three-hero-mock">3D Hero Scene</div>,
}));

vi.mock('../components/SectionBackground', () => ({
  default: () => <div data-testid="section-background">Section Background</div>,
}));

vi.mock('../components/MobileMenu', () => ({
  default: () => null,
}));

vi.mock('../components/TextReveal', () => ({
  TextReveal: ({ text, className }: { text: string; className?: string }) => (
    <span className={className}>{text}</span>
  ),
}));

vi.mock('../components/Toast', () => ({
  default: () => null,
}));

import Home from './Home';

describe('Home SSG output', () => {
  it('首頁 SSG HTML 不應再包含 React Suspense fallback 標記', () => {
    const html = renderToString(
      <TestMemoryRouter>
        <Home />
      </TestMemoryRouter>,
    );

    expect(html).not.toContain('<!--$');
    expect(html).not.toContain('template id="B:');
  });
});
