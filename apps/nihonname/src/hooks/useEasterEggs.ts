import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 彩蛋類型 - 僅保留手機版觸發方式
 * [fix:2025-12-06] 移除所有電腦版彩蛋（鍵盤、滑鼠觸發）
 * [context7:motion.dev:2025-12-06] 參考 Framer Motion 最佳實踐
 *
 * 專案主色：red-900 (#7f1d1d)、red-600 (#dc2626)
 * 專案輔色：stone-800 (#292524)、amber-500 (#f59e0b)
 */
export type EasterEggType =
  // 手機觸發彩蛋
  | 'sakura' // 櫻花雨 (Logo 5 次點擊)
  | 'fireworks' // 花火大會 (手機搖晃)
  | 'zen' // 禪意水墨 (靜止 45 秒) - 延長觸發時間
  | 'samurai' // 武士斬擊 (快速連點 7 次)
  | 'torii' // 鳥居之門 (印章 3 次點擊)
  | 'glow' // 金光效果 (標題雙擊)
  | 'rumble' // 地震效果 (長按 2 秒)
  | null;

export function useEasterEggs() {
  const [activeEgg, setActiveEgg] = useState<EasterEggType>(null);
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastLogoClickTime, setLastLogoClickTime] = useState(0);
  const [toriiClicks, setToriiClicks] = useState(0);
  const [lastToriiClickTime, setLastToriiClickTime] = useState(0);

  // 快速連點追蹤
  const [rapidClicks, setRapidClicks] = useState(0);
  const [lastRapidClickTime, setLastRapidClickTime] = useState(0);

  // 靜止時間追蹤 - 使用 lazy initializer 避免在渲染時呼叫不純函數
  const [initialTime] = useState(() => Date.now());
  const lastActivityRef = useRef<number>(initialTime);

  // 手機搖晃偵測
  const shakeThreshold = 15;
  const lastShakeTimeRef = useRef(0);
  const shakeCountRef = useRef(0);
  const shakeWindowMs = 1200;

  // 長按追蹤
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清除彩蛋並重置活動時間
  const clearEgg = useCallback(() => {
    setActiveEgg(null);
    lastActivityRef.current = Date.now();
  }, []);

  // 觸發彩蛋的通用函數
  const triggerEgg = useCallback(
    (egg: EasterEggType, duration = 5000) => {
      if (activeEgg) return; // 避免重複觸發
      setActiveEgg(egg);
      lastActivityRef.current = Date.now();
      setTimeout(() => setActiveEgg(null), duration);
    },
    [activeEgg],
  );

  // 靜止 45 秒 → 禪意水墨 (延長觸發時間)
  // [fix:2025-12-06] 任意互動立即消失
  useEffect(() => {
    const checkIdle = () => {
      const now = Date.now();
      // 延長到 45 秒觸發
      if (now - lastActivityRef.current >= 45000 && !activeEgg) {
        triggerEgg('zen', 8000);
      }
    };

    const interval = setInterval(checkIdle, 5000);
    return () => clearInterval(interval);
  }, [activeEgg, triggerEgg]);

  // 全域點擊/觸摸事件 - 清除禪意水墨
  useEffect(() => {
    const handleInteraction = () => {
      lastActivityRef.current = Date.now();
      // 如果是禪意水墨，立即清除
      if (activeEgg === 'zen') {
        clearEgg();
      }
    };

    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('click', handleInteraction);

    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [activeEgg, clearEgg]);

  // 手機搖晃 → 花火大會 (DeviceMotion API)
  // [最佳實踐] iOS 13+ 需要用戶授權，需要 HTTPS 環境
  useEffect(() => {
    // SSR 安全檢查
    if (typeof window === 'undefined') return;

    const handleShake = (event: DeviceMotionEvent) => {
      lastActivityRef.current = Date.now();

      // 如果是禪意水墨，立即清除
      if (activeEgg === 'zen') {
        clearEgg();
        return;
      }

      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      if (x === null || y === null || z === null) return;

      // 計算總加速度
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (totalAcceleration > shakeThreshold) {
        // 若間隔過長，重新計數
        if (now - lastShakeTimeRef.current > shakeWindowMs) {
          shakeCountRef.current = 0;
        }
        shakeCountRef.current += 1;
        lastShakeTimeRef.current = now;

        if (shakeCountRef.current >= 10 && !activeEgg) {
          shakeCountRef.current = 0;
          triggerEgg('fireworks', 10000);
        }
      }
    };

    // 檢查是否支援 DeviceMotion API
    if ('DeviceMotionEvent' in window) {
      // iOS 13+ 需要請求權限
      const requestPermission = (
        DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }
      ).requestPermission;
      if (typeof requestPermission !== 'function') {
        // 非 iOS 設備 - 直接添加監聽
        window.addEventListener('devicemotion', handleShake);
      }
    }

    return () => {
      window.removeEventListener('devicemotion', handleShake);
    };
  }, [activeEgg, triggerEgg, clearEgg, shakeThreshold]);

  // Logo 點擊 5 次 → 櫻花雨
  const handleLogoClick = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (activeEgg === 'zen') {
      clearEgg();
      return;
    }

    const now = Date.now();
    if (now - lastLogoClickTime < 500) {
      const newCount = logoClicks + 1;
      setLogoClicks(newCount);
      if (newCount === 5) {
        triggerEgg('sakura', 5000);
        setLogoClicks(0);
      }
    } else {
      setLogoClicks(1);
    }
    setLastLogoClickTime(now);
  }, [logoClicks, lastLogoClickTime, activeEgg, triggerEgg, clearEgg]);

  // 印章點擊 3 次 → 鳥居之門
  const handleToriiClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      lastActivityRef.current = Date.now();
      if (activeEgg === 'zen') {
        clearEgg();
        return;
      }

      const now = Date.now();
      if (now - lastToriiClickTime < 500) {
        const newCount = toriiClicks + 1;
        setToriiClicks(newCount);
        if (newCount === 3) {
          triggerEgg('torii', 4000);
          setToriiClicks(0);
        }
      } else {
        setToriiClicks(1);
      }
      setLastToriiClickTime(now);
    },
    [toriiClicks, lastToriiClickTime, activeEgg, triggerEgg, clearEgg],
  );

  // 標題雙擊 → 金光效果
  const handleDoubleTextClick = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (activeEgg === 'zen') {
      clearEgg();
      return;
    }
    triggerEgg('glow', 2000);
  }, [activeEgg, triggerEgg, clearEgg]);

  // 快速連點 7 次 → 武士斬擊
  const handleRapidClick = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (activeEgg === 'zen') {
      clearEgg();
      return;
    }

    const now = Date.now();
    if (now - lastRapidClickTime < 300) {
      const newCount = rapidClicks + 1;
      setRapidClicks(newCount);
      if (newCount >= 7 && !activeEgg) {
        triggerEgg('samurai', 3000);
        setRapidClicks(0);
      }
    } else {
      setRapidClicks(1);
    }
    setLastRapidClickTime(now);
  }, [rapidClicks, lastRapidClickTime, activeEgg, triggerEgg, clearEgg]);

  // 長按 2 秒 → 地震效果
  const handleLongPressStart = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (activeEgg === 'zen') {
      clearEgg();
      return;
    }

    longPressTimerRef.current = setTimeout(() => {
      if (!activeEgg) {
        triggerEgg('rumble', 1000);
      }
    }, 2000);
  }, [activeEgg, triggerEgg, clearEgg]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // iOS 設備請求 DeviceMotion 權限
  const requestMotionPermission = useCallback(async () => {
    if (typeof window === 'undefined') return false;

    const requestPermission = (
      DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }
    ).requestPermission;
    if (typeof requestPermission === 'function') {
      try {
        const permission = await requestPermission();
        if (permission === 'granted') {
          // 權限已授予，添加監聽
          const handleShake = (event: DeviceMotionEvent) => {
            lastActivityRef.current = Date.now();
            const acceleration = event.accelerationIncludingGravity;
            if (!acceleration) return;
            const { x, y, z } = acceleration;
            if (x === null || y === null || z === null) return;
            const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
            const now = Date.now();
            if (totalAcceleration > shakeThreshold) {
              if (now - lastShakeTimeRef.current > shakeWindowMs) {
                shakeCountRef.current = 0;
              }
              shakeCountRef.current += 1;
              lastShakeTimeRef.current = now;

              if (shakeCountRef.current >= 10 && !activeEgg) {
                shakeCountRef.current = 0;
                triggerEgg('fireworks', 10000);
              }
            }
          };
          window.addEventListener('devicemotion', handleShake);
          return true;
        }
      } catch {
        return false;
      }
    }
    return false;
  }, [activeEgg, triggerEgg, shakeThreshold]);

  return {
    activeEgg,
    handleLogoClick,
    handleDoubleTextClick,
    handleToriiClick,
    handleRapidClick,
    handleLongPressStart,
    handleLongPressEnd,
    requestMotionPermission,
  };
}
