import { useState, useEffect, useRef, useCallback } from 'react';

// 彩蛋類型 - 原有 5 種 + 新增 10 種 = 15 種
export type EasterEggType =
  | 'sakura' // 櫻花雨 (Konami Code)
  | 'night' // 百鬼夜行 (Logo 5 次)
  | 'sushi' // 壽司雨 (輸入 sushi)
  | 'glow' // 金光效果 (標題 2 次)
  | 'rumble' // 地震效果 (印章 3 次)
  // 新增 10 種高級彩蛋
  | 'koi' // 錦鯉游動 (輸入 koi)
  | 'fireworks' // 花火大會 (輸入 hanabi)
  | 'zen' // 禪意水墨 (靜止 30 秒)
  | 'matsuri' // 祭典燈籠 (搖動手機/滑鼠快速移動)
  | 'origami' // 千紙鶴 (輸入 origami)
  | 'samurai' // 武士斬擊 (快速連點 7 次)
  | 'wave' // 神奈川沖浪 (輸入 wave)
  | 'dragon' // 龍舞 (輸入 dragon)
  | 'ninja' // 忍者煙霧 (雙擊螢幕)
  | 'torii' // 鳥居之門 (輸入 torii)
  | null;

// Konami Code Sequence
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

  // 新增：快速連點追蹤
  const [rapidClicks, setRapidClicks] = useState(0);
  const [lastRapidClickTime, setLastRapidClickTime] = useState(0);

  // 新增：靜止時間追蹤 - 使用 lazy initializer 避免在渲染時呼叫不純函數
  const [initialTime] = useState(() => Date.now());
  const lastActivityRef = useRef<number>(initialTime);

  // 新增：滑鼠移動追蹤
  const mouseMoveCountRef = useRef(0);
  const mouseMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 新增：手機搖晃偵測
  const shakeThreshold = 15; // 搖晃加速度閾值
  const lastShakeTimeRef = useRef(0);

  // 觸發彩蛋的通用函數
  const triggerEgg = useCallback(
    (egg: EasterEggType, duration = 5000) => {
      if (activeEgg) return; // 避免重複觸發
      setActiveEgg(egg);
      setTimeout(() => setActiveEgg(null), duration);
    },
    [activeEgg],
  );

  // 鍵盤事件處理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const newSeq = [...keySequenceRef.current, e.key].slice(-15); // 保留最後 15 個按鍵
      keySequenceRef.current = newSeq;

      // 重置靜止計時器
      lastActivityRef.current = Date.now();

      // Check Konami Code → 櫻花雨
      if (newSeq.join(',').includes(KONAMI_CODE.join(','))) {
        triggerEgg('sakura', 5000);
        keySequenceRef.current = [];
      }

      // Check 'sushi' → 壽司雨
      if (newSeq.slice(-5).join('').toLowerCase() === 'sushi') {
        triggerEgg('sushi', 4000);
        keySequenceRef.current = [];
      }

      // Check 'koi' → 錦鯉游動
      if (newSeq.slice(-3).join('').toLowerCase() === 'koi') {
        triggerEgg('koi', 6000);
        keySequenceRef.current = [];
      }

      // Check 'hanabi' → 花火大會
      if (newSeq.slice(-6).join('').toLowerCase() === 'hanabi') {
        triggerEgg('fireworks', 5000);
        keySequenceRef.current = [];
      }

      // Check 'origami' → 千紙鶴
      if (newSeq.slice(-7).join('').toLowerCase() === 'origami') {
        triggerEgg('origami', 6000);
        keySequenceRef.current = [];
      }

      // Check 'wave' → 神奈川沖浪
      if (newSeq.slice(-4).join('').toLowerCase() === 'wave') {
        triggerEgg('wave', 4000);
        keySequenceRef.current = [];
      }

      // Check 'dragon' → 龍舞
      if (newSeq.slice(-6).join('').toLowerCase() === 'dragon') {
        triggerEgg('dragon', 6000);
        keySequenceRef.current = [];
      }

      // Check 'torii' → 鳥居之門
      if (newSeq.slice(-5).join('').toLowerCase() === 'torii') {
        triggerEgg('torii', 5000);
        keySequenceRef.current = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerEgg]);

  // 靜止 30 秒 → 禪意水墨
  useEffect(() => {
    const checkIdle = () => {
      const now = Date.now();
      if (now - lastActivityRef.current >= 30000 && !activeEgg) {
        triggerEgg('zen', 8000);
      }
    };

    const interval = setInterval(checkIdle, 5000);
    return () => clearInterval(interval);
  }, [activeEgg, triggerEgg]);

  // 滑鼠快速移動 → 祭典燈籠
  useEffect(() => {
    const handleMouseMove = () => {
      lastActivityRef.current = Date.now();
      mouseMoveCountRef.current += 1;

      if (mouseMoveTimerRef.current) {
        clearTimeout(mouseMoveTimerRef.current);
      }

      mouseMoveTimerRef.current = setTimeout(() => {
        // 如果在 1 秒內移動超過 50 次，觸發祭典燈籠
        if (mouseMoveCountRef.current >= 50 && !activeEgg) {
          triggerEgg('matsuri', 5000);
        }
        mouseMoveCountRef.current = 0;
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseMoveTimerRef.current) {
        clearTimeout(mouseMoveTimerRef.current);
      }
    };
  }, [activeEgg, triggerEgg]);

  // 雙擊螢幕 → 忍者煙霧
  useEffect(() => {
    const handleDoubleClick = () => {
      lastActivityRef.current = Date.now();
      if (!activeEgg) {
        triggerEgg('ninja', 3000);
      }
    };

    window.addEventListener('dblclick', handleDoubleClick);
    return () => window.removeEventListener('dblclick', handleDoubleClick);
  }, [activeEgg, triggerEgg]);

  // 手機搖晃 → 花火大會 (DeviceMotion API)
  // [最佳實踐] iOS 13+ 需要用戶授權，需要 HTTPS 環境
  useEffect(() => {
    // SSR 安全檢查
    if (typeof window === 'undefined') return;

    const handleShake = (event: DeviceMotionEvent) => {
      lastActivityRef.current = Date.now();

      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      if (x === null || y === null || z === null) return;

      // 計算總加速度
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);

      // 超過閾值且距離上次搖晃超過 1 秒
      const now = Date.now();
      if (totalAcceleration > shakeThreshold && now - lastShakeTimeRef.current > 1000) {
        lastShakeTimeRef.current = now;
        if (!activeEgg) {
          triggerEgg('fireworks', 5000);
        }
      }
    };

    // 檢查是否支援 DeviceMotion API
    if ('DeviceMotionEvent' in window) {
      // iOS 13+ 需要請求權限
      const requestPermission = (
        DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }
      ).requestPermission;
      if (typeof requestPermission === 'function') {
        // iOS 設備 - 需要用戶互動後才能請求權限
        // 這裡不主動請求，等用戶點擊某個按鈕時再請求
      } else {
        // 非 iOS 設備 - 直接添加監聽
        window.addEventListener('devicemotion', handleShake);
      }
    }

    return () => {
      window.removeEventListener('devicemotion', handleShake);
    };
  }, [activeEgg, triggerEgg, shakeThreshold]);

  // Logo 點擊 5 次 → 百鬼夜行
  const handleLogoClick = useCallback(() => {
    lastActivityRef.current = Date.now();
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
  }, [logoClicks, lastLogoClickTime, activeEgg]);

  // 印章點擊 3 次 → 地震效果
  const handleToriiClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      lastActivityRef.current = Date.now();
      const now = Date.now();
      if (now - lastToriiClickTime < 500) {
        const newCount = toriiClicks + 1;
        setToriiClicks(newCount);
        if (newCount === 3) {
          triggerEgg('rumble', 1000);
          setToriiClicks(0);
        }
      } else {
        setToriiClicks(1);
      }
      setLastToriiClickTime(now);
    },
    [toriiClicks, lastToriiClickTime, triggerEgg],
  );

  // 標題雙擊 → 金光效果
  const handleDoubleTextClick = useCallback(() => {
    lastActivityRef.current = Date.now();
    triggerEgg('glow', 2000);
  }, [triggerEgg]);

  // 快速連點 7 次 → 武士斬擊
  const handleRapidClick = useCallback(() => {
    lastActivityRef.current = Date.now();
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
  }, [rapidClicks, lastRapidClickTime, activeEgg, triggerEgg]);

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
            if (totalAcceleration > shakeThreshold && now - lastShakeTimeRef.current > 1000) {
              lastShakeTimeRef.current = now;
              if (!activeEgg) {
                triggerEgg('fireworks', 5000);
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
    requestMotionPermission,
  };
}
