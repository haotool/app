import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SupportContactLinks } from '../SupportContactLinks';
import { APP_INFO } from '../../config/app-info';

describe('SupportContactLinks', () => {
  it('renders title, description, and author contact links from SSOT', () => {
    render(<SupportContactLinks title="回報問題" description="若問題持續發生，請直接聯繫作者。" />);

    expect(screen.getByText('回報問題')).toBeInTheDocument();
    expect(screen.getByText('若問題持續發生，請直接聯繫作者。')).toBeInTheDocument();

    const threadsLink = screen.getByRole('link', { name: /threads/i });
    expect(threadsLink).toHaveAttribute('href', APP_INFO.threadsUrl);
    expect(threadsLink).toHaveTextContent(APP_INFO.socialHandle);

    const emailLink = screen.getByRole('link', { name: /email/i });
    expect(emailLink).toHaveAttribute('href', `mailto:${APP_INFO.email}`);
    expect(emailLink).toHaveTextContent(APP_INFO.email);
  });

  it('keeps the container non-blocking while preserving clickable contact links', () => {
    const { container } = render(<SupportContactLinks />);

    expect(container.firstChild).toHaveClass('pointer-events-none');
    expect(screen.getByRole('link', { name: /threads/i })).toHaveClass('pointer-events-auto');
    expect(screen.getByRole('link', { name: /email/i })).toHaveClass('pointer-events-auto');
  });
});
