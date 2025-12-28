import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SeismicWaves: React.FC = () => {
  const [waveType, setWaveType] = useState<'P' | 'S'>('P');

  const handleToggle = (type: 'P' | 'S') => {
    setWaveType(type);
    if (navigator.vibrate) {
      navigator.vibrate(type === 'P' ? [10, 30, 10] : 20);
    }
  };

  return (
    <div className="w-full bg-white rounded-[2.5rem] p-6 sm:p-8 overflow-hidden shadow-xl shadow-sky-100/30 border border-sky-100/50">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h4 className="text-slate-800 font-black text-lg tracking-tight italic">
            波動實驗室：P 波 vs S 波
          </h4>
          <p className="text-sky-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Interactive Wave Dynamics
          </p>
        </div>

        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 w-full sm:w-auto">
          <button
            onClick={() => handleToggle('P')}
            className={`flex-1 sm:px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center space-x-2 ${waveType === 'P' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="w-2 h-2 rounded-full bg-white opacity-50" />
            <span>P 波 (先行者)</span>
          </button>
          <button
            onClick={() => handleToggle('S')}
            className={`flex-1 sm:px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center space-x-2 ${waveType === 'S' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="w-2 h-2 rounded-full bg-white opacity-50" />
            <span>S 波 (破壞者)</span>
          </button>
        </div>
      </div>

      {/* Main Visualization Viewport */}
      <div className="relative h-56 sm:h-64 bg-slate-950 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden border border-slate-800 shadow-inner">
        {/* Background Grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="relative w-full max-w-[400px] h-full flex items-center justify-center">
          <svg viewBox="0 0 400 200" className="w-full h-full overflow-visible">
            <AnimatePresence mode="wait">
              {waveType === 'P' ? (
                <motion.g
                  key="p-wave-viz"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* P-wave: Compressional / Longitudinal */}
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.rect
                      key={`p-bar-${i}`}
                      x={20 + i * 15}
                      y="60"
                      width="6"
                      height="80"
                      rx="3"
                      fill="#38bdf8"
                      animate={{
                        x: [20 + i * 15, 20 + i * 15 + 15, 20 + i * 15],
                        opacity: [0.3, 1, 0.3],
                        scaleX: [1, 1.5, 1],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: i * 0.05,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                  {/* Meta labels for P-wave */}
                  <text
                    x="200"
                    y="40"
                    textAnchor="middle"
                    fill="#7dd3fc"
                    fontSize="10"
                    fontWeight="900"
                    className="uppercase tracking-[0.2em] italic"
                  >
                    壓縮波 • 前後推拉
                  </text>
                  <motion.path
                    d="M160,170 L240,170"
                    stroke="#7dd3fc"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    animate={{ x: [-10, 10, -10] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                  />
                  <path
                    d="M155,170 L160,165 M155,170 L160,175 M245,170 L240,165 M245,170 L240,175"
                    stroke="#7dd3fc"
                    strokeWidth="2"
                  />
                </motion.g>
              ) : (
                <motion.g
                  key="s-wave-viz"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* S-wave: Transverse / Shear */}
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.circle
                      key={`s-dot-${i}`}
                      cx={20 + i * 16}
                      cy="100"
                      r="6"
                      fill="#fb7185"
                      animate={{
                        y: [0, -40, 40, 0],
                        scale: [1, 1.2, 1.2, 1],
                        opacity: [0.6, 1, 1, 0.6],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.4,
                        delay: i * 0.08,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                  {/* Metaphorical Line */}
                  <motion.path
                    d="M20,100 Q40,40 60,100 T100,100 T140,100 T180,100 T220,100 T260,100 T300,100 T340,100 T380,100"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1"
                    opacity="0.2"
                    animate={{ x: [0, 32, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                  />
                  <text
                    x="200"
                    y="40"
                    textAnchor="middle"
                    fill="#fda4af"
                    fontSize="10"
                    fontWeight="900"
                    className="uppercase tracking-[0.2em] italic"
                  >
                    剪力波 • 左右/上下搖晃
                  </text>
                  <motion.path
                    d="M200,160 L200,185"
                    stroke="#fda4af"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ repeat: Infinity, duration: 0.7 }}
                  />
                  <path
                    d="M200,155 L195,160 M200,155 L205,160 M200,190 L195,185 M200,190 L205,185"
                    stroke="#fda4af"
                    strokeWidth="2"
                  />
                </motion.g>
              )}
            </AnimatePresence>
          </svg>
        </div>

        {/* Speed Label Overlay */}
        <div className="absolute top-4 right-6 flex items-center space-x-2">
          <div className="h-1 w-12 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${waveType === 'P' ? 'bg-sky-400' : 'bg-rose-400'}`}
              animate={{ width: waveType === 'P' ? '100%' : '50%' }}
              transition={{ duration: 1 }}
            />
          </div>
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
            速度：{waveType === 'P' ? '極快' : '中速'}
          </span>
        </div>
      </div>

      {/* Metaphor Section */}
      <div className="mt-8 flex items-stretch space-x-4">
        <div
          className={`flex-1 p-5 rounded-3xl border ${waveType === 'P' ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-50 border-slate-100'} transition-colors duration-500`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${waveType === 'P' ? 'bg-sky-500' : 'bg-slate-300'}`}
            />
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              生活比喻
            </h5>
          </div>
          <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
            {waveType === 'P'
              ? '像前後推拉「彈簧」，波浪順著推動方向前進，速度最快。'
              : '像上下甩動「繩子」，繩子本身沒飛出去，但波浪卻傳到了遠方。'}
          </p>
        </div>
        <div
          className={`flex-1 p-5 rounded-3xl border ${waveType === 'S' ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 border-slate-100'} transition-colors duration-500`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${waveType === 'S' ? 'bg-rose-500' : 'bg-slate-300'}`}
            />
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              你的感受
            </h5>
          </div>
          <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
            {waveType === 'P'
              ? '第一時間感覺被地板「快速頂一下」，雖然不明顯但最早抵達。'
              : '接著感覺大地開始「強烈左右搖」，這才是破壞力最強的主震。'}
          </p>
        </div>
      </div>

      {/* Physics Tip */}
      <div className="mt-6 bg-slate-50 p-4 rounded-2xl flex items-center space-x-3 border border-slate-100">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-[11px] font-bold text-slate-500 italic">
          科學知識：P 波可以穿過地核，但 S 波會被液體（外核）擋住，這讓科學家知道地心是融化的！
        </p>
      </div>
    </div>
  );
};

export default SeismicWaves;
