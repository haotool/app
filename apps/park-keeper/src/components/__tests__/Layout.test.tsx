import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../Layout';

const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

function renderWithRouter(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter future={ROUTER_FUTURE} initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<span>Test content</span>} />
          <Route path="about" element={<span>About content</span>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Layout', () => {
  it('should hide footer on immersive app routes', () => {
    renderWithRouter();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('should render footer with copyright text on about route', () => {
    renderWithRouter(['/about']);
    expect(screen.getByText(/© 2026/)).toBeInTheDocument();
  });

  it('should render author name on about route', () => {
    renderWithRouter(['/about']);
    expect(screen.getByRole('link', { name: '阿璋 (Ah Zhang)' })).toBeInTheDocument();
  });

  it('should render navigation links (About, Settings, Privacy) on about route', () => {
    renderWithRouter(['/about']);
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
  });

  it('should have current year in copyright on about route', () => {
    renderWithRouter(['/about']);
    const copyrightEl = screen.getByText(/© 2026/);
    expect(copyrightEl).toBeInTheDocument();
  });

  it('should have sr-only metadata', () => {
    renderWithRouter();
    const srOnlyDiv = document.querySelector('.sr-only');
    expect(srOnlyDiv).toBeInTheDocument();
    expect(srOnlyDiv).toHaveAttribute('aria-hidden', 'true');
    expect(srOnlyDiv).toContainElement(document.querySelector('span[rel="author"]'));
    expect(srOnlyDiv).toContainElement(document.querySelector('time[dateTime="2026-02-25"]'));
  });

  it('should render Outlet content', () => {
    renderWithRouter();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});
