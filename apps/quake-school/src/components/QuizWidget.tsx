import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QUIZ_QUESTIONS } from '../data/lessons';

interface Props {
  onFinish: (score: number) => void;
  onReset: () => void;
}

const QuizWidget: React.FC<Props> = ({ onFinish, onReset: _onReset }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const question = QUIZ_QUESTIONS[currentIdx];

  if (!question) {
    return <div>Error: No question found</div>;
  }

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);

    const isCorrect = idx === question.correctIndex;

    // 觸覺回饋
    if (navigator.vibrate) {
      if (isCorrect) {
        navigator.vibrate([40, 30, 40]); // 成功雙震
      } else {
        navigator.vibrate(80); // 失敗長單震
      }
    }

    if (isCorrect) {
      setScore((s) => s + 20);
    }
  };

  const handleNext = () => {
    if (navigator.vibrate) navigator.vibrate(10);

    if (currentIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
    } else {
      onFinish(score);
    }
  };

  const getExplanationIllustration = (id: number) => {
    const commonProps = { viewBox: '0 0 120 120', className: 'w-32 h-32 sm:w-36 sm:h-36' };

    switch (id) {
      case 10: // P 波 - 縱波上下頂
        return (
          <motion.svg {...commonProps}>
            {/* 地面 */}
            <rect x="10" y="80" width="100" height="30" rx="4" fill="#e2e8f0" />
            {/* P 波壓縮條 */}
            {Array.from({ length: 8 }, (_, i) => (
              <motion.rect
                key={i}
                x={15 + i * 12}
                y="45"
                width="8"
                height="30"
                rx="2"
                fill="#0ea5e9"
                animate={{
                  y: [45, 50, 45],
                  height: [30, 25, 30],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.4,
                  delay: i * 0.05,
                }}
              />
            ))}
            {/* 箭頭指示上下 */}
            <motion.path
              d="M60 20 L60 10 M55 15 L60 10 L65 15"
              stroke="#0ea5e9"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
            <text x="60" y="115" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
              P波：上下推拉
            </text>
          </motion.svg>
        );
      case 11: // S 波 - 橫波左右晃
        return (
          <motion.svg {...commonProps}>
            {/* 房屋 */}
            <motion.g animate={{ x: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 0.3 }}>
              <path d="M40 50 L60 30 L80 50 Z" fill="#94a3b8" />
              <rect x="45" y="50" width="30" height="35" fill="#cbd5e1" />
              <rect x="55" y="60" width="10" height="15" fill="#64748b" />
            </motion.g>
            {/* S 波波形 */}
            <motion.path
              d="M10 100 Q25 85 40 100 T70 100 T100 100"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="4"
              strokeLinecap="round"
              animate={{ x: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
            <text x="60" y="115" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
              S波：左右搖晃
            </text>
          </motion.svg>
        );
      case 7: // 板塊卡住
        return (
          <motion.svg {...commonProps}>
            <rect x="20" y="40" width="80" height="15" rx="4" fill="#cbd5e1" />
            <motion.rect
              x="20"
              y="60"
              width="80"
              height="15"
              rx="4"
              fill="#94a3b8"
              animate={{ skewX: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <motion.path
              d="M50 55 L70 55"
              stroke="#f43f5e"
              strokeWidth="4"
              strokeDasharray="2 2"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </motion.svg>
        );
      case 1: // 規模唯一性
        return (
          <motion.svg {...commonProps}>
            <g opacity="0.4">
              <circle cx="20" cy="20" r="5" fill="#94a3b8" />
              <circle cx="100" cy="20" r="5" fill="#94a3b8" />
              <circle cx="20" cy="100" r="5" fill="#94a3b8" />
              <circle cx="100" cy="100" r="5" fill="#94a3b8" />
              <path
                d="M25 25 L45 45 M95 25 L75 45 M25 95 L45 75 M95 95 L75 75"
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="2 2"
              />
            </g>
            <motion.circle
              cx="60"
              cy="60"
              r="15"
              fill="#0ea5e9"
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
          </motion.svg>
        );
      case 2: // 32倍能量
        return (
          <motion.svg {...commonProps}>
            <circle cx="25" cy="80" r="8" fill="#cbd5e1" />
            <motion.path
              d="M70 85 L90 55 L75 55 L95 20 L80 50 L95 50 Z"
              fill="#f59e0b"
              stroke="#f59e0b"
              strokeWidth="2"
              animate={{ scale: [1, 1.1, 1], rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
            <text x="85" y="100" textAnchor="middle" fontSize="12" fontWeight="900" fill="#f59e0b">
              x32
            </text>
          </motion.svg>
        );
      case 3: // 距離衰減
        return (
          <motion.svg {...commonProps}>
            <motion.path d="M20 90 L15 70 L25 75 L30 60 L35 75 L45 70 L40 90 Z" fill="#ef4444" />
            {[1, 2, 3].map((i) => (
              <motion.path
                key={i}
                d={`M${30 + i * 15} 60 Q${40 + i * 15} 70 ${30 + i * 15} 80`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                animate={{ opacity: [0, 1, 0], x: [0, 10] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
              />
            ))}
          </motion.svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto overflow-hidden">
      <div className="h-14 flex items-center justify-between px-2 shrink-0 border-b border-sky-50 bg-white">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
            題目進度
          </span>
          <span className="text-xl font-black text-slate-800 font-mono leading-none mt-1">
            {String(currentIdx + 1).padStart(2, '0')} <span className="text-slate-200">/</span>{' '}
            {String(QUIZ_QUESTIONS.length).padStart(2, '0')}
          </span>
        </div>
        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
            className="h-full bg-sky-500 transition-all duration-500"
          />
        </div>
      </div>

      <div className="h-32 flex flex-col justify-center shrink-0 px-4 bg-white z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <h3 className="text-xl font-black text-slate-800 leading-snug">{question.question}</h3>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex-grow relative bg-sky-50/50">
        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white to-transparent" />

        <div className="absolute inset-0 p-4">
          <AnimatePresence mode="wait">
            {!isAnswered ? (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex flex-col space-y-3"
              >
                {question.options.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(idx)}
                    className="flex-1 flex items-center w-full bg-white border-2 border-sky-100/30 rounded-3xl px-5 py-3 text-left shadow-sm active:bg-sky-50 transition-all hover:border-sky-200"
                  >
                    <span className="w-9 h-9 shrink-0 flex items-center justify-center rounded-2xl bg-sky-50 text-sky-500 font-black text-sm">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="ml-4 font-bold text-slate-700 text-sm leading-tight">
                      {opt}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="h-full flex flex-col bg-white rounded-[2.5rem] p-6 shadow-xl shadow-sky-100/50 border border-sky-50 overflow-hidden"
              >
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                  <div className="mb-4 p-4 bg-sky-50/30 rounded-full border border-sky-50/50">
                    {getExplanationIllustration(question.id)}
                  </div>

                  <div className="space-y-4 max-w-[280px]">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-slate-50 border border-sky-100">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${selectedIdx === question.correctIndex ? 'text-sky-500' : 'text-rose-500'}`}
                      >
                        {selectedIdx === question.correctIndex
                          ? '專業認證：答對了'
                          : '科學筆記：深入解析'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleNext}
                  className="mt-6 w-full h-14 shrink-0 bg-sky-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-sky-100 flex items-center justify-center space-x-3"
                >
                  <span>
                    {currentIdx < QUIZ_QUESTIONS.length - 1 ? '前進下一題' : '完成檢定課程'}
                  </span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="h-6 shrink-0 bg-sky-50/50" />
    </div>
  );
};

export default QuizWidget;
