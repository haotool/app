import React from 'react';
// Fix: Added AnimatePresence to the framer-motion imports
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';

interface Props {
  magnitude: number;
  onMagnitudeChange: (val: number) => void;
}

const MagnitudeSliderSVG: React.FC<Props> = ({ magnitude, onMagnitudeChange }) => {
  const shouldReduceMotion = useReducedMotion();

  // Normalize magnitude for shaking (1-9)
  const shakeIntensity = Math.pow(magnitude / 3, 2);
  const isHighIntensity = magnitude >= 6;
  const isExtremeIntensity = magnitude >= 7.5;

  return (
    <div className="w-full space-y-8">
      <div className="relative h-64 bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center border-b-8 border-slate-800 shadow-2xl perspective-1000">
        {/* Sky / Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950 opacity-50" />

        {/* Grid Floor */}
        <div
          className="absolute bottom-0 w-full h-32 bg-slate-800 opacity-20"
          style={{
            transform: 'rotateX(60deg) translateY(20px)',
            backgroundImage:
              'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* The Room Container (Isometric Perspective) */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  x: [0, -shakeIntensity, shakeIntensity, -shakeIntensity, 0],
                  y: [0, shakeIntensity, -shakeIntensity, shakeIntensity, 0],
                  rotateZ: [0, -shakeIntensity / 4, shakeIntensity / 4, 0],
                }
          }
          transition={{
            repeat: Infinity,
            duration: Math.max(0.05, 0.5 / (magnitude / 2)),
            ease: 'linear',
          }}
          className="relative w-48 h-40 bg-white rounded-lg shadow-2xl border-2 border-slate-200 flex flex-col items-center justify-end p-4 origin-bottom"
          style={{ transform: 'rotateX(10deg) rotateY(-10deg)' }}
        >
          {/* Window */}
          <div className="absolute top-4 left-4 w-12 h-16 bg-cyan-100 border-2 border-slate-300 rounded overflow-hidden">
            <div className="w-full h-full opacity-30 flex">
              <div className="w-1/2 h-full border-r border-slate-300" />
              <div className="h-1/2 w-full border-b border-slate-300 absolute top-0" />
            </div>
          </div>

          {/* Picture on wall */}
          <motion.div
            animate={{ rotate: isHighIntensity ? [-5, 5, -5] : 0 }}
            transition={{ repeat: Infinity, duration: 0.2 }}
            className="absolute top-6 right-6 w-10 h-8 bg-amber-200 border border-slate-400 p-1"
          >
            <div className="w-full h-full bg-slate-400 opacity-20" />
          </motion.div>

          {/* Furniture: Table */}
          <div className="w-24 h-2 bg-amber-700 rounded-t relative">
            <div className="absolute top-2 left-2 w-1 h-8 bg-amber-800" />
            <div className="absolute top-2 right-2 w-1 h-8 bg-amber-800" />

            {/* Item on table: Vase */}
            <motion.div
              animate={
                isHighIntensity
                  ? {
                      x: [0, 10, -5, 20],
                      y: [0, 0, 0, 40],
                      rotate: [0, 45, 90, 180],
                      opacity: [1, 1, 1, 0],
                    }
                  : { x: 0, y: 0, rotate: 0, opacity: 1 }
              }
              transition={{ duration: 0.5, ease: 'easeIn' }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-6 bg-indigo-500 rounded-full border border-indigo-600"
            />
          </div>

          {/* Structural Cracks (Visible at high magnitude) */}
          <AnimatePresence>
            {isHighIntensity && (
              <motion.svg
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <path
                  d="M10,10 L30,40 L20,80"
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M180,20 L160,60 L170,120"
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth="2"
                  fill="none"
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info Overlay */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-700 flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${isExtremeIntensity ? 'bg-red-500' : isHighIntensity ? 'bg-amber-500' : 'bg-green-500'}`}
          />
          <span className="text-white text-xs font-bold font-mono">
            模擬器現況：{magnitude < 4 ? '輕微晃動' : magnitude < 7 ? '中度損害' : '強烈破壞'}
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
              Earthquake Scale
            </span>
            <h4 className="text-2xl font-black text-slate-800">
              芮氏規模 M {magnitude.toFixed(1)}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase">預估能量</span>
            <p className="text-sm font-bold text-slate-600">
              約{' '}
              {Math.pow(32, magnitude - 1).toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
              能量單位
            </p>
          </div>
        </div>

        <div className="relative pt-4 pb-2">
          <input
            id="magnitude-range"
            type="range"
            min="1"
            max="9"
            step="0.1"
            value={magnitude}
            onChange={(e) => onMagnitudeChange(parseFloat(e.target.value))}
            className="w-full h-4 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
            aria-label="調整地震規模"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-3 px-1 uppercase tracking-tighter">
            <span>微小</span>
            <span>有感</span>
            <span>中型</span>
            <span>強烈</span>
            <span>毀滅級</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagnitudeSliderSVG;
