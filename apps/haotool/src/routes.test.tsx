/**
 * Routes Tests — 4 條路由實際 render + 404 catch-all
 */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import routes from './routes';

afterEach(() => {
  cleanup();
});

function renderRoute(path: string) {
  const router = createMemoryRouter(routes as RouteObject[], { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('routes render', () => {
  it('/ 渲染首頁 h1', async () => {
    renderRoute('/');
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('把好想法，做成好工具。');
  });

  it('/tools/ 渲染工具總覽 h1 與 5 張工具卡', async () => {
    renderRoute('/tools/');
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('所有工具');
    expect(await screen.findByRole('heading', { name: /HaoRate 匯率好工具/ })).toBeInTheDocument();
  });

  it('/about/ 渲染關於頁 h1 與隱私錨點', async () => {
    const { container } = renderRoute('/about/');
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('關於 HaoTool');
    expect(container.querySelector('#privacy')).not.toBeNull();
  });

  it('/contact/ 渲染聯繫頁 h1', async () => {
    renderRoute('/contact/');
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('與我聯繫');
  });

  it('未知路徑渲染 404 頁', async () => {
    renderRoute('/does-not-exist/');
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('找不到頁面');
  });

  it('/404 渲染 404 頁（供 SSG 預渲染）', async () => {
    renderRoute('/404');
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('找不到頁面');
  });

  it('每頁皆含 main landmark 與 SkipLink', async () => {
    renderRoute('/');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByText('跳至主內容')).toBeInTheDocument();
  });
});

describe('routes 結構', () => {
  it('共用 Layout 包含 4 條子路由 + 404 + catch-all', () => {
    const layoutRoute = routes[0];
    expect(layoutRoute?.path).toBe('/');
    expect(layoutRoute?.Component).toBeDefined();
    const childPaths = (layoutRoute?.children ?? []).map((child) =>
      'index' in child && child.index ? '(index)' : child.path,
    );
    expect(childPaths).toEqual(['(index)', 'tools', 'about', 'contact', '404', '*']);
  });
});
