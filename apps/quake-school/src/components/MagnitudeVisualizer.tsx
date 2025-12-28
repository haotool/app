import React from 'react';
import { motion } from 'motion/react';

const MagnitudeVisualizer: React.FC = () => {
  return (
    <div className="w-full bg-white rounded-[2.5rem] p-8 overflow-hidden shadow-xl shadow-sky-100/30 border border-sky-100/50 space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-slate-800 font-black text-lg tracking-tight italic">
            規模放大鏡：M vs M+1
          </h4>
          <p className="text-sky-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Magnitude Comparison
          </p>
        </div>
      </div>

      {/* 振幅對比 (10x) */}
      <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
          <span>搖晃振幅 (Amplitude)</span>
          <span className="text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
            高度差 10 倍
          </span>
        </div>

        <div className="h-24 w-full relative flex items-center">
          <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible">
            {/* 基準線 */}
            <line
              x1="0"
              y1="40"
              x2="300"
              y2="40"
              stroke="#e2e8f0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* M 規模波形 */}
            <motion.path
              d="M 10 40 Q 25 36, 40 40 T 70 40 T 100 40"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{ pathOffset: [0, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />
            <text
              x="55"
              y="70"
              textAnchor="middle"
              className="text-[10px] font-black fill-slate-400 italic"
            >
              M 規模
            </text>

            {/* 箭頭 */}
            <path
              d="M 115 40 L 145 40"
              stroke="#cbd5e1"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />

            {/* M+1 規模波形 (高度為基準 10 倍) */}
            <motion.path
              d="M 160 40 Q 185 0, 210 40 T 260 40 T 310 40"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="4"
              strokeLinecap="round"
              animate={{ pathOffset: [0, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />
            <text
              x="235"
              y="75"
              textAnchor="middle"
              className="text-[12px] font-black fill-sky-500 italic"
            >
              M + 1 (10倍強)
            </text>

            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="0"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      {/* 能量對比 (32x) */}
      <div className="space-y-4 bg-amber-50/30 p-6 rounded-[2rem] border border-amber-100">
        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
          <span>釋放能量 (Total Energy)</span>
          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            多出 32 倍！
          </span>
        </div>

        <div className="flex items-center justify-around py-2">
          {/* 左側：單個能量點 */}
          <div className="flex flex-col items-center space-y-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-6 h-6 rounded-full bg-slate-300 shadow-sm"
            />
            <span className="text-[10px] font-black text-slate-400">1 單位</span>
          </div>

          <svg
            className="w-6 h-6 text-amber-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="4"
          >
            <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>

          {/* 右側：32 個能量點矩陣 */}
          <div className="bg-white/60 p-3 rounded-2xl border border-amber-100/50 shadow-inner">
            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 32 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, opacity: [0.4, 1, 0.4] }}
                  transition={{
                    delay: i * 0.02,
                    opacity: { repeat: Infinity, duration: 1.5, delay: i * 0.05 },
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] font-bold text-slate-400 text-center italic px-4 leading-relaxed">
        記得：規模每增加 1.0，雖然數字只差 1，但釋放出來的威力可是整整跳了 32 倍喔！
      </p>
    </div>
  );
};

export default MagnitudeVisualizer;
