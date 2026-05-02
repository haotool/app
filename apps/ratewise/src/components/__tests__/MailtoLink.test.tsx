import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { MailtoLink } from '../MailtoLink';

describe('MailtoLink', () => {
  it('renders as <button> (so Lighthouse crawlable-anchors is not triggered)', () => {
    render(<MailtoLink email="test@example.com" />);
    const el = screen.getByRole('button');
    expect(el.tagName).toBe('BUTTON');
    expect(el).toHaveAttribute('type', 'button');
  });

  it('hides the @ symbol in SSG output to avoid raw email harvesting', () => {
    // SSG output (renderToString does not execute useEffect)
    const ssg = renderToString(<MailtoLink email="test@example.com" />);
    expect(ssg).toContain('test [at] example.com');
    expect(ssg).not.toContain('test@example.com');
    expect(ssg).not.toContain('mailto:');
  });

  it('does not emit an <a> element (avoids Cloudflare Email Obfuscation rewrite)', () => {
    const { container } = render(<MailtoLink email="test@example.com" />);
    expect(container.querySelector('a')).toBeNull();
  });

  it('opens mailto when clicked', () => {
    const originalLocation = window.location;
    const setHrefMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new Proxy(originalLocation, {
        set(_target, prop, value) {
          if (prop === 'href') setHrefMock(value);
          return true;
        },
        get(target, prop) {
          return Reflect.get(target, prop);
        },
      }),
    });

    render(<MailtoLink email="test@example.com" />);
    fireEvent.click(screen.getByRole('button'));
    expect(setHrefMock).toHaveBeenCalledWith('mailto:test@example.com');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('applies provided className alongside reset styles', () => {
    render(<MailtoLink email="x@y.z" className="text-primary underline" />);
    const el = screen.getByRole('button');
    expect(el.className).toContain('text-primary');
    expect(el.className).toContain('underline');
    // baseline reset classes still applied
    expect(el.className).toContain('bg-transparent');
    expect(el.className).toContain('cursor-pointer');
  });
});
