/** 貓咪遊玩模式粒子工廠函數 */

export interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  type: 'paw' | 'celebrate';
  spin: number;
}

let _nextId = 0;

export function makePawParticle(x: number, y: number): Particle {
  return { id: _nextId++, x, y, emoji: '🐾', type: 'paw', spin: 0 };
}

const CELEBRATE_EMOJIS = ['🐱', '🐾', '✨', '🎉', '😻', '💜', '🌟', '🐈'];

export function makeCelebrateParticles(count = 10): Particle[] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return Array.from({ length: count }, () => ({
    id: _nextId++,
    x: vw * 0.1 + Math.random() * vw * 0.8,
    y: vh * 0.5 + Math.random() * vh * 0.3,
    emoji: CELEBRATE_EMOJIS[Math.floor(Math.random() * CELEBRATE_EMOJIS.length)] ?? '🐾',
    type: 'celebrate' as const,
    spin: (Math.random() - 0.5) * 720,
  }));
}
