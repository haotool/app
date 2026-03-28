/**
 * CatPlayLayer — 貓咪遊玩模式粒子容器
 * 管理兩種粒子：
 *   - paw: 計算機按鈕上的爪印飄浮特效
 *   - celebrate: 儲存費用時的慶祝噴射
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Particle } from '../lib/catPlay';

export type { Particle } from '../lib/catPlay';

interface CatPlayLayerProps {
  particles: Particle[];
  onRemove: (id: number) => void;
}

export function CatPlayLayer({ particles, onRemove }: CatPlayLayerProps) {
  return createPortal(
    <>
      {particles.map((p) => (
        <ParticleNode key={p.id} particle={p} onDone={() => onRemove(p.id)} />
      ))}
    </>,
    document.body,
  );
}

function ParticleNode({ particle, onDone }: { particle: Particle; onDone: () => void }) {
  useEffect(() => {
    const duration = particle.type === 'paw' ? 650 : 1200;
    const timer = setTimeout(onDone, duration);
    return () => clearTimeout(timer);
    // onDone is stable (inline arrow in map — remount handled by key)
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style: React.CSSProperties = {
    position: 'fixed',
    left: particle.x,
    top: particle.y,
    fontSize: particle.type === 'paw' ? '18px' : '22px',
    lineHeight: 1,
    zIndex: 9999,
    userSelect: 'none',
    ['--spin' as string]: `${particle.spin}deg`,
  };

  return (
    <span
      className={particle.type === 'paw' ? 'paw-particle' : 'cat-particle'}
      style={style}
      aria-hidden="true"
    >
      {particle.emoji}
    </span>
  );
}
