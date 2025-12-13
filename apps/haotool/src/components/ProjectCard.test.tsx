/**
 * ProjectCard Component Tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProjectCard, ProjectCardSkeleton } from './ProjectCard';
import type { Project } from '../constants';

const mockProject: Project = {
  id: 'test-project',
  title: 'Test Project',
  description: 'A test project description',
  tags: ['React', 'TypeScript', 'Tailwind'],
  link: '/test/',
  category: 'web',
  featured: false,
};

const mockFeaturedProject: Project = {
  ...mockProject,
  id: 'featured-project',
  title: 'Featured Project',
  featured: true,
};

const mockExternalProject: Project = {
  ...mockProject,
  id: 'external-project',
  title: 'External Project',
  link: 'https://example.com',
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProjectCard', () => {
  it('renders project title', () => {
    renderWithRouter(<ProjectCard project={mockProject} index={0} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders project description', () => {
    renderWithRouter(<ProjectCard project={mockProject} index={0} />);
    expect(screen.getByText('A test project description')).toBeInTheDocument();
  });

  it('renders tags', () => {
    renderWithRouter(<ProjectCard project={mockProject} index={0} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Tailwind')).toBeInTheDocument();
  });

  it('renders featured badge for featured projects', () => {
    renderWithRouter(<ProjectCard project={mockFeaturedProject} index={0} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('does not render featured badge for non-featured projects', () => {
    renderWithRouter(<ProjectCard project={mockProject} index={0} />);
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('renders internal link correctly', () => {
    renderWithRouter(<ProjectCard project={mockProject} index={0} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test/');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('renders external link correctly', () => {
    renderWithRouter(<ProjectCard project={mockExternalProject} index={0} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('ProjectCardSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = renderWithRouter(<ProjectCardSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
