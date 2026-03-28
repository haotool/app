/**
 * CatCompanion — 貓咪遊玩模式的互動角色
 * 固定在右下角（BottomNav 上方），只在 catPlayMode=true 時顯示。
 *
 * 狀態機：
 *   idle     → 輕微呼吸縮放，每 8~15s 隨機切換到 walking
 *   walking  → 貓咪向左移動再折返，完成後回 idle
 *   react    → 點擊時跳動，0.5s 後回 idle
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type CatState = 'idle' | 'walking' | 'react';

interface CatCompanionProps {
  bottomOffset?: number; // BottomNav 高度，預設 80px
}

export function CatCompanion({ bottomOffset = 80 }: CatCompanionProps) {
  const [catState, setCatState] = useState<CatState>('idle');
  const [showHeart, setShowHeart] = useState(false);
  const [walkX, setWalkX] = useState(0);
  const walkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 排程下一次 walking
  const scheduleWalk = () => {
    const delay = 8000 + Math.random() * 7000;
    walkTimerRef.current = setTimeout(() => {
      setCatState('walking');
      setWalkX(-80);
    }, delay);
  };

  useEffect(() => {
    scheduleWalk();
    return () => {
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (catState === 'walking') return;
    setCatState('react');
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    setTimeout(() => {
      setCatState('idle');
      scheduleWalk();
    }, 500);
  };

  const onWalkComplete = () => {
    if (catState !== 'walking') return;
    // 折返
    if (walkX < 0) {
      setWalkX(0);
    } else {
      setCatState('idle');
      scheduleWalk();
    }
  };

  return (
    <div className="fixed right-4 z-40 select-none" style={{ bottom: bottomOffset + 8 }}>
      <div className="relative">
        {/* 愛心噴出 */}
        <AnimatePresence>
          {showHeart && (
            <motion.span
              key="heart"
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -32, scale: 1.4 }}
              exit={{}}
              transition={{ duration: 0.6 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 text-lg pointer-events-none"
              aria-hidden="true"
            >
              💜
            </motion.span>
          )}
        </AnimatePresence>

        {/* 貓咪本體 */}
        <motion.button
          onClick={handleClick}
          aria-label="貓咪夥伴"
          animate={
            catState === 'idle'
              ? { scale: [1, 1.03, 1], x: 0 }
              : catState === 'walking'
                ? { x: walkX }
                : { scale: [1, 1.35, 0.9, 1], x: 0 }
          }
          transition={
            catState === 'idle'
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : catState === 'walking'
                ? { duration: 1.2, ease: 'easeInOut' }
                : { duration: 0.45, ease: 'easeOut' }
          }
          onAnimationComplete={catState === 'walking' ? onWalkComplete : undefined}
          className="text-4xl cursor-pointer active:scale-90 transition-transform"
          style={{ lineHeight: 1 }}
        >
          {catState === 'react' ? '😸' : '🐱'}
        </motion.button>
      </div>
    </div>
  );
}
