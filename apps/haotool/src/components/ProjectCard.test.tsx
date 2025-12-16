/**
 * ProjectCard Tests (BDD: Red phase)
 * 驗證精選作品卡會呈現 OG 預覽圖，避免只顯示漸層背景。
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';
import { ProjectCategory, type Project } from '../constants';

const demoProject: Project = {
  id: 'demo',
  title: 'DialHero',
  description: '測試用專案，應該呈現 OG 圖片。',
  tags: ['React', 'OG'],
  link: '/demo',
  imageUrl: '/og-image.png',
  featured: true,
  category: ProjectCategory.TOOL,
  status: 'live',
};

describe('ProjectCard', () => {
  it('renders project OG image with accessible alt text', () => {
    render(<ProjectCard project={demoProject} index={0} />);

    const img = screen.getByRole('img', { name: /DialHero 預覽圖/i });
    expect(img).toHaveAttribute('src', demoProject.imageUrl);
  });
});
