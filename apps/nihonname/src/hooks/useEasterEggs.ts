import { useState, useEffect, useRef } from 'react';

type EasterEggType = 'sakura' | 'night' | 'chime' | 'sushi' | 'glow' | 'rumble' | null;

// Konami Code Sequence - defined outside component to avoid recreating on each render
const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export function useEasterEggs() {
  const [activeEgg, setActiveEgg] = useState<EasterEggType>(null);
  const keySequenceRef = useRef<string[]>([]);
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastLogoClickTime, setLastLogoClickTime] = useState(0);
  const [toriiClicks, setToriiClicks] = useState(0);
  const [lastToriiClickTime, setLastToriiClickTime] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const newSeq = [...keySequenceRef.current, e.key].slice(-10); // Keep last 10 keys
      keySequenceRef.current = newSeq;

      // Check Konami
      if (newSeq.join(',').includes(KONAMI_CODE.join(','))) {
        setActiveEgg('sakura');
        setTimeout(() => setActiveEgg(null), 5000);
      }

      // Check Sushi
      if (newSeq.slice(-5).join('').toLowerCase() === 'sushi') {
        setActiveEgg('sushi');
        setTimeout(() => setActiveEgg(null), 4000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastLogoClickTime < 500) {
      const newCount = logoClicks + 1;
      setLogoClicks(newCount);
      if (newCount === 5) {
        setActiveEgg(activeEgg === 'night' ? null : 'night');
        setLogoClicks(0);
      }
    } else {
      setLogoClicks(1);
    }
    setLastLogoClickTime(now);
  };

  const handleToriiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastToriiClickTime < 500) {
      const newCount = toriiClicks + 1;
      setToriiClicks(newCount);
      if (newCount === 3) {
        setActiveEgg('rumble');
        setTimeout(() => setActiveEgg(null), 1000);
        setToriiClicks(0);
      }
    } else {
      setToriiClicks(1);
    }
    setLastToriiClickTime(now);
  };

  const handleDoubleTextClick = () => {
    setActiveEgg('glow');
    setTimeout(() => setActiveEgg(null), 2000);
  };

  return {
    activeEgg,
    handleLogoClick,
    handleDoubleTextClick,
    handleToriiClick,
  };
}
