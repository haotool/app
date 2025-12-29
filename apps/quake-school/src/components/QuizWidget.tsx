import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QUIZ_QUESTIONS } from '../data/lessons';

// 隨機洗牌函數 (Fisher-Yates)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j] as T;
    shuffled[j] = temp as T;
  }
  return shuffled;
};

// 每次測驗抽取的題目數量
const QUESTIONS_PER_QUIZ = 5;

interface Props {
  onFinish: (score: number) => void;
  onReset: () => void;
}

const QuizWidget: React.FC<Props> = ({ onFinish, onReset: _onReset }) => {
  // 隨機抽取題目（只在初始化時執行一次）
  const randomQuestions = useMemo(() => {
    return shuffleArray(QUIZ_QUESTIONS).slice(0, QUESTIONS_PER_QUIZ);
  }, []);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const question = randomQuestions[currentIdx];

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
      setScore((s) => s + Math.floor(100 / QUESTIONS_PER_QUIZ));
    }
  };

  const handleNext = () => {
    if (navigator.vibrate) navigator.vibrate(10);

    if (currentIdx < randomQuestions.length - 1) {
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
      case 3: // 震度會因距離而不同
        return (
          <motion.svg {...commonProps}>
            {/* 震央 */}
            <motion.circle
              cx="30"
              cy="60"
              r="10"
              fill="#ef4444"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            {/* 同心圓波紋 */}
            {[1, 2, 3].map((i) => (
              <motion.circle
                key={i}
                cx="30"
                cy="60"
                r={20 + i * 20}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity={1 - i * 0.25}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.8 - i * 0.2, 0.4 - i * 0.1, 0.8 - i * 0.2],
                }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
              />
            ))}
            <text x="90" y="100" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748b">
              越遠越弱
            </text>
          </motion.svg>
        );
      case 4: // 淺層地震破壞力
        return (
          <motion.svg {...commonProps}>
            {/* 地表 */}
            <rect x="10" y="70" width="100" height="40" fill="#e2e8f0" rx="4" />
            {/* 淺層震源 */}
            <motion.circle
              cx="60"
              cy="55"
              r="8"
              fill="#ef4444"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
            {/* 衝擊波 */}
            <motion.path
              d="M40 70 L50 55 L60 70 L70 55 L80 70"
              fill="none"
              stroke="#f97316"
              strokeWidth="3"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.3 }}
            />
            <text x="60" y="115" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">
              淺層=近距離重擊
            </text>
          </motion.svg>
        );
      case 5: // DCH 趴下掩護
        return (
          <motion.svg {...commonProps}>
            {/* 桌子 */}
            <rect x="30" y="50" width="60" height="8" fill="#94a3b8" rx="2" />
            <rect x="35" y="58" width="4" height="30" fill="#94a3b8" />
            <rect x="81" y="58" width="4" height="30" fill="#94a3b8" />
            {/* 人躲在桌下 */}
            <motion.g animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
              <circle cx="60" cy="70" r="8" fill="#fbbf24" />
              <ellipse cx="60" cy="85" rx="12" ry="8" fill="#fbbf24" />
            </motion.g>
            <text x="60" y="115" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">
              趴下掩護穩住
            </text>
          </motion.svg>
        );
      case 6: // 地震後檢查瓦斯
        return (
          <motion.svg {...commonProps}>
            {/* 瓦斯爐 */}
            <rect x="35" y="50" width="50" height="35" fill="#64748b" rx="4" />
            <circle cx="50" cy="65" r="8" fill="#374151" />
            <circle cx="70" cy="65" r="8" fill="#374151" />
            {/* 火焰（關閉狀態） */}
            <motion.path
              d="M50 55 L52 45 L50 50 L48 45 Z"
              fill="#22c55e"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <text x="60" y="115" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">
              檢查瓦斯
            </text>
          </motion.svg>
        );
      case 12: // S 波無法穿過液體
        return (
          <motion.svg {...commonProps}>
            {/* 地球剖面 */}
            <circle cx="60" cy="60" r="45" fill="#e2e8f0" />
            <circle cx="60" cy="60" r="25" fill="#3b82f6" opacity="0.6" />
            <circle cx="60" cy="60" r="10" fill="#f59e0b" />
            {/* S 波被擋 */}
            <motion.path
              d="M20 60 L35 60"
              stroke="#f43f5e"
              strokeWidth="4"
              strokeLinecap="round"
              animate={{ x: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <text x="25" y="50" fontSize="8" fill="#f43f5e" fontWeight="bold">
              S波
            </text>
            <text x="60" y="115" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748b">
              液態外核擋住S波
            </text>
          </motion.svg>
        );
      case 13: // 臺灣板塊
        return (
          <motion.svg {...commonProps}>
            {/* 簡化臺灣形狀 */}
            <motion.path
              d="M55 30 Q70 35 65 60 Q70 80 60 90 Q50 85 55 60 Q45 40 55 30"
              fill="#22c55e"
              stroke="#16a34a"
              strokeWidth="2"
              animate={{ x: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            {/* 板塊箭頭 */}
            <motion.path
              d="M20 60 L40 60 M35 55 L40 60 L35 65"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.path
              d="M100 60 L80 60 M85 55 L80 60 L85 65"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{ x: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <text x="20" y="80" fontSize="7" fill="#3b82f6" fontWeight="bold">
              歐亞
            </text>
            <text x="85" y="80" fontSize="7" fill="#f43f5e" fontWeight="bold">
              菲律賓海
            </text>
          </motion.svg>
        );
      case 14: // 斷層
        return (
          <motion.svg {...commonProps}>
            {/* 岩層 */}
            <rect x="15" y="30" width="40" height="60" fill="#94a3b8" rx="2" />
            <motion.rect
              x="65"
              y="40"
              width="40"
              height="60"
              fill="#64748b"
              rx="2"
              animate={{ y: [40, 35, 40] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            {/* 斷層線 */}
            <motion.path
              d="M55 30 L65 100"
              stroke="#ef4444"
              strokeWidth="3"
              strokeDasharray="5 3"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <text x="60" y="115" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">
              斷層位移
            </text>
          </motion.svg>
        );
      case 15: // 32個 M6 = 1個 M7
        return (
          <motion.svg {...commonProps}>
            {/* 小圓點群 */}
            {Array.from({ length: 16 }, (_, i) => (
              <motion.circle
                key={i}
                cx={20 + (i % 4) * 12}
                cy={25 + Math.floor(i / 4) * 12}
                r="4"
                fill="#94a3b8"
                animate={{ scale: [1, 0.8, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.05 }}
              />
            ))}
            <text x="40" y="85" fontSize="8" fill="#64748b">
              M6 x32
            </text>
            {/* 等號 */}
            <text x="60" y="75" fontSize="16" fill="#64748b">
              =
            </text>
            {/* 大圓 */}
            <motion.circle
              cx="90"
              cy="55"
              r="20"
              fill="#f59e0b"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
            <text x="90" y="90" textAnchor="middle" fontSize="8" fill="#64748b">
              M7
            </text>
          </motion.svg>
        );
      case 16: // 臺灣震度7級
        return (
          <motion.svg {...commonProps}>
            {/* 震度階梯 */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((level, i) => (
              <motion.rect
                key={level}
                x={10 + i * 12}
                y={90 - level * 10}
                width="10"
                height={level * 10 + 10}
                fill={level >= 5 ? '#ef4444' : level >= 3 ? '#f59e0b' : '#22c55e'}
                rx="2"
                animate={level === 7 ? { opacity: [1, 0.7, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
              />
            ))}
            <text x="60" y="115" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">
              0-7級震度
            </text>
          </motion.svg>
        );
      case 17: // 震度5弱體感
        return (
          <motion.svg {...commonProps}>
            {/* 人形 */}
            <motion.g
              animate={{ x: [-5, 5, -5], rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
            >
              <circle cx="60" cy="35" r="12" fill="#fbbf24" />
              <rect x="52" y="47" width="16" height="30" fill="#3b82f6" rx="4" />
              <rect x="48" y="77" width="8" height="20" fill="#1e40af" rx="2" />
              <rect x="64" y="77" width="8" height="20" fill="#1e40af" rx="2" />
            </motion.g>
            {/* 家具 */}
            <motion.rect
              x="20"
              y="60"
              width="15"
              height="30"
              fill="#94a3b8"
              rx="2"
              animate={{ x: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 0.3 }}
            />
            <text x="60" y="115" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">
              難以站穩
            </text>
          </motion.svg>
        );
      case 18: // 深層地震
        return (
          <motion.svg {...commonProps}>
            {/* 地表 */}
            <rect x="10" y="20" width="100" height="15" fill="#e2e8f0" rx="2" />
            {/* 深層震源 */}
            <motion.circle
              cx="60"
              cy="90"
              r="10"
              fill="#f59e0b"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            {/* 擴散波紋 */}
            {[1, 2, 3].map((i) => (
              <motion.circle
                key={i}
                cx="60"
                cy="90"
                r={15 + i * 15}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1"
                opacity={0.3}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
              />
            ))}
            <text x="60" y="115" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748b">
              深層：廣但弱
            </text>
          </motion.svg>
        );
      case 19: // 躲桌下
        return (
          <motion.svg {...commonProps}>
            {/* 房間 */}
            <rect
              x="10"
              y="10"
              width="100"
              height="80"
              fill="#f1f5f9"
              stroke="#cbd5e1"
              strokeWidth="2"
              rx="4"
            />
            {/* 窗戶（危險） */}
            <rect
              x="75"
              y="20"
              width="25"
              height="30"
              fill="#bfdbfe"
              stroke="#ef4444"
              strokeWidth="2"
            />
            <text x="87" y="60" fontSize="6" fill="#ef4444">
              ✕
            </text>
            {/* 桌子 */}
            <rect x="25" y="55" width="40" height="6" fill="#78716c" rx="2" />
            <rect x="28" y="61" width="4" height="20" fill="#78716c" />
            <rect x="58" y="61" width="4" height="20" fill="#78716c" />
            {/* 人躲在下面 */}
            <motion.circle
              cx="45"
              cy="70"
              r="6"
              fill="#22c55e"
              animate={{ scale: [1, 0.9, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <text x="45" y="95" textAnchor="middle" fontSize="6" fill="#22c55e">
              ✓
            </text>
          </motion.svg>
        );
      case 20: // 地震預警
        return (
          <motion.svg {...commonProps}>
            {/* 手機 */}
            <rect x="40" y="20" width="40" height="70" fill="#1e293b" rx="8" />
            <rect x="44" y="28" width="32" height="54" fill="#0ea5e9" rx="2" />
            {/* 警報圖示 */}
            <motion.g
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <circle cx="60" cy="50" r="10" fill="#fbbf24" />
              <text
                x="60"
                y="54"
                textAnchor="middle"
                fontSize="12"
                fill="#78350f"
                fontWeight="bold"
              >
                !
              </text>
            </motion.g>
            {/* 秒數 */}
            <text x="60" y="72" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
              10秒
            </text>
            <text x="60" y="115" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748b">
              預警爭取時間
            </text>
          </motion.svg>
        );
      default:
        // 通用動畫：地震波
        return (
          <motion.svg {...commonProps}>
            <motion.path
              d="M20 60 L35 40 L50 80 L65 30 L80 70 L95 50 L100 60"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="4"
              strokeLinecap="round"
              animate={{ pathLength: [0, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <motion.circle
              cx="60"
              cy="90"
              r="8"
              fill="#f43f5e"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </motion.svg>
        );
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
            {String(randomQuestions.length).padStart(2, '0')}
          </span>
        </div>
        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIdx + 1) / randomQuestions.length) * 100}%` }}
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
                    {currentIdx < randomQuestions.length - 1 ? '前進下一題' : '完成檢定課程'}
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
