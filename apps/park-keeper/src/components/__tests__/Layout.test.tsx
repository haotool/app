import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../Layout';

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<span>Test content</span>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Layout', () => {
  it('should render footer with copyright text', () => {
    renderWithRouter();
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
  });

  it('should render author name', () => {
    renderWithRouter();
    expect(screen.getByRole('link', { name: '阿璋 (Ah Zhang)' })).toBeInTheDocument();
  });

  it('should render navigation links (About, Settings, Privacy)', () => {
    renderWithRouter();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
  });

  it('should have current year in copyright', () => {
    renderWithRouter();
    const year = new Date().getFullYear();
    const copyrightEl = screen.getByText(new RegExp(`© ${year}`));
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
