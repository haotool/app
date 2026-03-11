import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act, createElement, type ReactNode } from 'react';
import Settings from './Settings';

vi.mock('../components/SEOHelmet', () => ({
  SEOHelmet: () => null,
}));

vi.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_, tag: string) =>
        ({
          children,
          whileHover: _whileHover,
          whileTap: _whileTap,
          layoutId: _layoutId,
          transition: _transition,
          ...props
        }: Record<string, unknown>) =>
          createElement(tag, props, children as ReactNode),
    },
  ),
}));

describe('Settings hydration', () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        writable: true,
        value: originalWindow,
      });
    }
    if (originalDocument) {
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        writable: true,
        value: originalDocument,
      });
    }
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        writable: true,
        value: originalLocalStorage,
      });
    }
    document.body.innerHTML = '';
  });

  it('hydrates theme buttons into an enabled state for client users', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const html = renderToString(
      <MemoryRouter initialEntries={['/settings']}>
        <Settings />
      </MemoryRouter>,
    );

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      writable: true,
      value: originalDocument,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: originalLocalStorage,
    });

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    act(() => {
      hydrateRoot(
        container,
        <MemoryRouter initialEntries={['/settings']}>
          <Settings />
        </MemoryRouter>,
      );
    });

    const themeButtons = Array.from(container.querySelectorAll('button')).filter((button) =>
      button.getAttribute('aria-label')?.includes('Zen'),
    );

    expect(themeButtons).toHaveLength(1);
    expect(themeButtons[0]).not.toBeDisabled();
  });
});
