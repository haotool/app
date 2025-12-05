import { type useEasterEggs } from '../hooks/useEasterEggs';
import { useMemo } from 'react';

export function EasterEggs({
  activeEgg,
}: {
  activeEgg: ReturnType<typeof useEasterEggs>['activeEgg'];
}) {
  if (!activeEgg) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[200] overflow-hidden ${activeEgg === 'rumble' ? 'animate-shake' : ''}`}
    >
      {activeEgg === 'sakura' && <SakuraStorm />}
      {activeEgg === 'sushi' && <SushiRain />}
      {activeEgg === 'night' && <NightModeOverlay />}
      {activeEgg === 'glow' && <GoldenGlow />}
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .animate-shake {
          animation: shake 0.5s;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}

// Pre-generate random values to avoid calling Math.random() during render
const generateParticles = (
  count: number,
  sizeRange: [number, number],
  durationRange: [number, number],
) =>
  Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
    duration: Math.random() * (durationRange[1] - durationRange[0]) + durationRange[0],
    delay: Math.random() * 2,
  }));

const sakuraParticles = generateParticles(50, [10, 30], [2, 5]);
const sushiParticles = generateParticles(30, [20, 50], [1, 3]);
const sushis = ['🍣', '🍤', '🍱', '🍙', '🍵'];
const sushiEmojis = Array.from(
  { length: 30 },
  () => sushis[Math.floor(Math.random() * sushis.length)],
);

const SakuraStorm = () => {
  // Use useMemo to ensure stable values during re-renders
  const particles = useMemo(() => sakuraParticles, []);

  return (
    <div className="absolute inset-0">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute text-pink-300 animate-fall"
          style={{
            left: `${p.left}%`,
            top: `-20px`,
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          🌸
        </div>
      ))}
      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(360deg); }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </div>
  );
};

const SushiRain = () => {
  // Use useMemo to ensure stable values during re-renders
  const particles = useMemo(() => sushiParticles, []);
  const emojis = useMemo(() => sushiEmojis, []);

  return (
    <div className="absolute inset-0">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute animate-fall"
          style={{
            left: `${p.left}%`,
            top: `-40px`,
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {emojis[i]}
        </div>
      ))}
    </div>
  );
};

const NightModeOverlay = () => (
  <div className="absolute inset-0 bg-indigo-950/90 mix-blend-multiply animate-in fade-in duration-1000 pointer-events-none flex items-center justify-center">
    <div className="text-red-500 font-jp text-9xl opacity-20 font-bold tracking-widest writing-vertical-rl">
      百鬼夜行
    </div>
  </div>
);

const GoldenGlow = () => (
  <div className="absolute inset-0 bg-amber-500/20 mix-blend-overlay animate-pulse duration-300"></div>
);
