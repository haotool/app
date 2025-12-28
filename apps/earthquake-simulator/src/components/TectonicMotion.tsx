import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TectonicMotion: React.FC = () => {
  const [stress, setStress] = useState(0);
  const [isQuaking, setIsQuaking] = useState(false);
  const threshold = 100;

  const handleAddStress = () => {
    if (isQuaking) return;

    // 輕微觸覺回饋
    if (navigator.vibrate) navigator.vibrate(10);

    setStress((prev) => {
      const next = prev + 15;
      if (next >= threshold) {
        triggerEarthquake();
        return 0;
      }
      return next;
    });
  };

  const triggerEarthquake = () => {
    setIsQuaking(true);
    // 地震爆發強烈震動
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    setTimeout(() => {
      setIsQuaking(false);
      setStress(0);
    }, 1500);
  };

  return (
    <div className="w-full bg-white rounded-[2.5rem] p-8 overflow-hidden shadow-xl shadow-sky-100/30 border border-sky-100/50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-slate-800 font-black text-lg tracking-tight italic">
            板塊應力模擬室
          </h4>
          <p className="text-sky-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Stress-Slip Model
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-black text-slate-400 uppercase">能量累積</span>
          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${(stress / threshold) * 100}%` }}
              className={`h-full ${stress > 70 ? 'bg-rose-500' : 'bg-sky-500'}`}
            />
          </div>
        </div>
      </div>

      <div className="relative h-48 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 240 160" className="w-full h-full max-w-[300px] overflow-visible">
          {/* 下方板塊 (固定) */}
          <rect
            x="40"
            y="85"
            width="160"
            height="40"
            rx="8"
            fill="#e2e8f0"
            stroke="#cbd5e1"
            strokeWidth="2"
          />

          {/* 上方板塊 (受壓變形) */}
          <motion.g
            animate={
              isQuaking
                ? {
                    x: [0, 40, 40],
                    y: [0, -5, 0],
                    filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'],
                  }
                : {
                    skewX: stress / 4, // 模擬彈性形變
                    x: stress / 10, // 模擬緩慢推擠
                  }
            }
            transition={
              isQuaking ? { duration: 0.2, ease: 'easeOut' } : { type: 'spring', stiffness: 100 }
            }
          >
            <rect
              x="40"
              y="45"
              width="160"
              height="40"
              rx="8"
              fill="#f1f5f9"
              stroke="#94a3b8"
              strokeWidth="2"
            />

            {/* 房子 */}
            <path
              d="M100 45 L100 30 L115 20 L130 30 L130 45 Z"
              fill="white"
              stroke="#64748b"
              strokeWidth="1.5"
            />
          </motion.g>

          {/* 摩擦力與火花 (卡住的地方) */}
          <AnimatePresence>
            {!isQuaking && stress > 0 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <text
                  x="120"
                  y="88"
                  textAnchor="middle"
                  fill="#f43f5e"
                  fontSize="8"
                  fontWeight="900"
                  className="uppercase italic"
                >
                  {stress < 80 ? '摩擦力抵抗中...' : '臨界點：即將滑動！'}
                </text>
                <circle cx="120" cy="85" r={stress / 10} fill="#f43f5e" fillOpacity="0.1" />
              </motion.g>
            )}

            {isQuaking && (
              <motion.g key="shockwave">
                {[1, 2, 3].map((i) => (
                  <motion.circle
                    key={i}
                    cx="140"
                    cy="85"
                    r="5"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 15, opacity: 0 }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                ))}
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* 橡皮筋喻體 */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-1 h-12 bg-slate-300 rounded-full relative">
            <motion.div
              animate={{ height: 10 + stress / 2 }}
              className="absolute top-0 w-full bg-rose-400 rounded-full"
            />
          </div>
          <span className="text-[8px] font-black text-slate-400 mt-2 uppercase italic">
            彈性形變
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-col space-y-4">
        <button
          onClick={handleAddStress}
          disabled={isQuaking}
          className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-3 ${
            isQuaking ? 'bg-slate-100 text-slate-400' : 'bg-sky-600 text-white shadow-sky-200'
          }`}
        >
          {isQuaking ? (
            <span>能量釋放中！</span>
          ) : (
            <>
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              <span>持續推擠（累積壓力）</span>
            </>
          )}
        </button>

        <p className="text-xs font-bold text-slate-500 text-center italic px-4 leading-relaxed">
          想像你在推一個超重的箱子：箱子一開始不動，但你的力氣正讓狀態變緊繃，一旦超過摩擦力，箱子就會突然噴出去！
        </p>
      </div>
    </div>
  );
};

export default TectonicMotion;
