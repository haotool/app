import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface Props {
  value: number;
  onValueChange: (val: number) => void;
}

const EarthquakeSimulator: React.FC<Props> = ({ value, onValueChange }) => {
  const [mode, setMode] = useState<'magnitude' | 'intensity'>('magnitude');
  const shouldReduceMotion = useReducedMotion();

  const intensityLevel = Math.max(0, Math.min(7, Math.floor(value - 1.5)));
  const shakeFactor = Math.pow(intensityLevel, 1.8);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onValueChange(val);

    // 根據規模強度提供不同的振動
    if (navigator.vibrate) {
      if (val >= 7) {
        navigator.vibrate(20);
      } else {
        navigator.vibrate(5);
      }
    }
  };

  const handleModeToggle = (newMode: 'magnitude' | 'intensity') => {
    setMode(newMode);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const stats = useMemo(() => {
    const intensity = (value - 1) / 8; // 0 to 1
    let color = 'text-sky-500';
    let accent = '#0ea5e9';
    let glowColor = 'rgba(14,165,233,0.5)';
    let coreColorStart = '#38bdf8';
    let coreColorEnd = '#0369a1';

    if (value >= 4 && value < 7) {
      color = 'text-orange-500';
      accent = '#f59e0b';
      glowColor = 'rgba(245,158,11,0.5)';
      coreColorStart = '#fbbf24';
      coreColorEnd = '#b45309';
    } else if (value >= 7) {
      color = 'text-rose-600';
      accent = '#e11d48';
      glowColor = 'rgba(225,29,72,0.6)';
      coreColorStart = '#fb7185';
      coreColorEnd = '#9f1239';
    }

    return {
      energy: Math.pow(32, value - 1).toLocaleString(undefined, { maximumFractionDigits: 0 }),
      description: value < 4 ? '微型釋放' : value < 7 ? '強烈爆發' : '毀滅巨能',
      color,
      accent,
      glowColor,
      coreColorStart,
      coreColorEnd,
      intensity,
    };
  }, [value]);

  return (
    <div className="w-full bg-white rounded-[2.5rem] border border-sky-100 shadow-xl shadow-sky-100/50 overflow-hidden">
      {/* 模式切換器 */}
      <div className="p-4 bg-sky-50/30 flex flex-col items-center border-b border-sky-50">
        <div className="flex p-1 bg-white rounded-full border border-sky-100 w-full max-w-[260px] mb-3">
          <button
            onClick={() => handleModeToggle('magnitude')}
            className={`relative flex-1 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all ${
              mode === 'magnitude' ? 'text-white' : 'text-slate-400'
            }`}
          >
            {mode === 'magnitude' && (
              <motion.div
                layoutId="m-bg"
                className="absolute inset-0 bg-sky-500 rounded-full shadow-md"
              />
            )}
            <span className="relative z-10">規模 M</span>
          </button>
          <button
            onClick={() => handleModeToggle('intensity')}
            className={`relative flex-1 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all ${
              mode === 'intensity' ? 'text-white' : 'text-slate-400'
            }`}
          >
            {mode === 'intensity' && (
              <motion.div
                layoutId="m-bg"
                className="absolute inset-0 bg-sky-600 rounded-full shadow-md"
              />
            )}
            <span className="relative z-10">震度 I</span>
          </button>
        </div>
        <div className="text-[10px] font-black text-sky-400/80 uppercase tracking-widest italic">
          {mode === 'magnitude' ? 'Concept: Potential Power' : 'Effect: Local Impact'}
        </div>
      </div>

      {/* 動態模擬區域 */}
      <div className="relative h-64 sm:h-80 bg-slate-950 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === 'magnitude' ? (
            <motion.div
              key="mag"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(#0ea5e9 0.5px, transparent 0.5px)',
                  backgroundSize: '24px 24px',
                }}
              />

              <svg
                viewBox="0 0 200 200"
                className="w-full h-full max-w-[340px] relative z-10 overflow-visible"
              >
                <defs>
                  <filter id="energyAura" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation={4 + stats.intensity * 12} result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  <radialGradient id="liquidCore" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="white" />
                    <stop offset="30%" stopColor={stats.coreColorStart} />
                    <stop offset="100%" stopColor={stats.coreColorEnd} />
                  </radialGradient>

                  <linearGradient id="fractureGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={stats.coreColorStart} stopOpacity="0" />
                    <stop offset="50%" stopColor={stats.accent} stopOpacity="1" />
                    <stop offset="100%" stopColor={stats.coreColorEnd} stopOpacity="0" />
                  </linearGradient>
                </defs>

                <motion.circle
                  cx="100"
                  cy="100"
                  r={30 + stats.intensity * 50}
                  fill="none"
                  stroke={stats.accent}
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  opacity={0.2 + stats.intensity * 0.4}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                />

                {value >= 4 && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: stats.intensity * 0.8 }}>
                    <motion.path
                      d="M100,100 L130,70 L160,75 M100,100 L70,130 L40,125 M100,100 L110,140 L90,170"
                      stroke="url(#fractureGlow)"
                      strokeWidth={1 + stats.intensity * 2}
                      fill="none"
                      strokeLinecap="round"
                    />
                  </motion.g>
                )}

                {!shouldReduceMotion &&
                  [0, 1, 2, 3].map((i) => (
                    <motion.circle
                      key={i}
                      cx="100"
                      cy="100"
                      r="10"
                      fill="none"
                      stroke={stats.accent}
                      strokeWidth={0.5 + stats.intensity * 2}
                      initial={{ scale: 0.2, opacity: 0 }}
                      animate={{
                        scale: [0.2, 7 + stats.intensity * 3],
                        opacity: [0, 0.4, 0],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3.5,
                        delay: i * 0.8,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                    />
                  ))}

                <motion.g
                  filter="url(#energyAura)"
                  animate={
                    shouldReduceMotion
                      ? {}
                      : {
                          scale: [1, 1 + stats.intensity * 0.2, 1],
                        }
                  }
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <circle
                    cx="100"
                    cy="100"
                    r={15 + stats.intensity * 35}
                    fill={stats.accent}
                    fillOpacity={0.15 + stats.intensity * 0.2}
                  />
                  <circle cx="100" cy="100" r={8 + stats.intensity * 22} fill="url(#liquidCore)" />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r={3 + stats.intensity * 8}
                    fill="white"
                    animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.1, 0.9] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  />
                </motion.g>

                <g transform="translate(100, 185)">
                  <text
                    textAnchor="middle"
                    className="font-black fill-white italic uppercase"
                    style={{ fontSize: '10px', letterSpacing: '0.2em' }}
                  >
                    Energy Epicenter
                  </text>
                  <motion.text
                    y="10"
                    textAnchor="middle"
                    className="font-black fill-sky-400 uppercase"
                    style={{ fontSize: '6px', letterSpacing: '0.1em' }}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    Depth 10km • Magnitude Base M{value.toFixed(1)}
                  </motion.text>
                </g>
              </svg>
            </motion.div>
          ) : (
            <motion.div
              key="int"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative w-full h-full flex flex-col items-center justify-center bg-white"
            >
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              <motion.div
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        x: [0, -shakeFactor / 2, shakeFactor / 2, 0],
                        rotate: [0, -shakeFactor / 15, shakeFactor / 15, 0],
                        skewX: [0, -shakeFactor / 20, shakeFactor / 20, 0],
                      }
                }
                transition={{
                  repeat: Infinity,
                  duration: Math.max(0.04, 0.35 / (intensityLevel || 0.2)),
                  ease: 'linear',
                }}
                className="relative w-40 h-32 bg-white rounded-3xl shadow-xl border-b-8 border-slate-200 flex flex-col items-center justify-end p-4 origin-bottom"
              >
                <div className="flex items-end space-x-3 w-full justify-center">
                  <motion.div
                    animate={{ rotate: shakeFactor }}
                    className="w-8 h-14 bg-sky-100 rounded-t-xl"
                  />
                  <motion.div
                    animate={{ rotate: -shakeFactor * 0.5 }}
                    className="w-12 h-20 bg-sky-500 rounded-t-xl shadow-inner"
                  />
                </div>
                <motion.div
                  animate={{ rotate: [-shakeFactor * 3, shakeFactor * 3, -shakeFactor * 3] }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 origin-top"
                >
                  <div className="w-0.5 h-10 bg-slate-300" />
                  <div className="w-6 h-3 bg-yellow-400 rounded-full blur-[1px]" />
                </motion.div>
              </motion.div>

              <motion.div
                layoutId="int-tag"
                className={`mt-6 px-8 py-2 rounded-2xl font-black text-white text-xl shadow-lg transition-colors duration-500 ${
                  intensityLevel >= 5 ? 'bg-rose-500' : 'bg-sky-500'
                }`}
              >
                震度 {intensityLevel} 級
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 控制面板 */}
      <div className="p-6 bg-white space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              能量發散等級：{stats.description}
            </span>
            <span className={`text-xs font-black ${stats.color} tracking-tighter`}>
              預估釋放能量：{stats.energy} 單位
            </span>
          </div>
          <div className="bg-sky-50 px-5 py-2 rounded-2xl border border-sky-100 flex flex-col items-center">
            <span className="text-[8px] font-black text-sky-400 uppercase mb-0.5">Scale</span>
            <span className="text-2xl font-black text-sky-600 font-mono italic leading-none">
              M {value.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="relative h-10 flex items-center">
          <div className="absolute inset-0 h-3 bg-slate-100 rounded-full my-auto" />
          <motion.div
            className="absolute left-0 h-3 bg-sky-500 rounded-full my-auto shadow-sm"
            style={{ width: `${((value - 1) / 8) * 100}%` }}
          />
          <input
            type="range"
            min="1"
            max="9"
            step="0.1"
            value={value}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="absolute -bottom-5 w-full flex justify-between px-1">
            {[1, 3, 5, 7, 9].map((v) => (
              <span
                key={v}
                className={`text-[9px] font-black transition-colors ${Math.round(value) === v ? 'text-sky-500' : 'text-slate-300'}`}
              >
                {v}.0
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarthquakeSimulator;
