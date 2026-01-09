/**
 * MobileMenu Component Tests
 * [BDD:2026-01-09] 測試 MobileMenu 組件的渲染和導航功能
 * [context7:vitest-dev/vitest:2026-01-09]
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileMenu from './MobileMenu';

// framer-motion is mocked globally in test/setup.ts

describe('MobileMenu', () => {
  it('does not render when isOpen is false', () => {
    const onClose = vi.fn();
    const onNavigate = vi.fn();

    render(<MobileMenu isOpen={false} onClose={onClose} onNavigate={onNavigate} />);

    expect(screen.queryByText('作品集')).not.toBeInTheDocument();
    expect(screen.queryByText('關於')).not.toBeInTheDocument();
    expect(screen.queryByText('聯繫')).not.toBeInTheDocument();
  });

  it('renders navigation links when isOpen is true', () => {
    const onClose = vi.fn();
    const onNavigate = vi.fn();

    render(<MobileMenu isOpen={true} onClose={onClose} onNavigate={onNavigate} />);

    expect(screen.getByText('作品集')).toBeInTheDocument();
    expect(screen.getByText('關於')).toBeInTheDocument();
    expect(screen.getByText('聯繫')).toBeInTheDocument();
  });

  it('has correct href attributes on links', () => {
    const onClose = vi.fn();
    const onNavigate = vi.fn();

    render(<MobileMenu isOpen={true} onClose={onClose} onNavigate={onNavigate} />);

    expect(screen.getByRole('link', { name: '作品集' })).toHaveAttribute('href', '#projects');
    expect(screen.getByRole('link', { name: '關於' })).toHaveAttribute('href', '#about');
    expect(screen.getByRole('link', { name: '聯繫' })).toHaveAttribute('href', '#contact');
  });

  it('calls onNavigate and onClose when a link is clicked', () => {
    const onClose = vi.fn();
    const onNavigate = vi.fn();

    render(<MobileMenu isOpen={true} onClose={onClose} onNavigate={onNavigate} />);

    const projectsLink = screen.getByRole('link', { name: '作品集' });
    fireEvent.click(projectsLink);

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(expect.any(Object), '#projects');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls correct id for each navigation link', () => {
    const onClose = vi.fn();
    const onNavigate = vi.fn();

    render(<MobileMenu isOpen={true} onClose={onClose} onNavigate={onNavigate} />);

    // Click "關於" link
    const aboutLink = screen.getByRole('link', { name: '關於' });
    fireEvent.click(aboutLink);
    expect(onNavigate).toHaveBeenLastCalledWith(expect.any(Object), '#about');

    // Click "聯繫" link
    const contactLink = screen.getByRole('link', { name: '聯繫' });
    fireEvent.click(contactLink);
    expect(onNavigate).toHaveBeenLastCalledWith(expect.any(Object), '#contact');
  });

  it('renders three navigation links', () => {
    const onClose = vi.fn();
    const onNavigate = vi.fn();

    render(<MobileMenu isOpen={true} onClose={onClose} onNavigate={onNavigate} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
  });
});
