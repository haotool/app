import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const DepthComparison: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'shallow' | 'medium' | 'deep'>('shallow');

  return (
    <div className="w-full bg-white rounded-[2.5rem] p-8 overflow-hidden shadow-xl shadow-sky-100/30 border border-sky-100/50">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
        <div>
          <h4 className="text-slate-800 font-black text-lg tracking-tight italic">
            地震深度：敲桌子模擬
          </h4>
          <p className="text-sky-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Interactive Lab
          </p>
        </div>

        <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50 w-full sm:w-auto">
          <button
            onClick={() => setActiveMode('shallow')}
            className={`flex-1 sm:px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${activeMode === 'shallow' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            淺層
          </button>
          <button
            onClick={() => setActiveMode('medium')}
            className={`flex-1 sm:px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${activeMode === 'medium' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            中層
          </button>
          <button
            onClick={() => setActiveMode('deep')}
            className={`flex-1 sm:px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${activeMode === 'deep' ? 'bg-sky-500 text-white shadow-lg shadow-sky-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            深層
          </button>
        </div>
      </div>

      <div className="relative h-64 flex items-center justify-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
        <svg viewBox="0 0 240 180" className="w-full h-full max-w-[320px] overflow-visible">
          {/* 地面與地層結構 */}
          <rect x="0" y="60" width="240" height="120" fill="#f8fafc" opacity="0.5" />
          <line
            x1="10"
            y1="60"
            x2="230"
            y2="60"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* 房屋與地表反應 */}
          <motion.g
            animate={
              activeMode === 'shallow'
                ? {
                    y: [0, -4, 4, -2, 2, 0],
                    rotate: [0, 1.5, -1.5, 0],
                    scale: [1, 1.02, 0.98, 1],
                  }
                : activeMode === 'medium'
                  ? {
                      y: [0, -2, 2, -1, 1, 0],
                      rotate: [0, 0.8, -0.8, 0],
                    }
                  : {
                      y: [0, -1, 1, 0],
                      rotate: [0, 0.3, -0.3, 0],
                    }
            }
            transition={{
              repeat: Infinity,
              duration: activeMode === 'shallow' ? 0.25 : activeMode === 'medium' ? 0.6 : 1.5,
              ease: 'easeInOut',
            }}
          >
            {/* 房屋主體 */}
            <path
              d="M100 60 L100 35 L120 20 L140 35 L140 60 Z"
              fill="white"
              stroke="#64748b"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <rect x="112" y="42" width="16" height="18" fill="#e0f2fe" rx="2" />
            <line x1="112" y1="51" x2="128" y2="51" stroke="#bae6fd" strokeWidth="1" />
            <line x1="120" y1="42" x2="120" y2="60" stroke="#bae6fd" strokeWidth="1" />
          </motion.g>

          {/* 震源 (Hypocenter) 視覺化 */}
          <AnimatePresence mode="wait">
            {activeMode === 'shallow' && (
              <motion.g
                key="shallow-source"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[1, 2, 3].map((i) => (
                  <motion.circle
                    key={i}
                    cx="120"
                    cy="85"
                    r="8"
                    fill="none"
                    stroke="#fb7185"
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{ scale: 4.5, opacity: 0 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      delay: i * 0.4,
                      ease: 'easeOut',
                    }}
                  />
                ))}
                <circle cx="120" cy="85" r="7" fill="#f43f5e" />
                <text
                  x="135"
                  y="90"
                  fill="#e11d48"
                  fontSize="11"
                  fontWeight="900"
                  className="italic font-mono"
                >
                  15km
                </text>
              </motion.g>
            )}

            {activeMode === 'medium' && (
              <motion.g
                key="medium-source"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[1, 2, 3].map((i) => (
                  <motion.circle
                    key={i}
                    cx="120"
                    cy="115"
                    r="10"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                    initial={{ scale: 0, opacity: 0.7 }}
                    animate={{ scale: 6, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.6, ease: 'easeOut' }}
                  />
                ))}
                <circle cx="120" cy="115" r="7" fill="#f59e0b" />
                <text
                  x="135"
                  y="120"
                  fill="#d97706"
                  fontSize="11"
                  fontWeight="900"
                  className="italic font-mono"
                >
                  50km
                </text>
              </motion.g>
            )}

            {activeMode === 'deep' && (
              <motion.g
                key="deep-source"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[1, 2, 3].map((i) => (
                  <motion.circle
                    key={i}
                    cx="120"
                    cy="150"
                    r="12"
                    fill="none"
                    stroke="#7dd3fc"
                    strokeWidth="1"
                    initial={{ scale: 0, opacity: 0.6 }}
                    animate={{ scale: 9, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 4, delay: i * 1.2, ease: 'linear' }}
                  />
                ))}
                <circle cx="120" cy="150" r="7" fill="#0ea5e9" />
                <text
                  x="135"
                  y="155"
                  fill="#0284c7"
                  fontSize="11"
                  fontWeight="900"
                  className="italic font-mono"
                >
                  150km
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* 動態描述文字 */}
        <div className="absolute inset-x-0 bottom-4 text-center px-4">
          <motion.p
            key={activeMode}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-[10px] font-black uppercase tracking-widest ${
              activeMode === 'shallow'
                ? 'text-rose-500'
                : activeMode === 'medium'
                  ? 'text-amber-500'
                  : 'text-sky-500'
            }`}
          >
            {activeMode === 'shallow'
              ? '● 近距離重擊：震動直接且猛烈'
              : activeMode === 'medium'
                ? '● 中距傳遞：搖晃感均勻且穩定'
                : '● 遠距離傳震：影響廣但力道散'}
          </motion.p>
        </div>
      </div>

      <div className="mt-6 flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div
          className={`w-2 h-2 rounded-full animate-pulse ${
            activeMode === 'shallow'
              ? 'bg-rose-400'
              : activeMode === 'medium'
                ? 'bg-amber-400'
                : 'bg-sky-400'
          }`}
        />
        <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
          {activeMode === 'shallow'
            ? '像在桌面上用力一敲，附近的杯子會跳起來，破壞力集中在震央周邊。'
            : activeMode === 'medium'
              ? '像在桌子下方較深處敲擊，整張桌子都在震動，能量傳遞比較平衡。'
              : '像在地下室敲大鐘，雖然整棟樓都聽得到震動，但每一層的搖晃感沒那麼尖銳。'}
        </p>
      </div>
    </div>
  );
};

export default DepthComparison;
