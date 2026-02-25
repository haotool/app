import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Settings from '../Settings';

const { homeMock } = vi.hoisted(() => ({
  homeMock: vi.fn(({ initialTab }: { initialTab?: 'list' | 'settings' }) => (
    <div data-testid="home-mock">home:{initialTab ?? 'list'}</div>
  )),
}));

vi.mock('../Home', () => ({
  default: (props: { initialTab?: 'list' | 'settings' }) => homeMock(props),
}));

describe('Settings page', () => {
  beforeEach(() => {
    homeMock.mockClear();
  });

  it('reuses Home UI with settings tab as initial state', () => {
    render(<Settings />);

    expect(screen.getByTestId('home-mock')).toHaveTextContent('home:settings');
    expect(homeMock).toHaveBeenCalled();
    expect(homeMock.mock.calls[0]?.[0]).toMatchObject({ initialTab: 'settings' });
  });
});
