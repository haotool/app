/**
 * TextReveal Component Tests
 * [BDD:2026-01-09] 測試 TextReveal 組件的字符渲染功能
 * [context7:vitest-dev/vitest:2026-01-09]
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextReveal } from './TextReveal';

// framer-motion is mocked globally in test/setup.ts

describe('TextReveal', () => {
  it('renders text content', () => {
    const { container } = render(<TextReveal text="Hello" />);

    // Each character is rendered in a separate span
    const spans = container.querySelectorAll('span.inline-block');
    const textContent = Array.from(spans)
      .map((span) => span.textContent)
      .join('');
    expect(textContent).toBe('Hello');
    expect(spans.length).toBe(5);
  });

  it('applies custom className', () => {
    render(<TextReveal text="Test" className="custom-class" />);

    // The wrapper span should have the custom class
    const wrapper = screen.getByText('T').parentElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('converts spaces to non-breaking spaces', () => {
    const { container } = render(<TextReveal text="a b" />);

    // Check for non-breaking space character in the rendered HTML
    const spans = container.querySelectorAll('span.inline-block');
    const hasNonBreakingSpace = Array.from(spans).some((span) => span.textContent === '\u00A0');
    expect(hasNonBreakingSpace).toBe(true);
  });

  it('renders empty string without errors', () => {
    const { container } = render(<TextReveal text="" />);
    expect(container).toBeInTheDocument();
  });

  it('renders correct number of character spans', () => {
    const { container } = render(<TextReveal text="ABCDE" />);

    const characterSpans = container.querySelectorAll('span.inline-block');
    expect(characterSpans.length).toBe(5);
  });

  it('preserves special characters', () => {
    render(<TextReveal text="Hi!" />);

    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('i')).toBeInTheDocument();
    expect(screen.getByText('!')).toBeInTheDocument();
  });
});
