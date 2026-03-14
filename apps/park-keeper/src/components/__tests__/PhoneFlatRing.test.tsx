import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PhoneFlatRing from '../PhoneFlatRing';

describe('PhoneFlatRing', () => {
  it('渲染環形與標籤（visible=true）', () => {
    render(<PhoneFlatRing visible={true} label="請平放手機" />);
    expect(screen.getByTestId('phone-flat-ring')).toBeInTheDocument();
    expect(screen.getByText('請平放手機')).toBeInTheDocument();
  });

  it('不渲染（visible=false）', () => {
    render(<PhoneFlatRing visible={false} label="請平放手機" />);
    expect(screen.queryByTestId('phone-flat-ring')).not.toBeInTheDocument();
  });

  it('包含 SVG 環形圓圈', () => {
    render(<PhoneFlatRing visible={true} label="Hold Flat" />);
    const ring = screen.getByTestId('phone-flat-ring');
    const circle = ring.querySelector('circle[data-testid="ring-circle"]');
    expect(circle).toBeInTheDocument();
  });

  it('包含手機圖示 SVG', () => {
    render(<PhoneFlatRing visible={true} label="Hold Flat" />);
    const ring = screen.getByTestId('phone-flat-ring');
    const phoneSvg = ring.querySelector('[data-testid="phone-svg"]');
    expect(phoneSvg).toBeInTheDocument();
  });

  it('label 文字正確顯示', () => {
    render(<PhoneFlatRing visible={true} label="平らに持つ" />);
    expect(screen.getByText('平らに持つ')).toBeInTheDocument();
  });
});
