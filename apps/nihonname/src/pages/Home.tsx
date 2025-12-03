/**
 * Home page for NihonName
 * Main name generator functionality
 */
import { useState, useRef } from 'react';
import {
  RefreshCw,
  Camera,
  ChevronRight,
  Dices,
  Sparkles,
  BookOpen,
  ExternalLink,
  X,
  ScanEye,
  Flower,
  Scroll,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { SURNAME_MAP, FUNNY_NAMES, JAPANESE_GIVEN_NAMES, PRIMARY_SOURCE } from '../constants';
import type { GeneratorState } from '../types';

// --- SVG Components for High-End Aesthetics ---

const SeigaihaPattern = ({
  className,
  opacity = 0.1,
}: {
  className?: string;
  opacity?: number;
}) => (
  <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="seigaiha" width="40" height="20" patternUnits="userSpaceOnUse">
        <path
          d="M0,10 A10,10 0 0,1 20,10 A10,10 0 0,1 40,10 M20,10 A10,10 0 0,1 30,0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={opacity}
        />
        <path
          d="M0,20 A20,20 0 0,1 40,20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={opacity}
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#seigaiha)" />
  </svg>
);

const AsanohaPattern = ({ className, opacity = 0.1 }: { className?: string; opacity?: number }) => (
  <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern
        id="asanoha"
        width="60"
        height="34.6"
        patternUnits="userSpaceOnUse"
        patternTransform="scale(1.5)"
      >
        <path
          d="M30,0 L60,17.3 L30,34.6 L0,17.3 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={opacity}
        />
        <path
          d="M30,17.3 L0,0 M30,17.3 L60,0 M30,17.3 L30,34.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={opacity}
        />
        <path
          d="M0,17.3 L60,17.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={opacity}
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#asanoha)" />
  </svg>
);

const KamonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M50 5 L50 95 M5 50 L95 50" stroke="currentColor" strokeWidth="1" />
    <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="3" />
    <path
      d="M50 20 Q80 20 80 50 Q80 80 50 80 Q20 80 20 50 Q20 20 50 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
);

const ToriiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path
      d="M10,25 L90,25 L90,32 L82,32 L82,95 L72,95 L72,32 L28,32 L28,95 L18,95 L18,32 L10,32 Z"
      opacity="0.9"
    />
    <rect x="5" y="12" width="90" height="8" rx="1" />
    <rect x="20" y="38" width="60" height="6" />
  </svg>
);

const DarumaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path
      d="M50 5 C25 5 10 25 10 50 C10 80 25 95 50 95 C75 95 90 80 90 50 C90 25 75 5 50 5 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      d="M30 40 Q50 30 70 40"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="35" cy="50" r="5" fill="currentColor" />
    <circle cx="65" cy="50" r="5" fill="currentColor" />
    <path
      d="M40 65 Q50 75 60 65"
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M20 60 Q15 75 25 85" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
    <path d="M80 60 Q85 75 75 85" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
  </svg>
);

const SakuraPetal = ({ style }: { style: React.CSSProperties }) => (
  <svg
    viewBox="0 0 30 30"
    className="absolute pointer-events-none"
    style={style}
    fill="currentColor"
  >
    <path
      d="M15,0 C15,0 20,5 20,10 C20,15 15,20 15,20 C15,20 10,15 10,10 C10,5 15,0 15,0 Z M15,0 C15,0 18,2 18,5"
      opacity="0.8"
    />
  </svg>
);

// --- Enhanced Components ---

// Pre-generate static petal data outside component to avoid re-computation and purity rules
const SAKURA_PETALS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: (i * 3.33) % 100, // Deterministic distribution
  animationDuration: 8 + (i % 5) * 2.4, // 8-20s range
  animationDelay: (i % 8) * 1, // 0-7s range
  size: 10 + (i % 6) * 2.5, // 10-25px range
  rotation: (i * 36) % 360, // Deterministic rotation
  color: i % 4 === 0 ? '#fda4af' : '#fecdd3', // 25% darker pink
}));

const SakuraBackground = () => {
  const petals = SAKURA_PETALS;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map((petal) => (
        <SakuraPetal
          key={petal.id}
          style={{
            left: `${petal.left}%`,
            width: `${petal.size}px`,
            height: `${petal.size}px`,
            color: petal.color,
            top: '-50px',
            animation: `fall ${petal.animationDuration}s linear infinite, sway ${petal.animationDuration / 2}s ease-in-out infinite alternate`,
            animationDelay: `${petal.animationDelay}s`,
            opacity: 0.6,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { top: -10%; transform: rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 110%; transform: rotate(360deg); opacity: 0; }
        }
        @keyframes sway {
          from { margin-left: -15px; }
          to { margin-left: 15px; }
        }
      `}</style>
    </div>
  );
};

// Modal for Surname Lookup
const LookupModal = ({
  surname,
  isOpen,
  onClose,
  currentSelection,
  onSelect,
}: {
  surname: string;
  isOpen: boolean;
  onClose: () => void;
  currentSelection: string;
  onSelect: (name: string) => void;
}) => {
  if (!isOpen) return null;

  const key = surname.trim();
  const mappedNames = key ? (SURNAME_MAP[key] ?? SURNAME_MAP[key.substring(0, 1)] ?? []) : [];
  const isVerified = mappedNames.length > 2;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-[#fcfaf7] w-full max-w-md rounded-xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] md:max-h-[800px] border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-red-900 text-stone-50 p-6 text-center shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-red-200 hover:text-white transition-colors rounded-full hover:bg-red-800"
          >
            <X size={20} />
          </button>
          <div className="inline-flex items-center justify-center space-x-2 opacity-80 mb-2">
            <div className="h-px w-8 bg-red-300"></div>
            <span className="text-xs tracking-widest uppercase">Family Register</span>
            <div className="h-px w-8 bg-red-300"></div>
          </div>
          <h3 className="text-3xl font-bold font-jp flex items-center justify-center gap-2">
            <ToriiIcon className="w-8 h-8 opacity-50" />「{key || '?'}」姓氏族譜
            <ToriiIcon className="w-8 h-8 opacity-50" />
          </h3>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <AsanohaPattern />
          </div>
          <div className="p-6 relative z-10">
            {isVerified && (
              <div className="flex flex-col items-center justify-center text-emerald-700 bg-emerald-50 border border-emerald-100 py-3 rounded-lg mb-4 text-xs">
                <div className="flex items-center font-bold mb-1">
                  <CheckCircle2 size={14} className="mr-1" />
                  <span>資料庫核實：{PRIMARY_SOURCE.author}</span>
                </div>
                <span className="opacity-80">日治時期戶籍常用改姓紀錄</span>
              </div>
            )}
            <p className="text-sm text-stone-500 text-center mb-6 font-serif leading-relaxed">
              根據《{PRIMARY_SOURCE.docName}》及總督府戶籍資料，
              <br />
              以下為「{key}」姓氏當時常見的改姓對照：
            </p>

            {mappedNames.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {mappedNames.map((name, idx) => {
                  const isSelected = name === currentSelection;
                  return (
                    <button
                      key={idx}
                      onClick={() => onSelect(name)}
                      className={`group relative border rounded-lg py-3 px-4 text-center transition-all shadow-sm flex items-center justify-center overflow-hidden
                        ${
                          isSelected
                            ? 'bg-red-50 border-red-500 ring-2 ring-red-100'
                            : 'bg-white border-stone-200 hover:border-red-300 hover:shadow-md'
                        }`}
                    >
                      <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <SeigaihaPattern />
                      </div>
                      <div
                        className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-lg transition-colors
                          ${isSelected ? 'bg-red-600' : 'bg-red-100 group-hover:bg-red-400'}`}
                      ></div>
                      <span
                        className={`text-lg font-serif font-bold tracking-wide relative z-10 ${isSelected ? 'text-red-900' : 'text-stone-800'}`}
                      >
                        {name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 size={16} className="absolute right-2 text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-stone-400 space-y-4 py-12 bg-stone-50/50 rounded-lg border border-dashed border-stone-200">
                <Scroll size={32} className="opacity-50" />
                <div className="text-center">
                  <p className="font-bold mb-1">查無特定記載</p>
                  <p className="text-xs">系統將使用通用日本姓氏</p>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-stone-200 text-[10px] text-stone-400 space-y-2">
              <p className="font-bold uppercase tracking-wider text-stone-300 mb-2">改姓原則說明</p>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-start space-x-2">
                  <span className="text-red-800 font-bold">1.</span>
                  <span>語意翻譯 (如：林→林，高→高山)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-red-800 font-bold">2.</span>
                  <span>字形拆解 (如：林→二木，黃→共田)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-red-800 font-bold">3.</span>
                  <span>讀音近似 (如：蔡→佐井 Sai)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 shrink-0 z-10">
          <div className="flex space-x-2">
            <a
              href={PRIMARY_SOURCE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center bg-white hover:bg-stone-50 text-stone-600 py-3 rounded-lg text-xs md:text-sm transition-colors border border-stone-200 shadow-sm"
            >
              <BookOpen size={14} className="mr-2" />
              歷史來源：巴哈姆特
            </a>
            <a
              href={`https://www.google.com/search?q=日治時期+${key}+改姓`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none flex items-center justify-center bg-white hover:text-red-600 text-stone-400 p-3 rounded-lg border border-stone-200 shadow-sm transition-colors"
              title="搜尋更多"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function
const getRandom = <T,>(arr: T[]): T => {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index] as T;
};

export default function Home() {
  const [state, setState] = useState<GeneratorState>({
    originalSurname: '',
    originalGivenName: '',
    japaneseSurname: '',
    punName: FUNNY_NAMES[0] ?? { kanji: '夏目漱石', romaji: 'Natsume Sōseki', meaning: '明治文豪' },
    step: 'input',
  });

  const [displayGivenName, setDisplayGivenName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const uiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSurnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, originalSurname: e.target.value.trim() }));
  };

  const handleGivenNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, originalGivenName: e.target.value.trim() }));
  };

  const generateNames = () => {
    if (!state.originalSurname) return;
    setLoading(true);
    setTimeout(() => {
      const key = state.originalSurname;
      const possibleSurnames = SURNAME_MAP[key] ??
        SURNAME_MAP[key.substring(0, 1)] ?? [
          `${key}山`,
          `${key}田`,
          `${key}本`,
          '田中',
          '佐藤',
          '鈴木',
        ];
      const jpSurname = getRandom(possibleSurnames);
      const finalGivenName = state.originalGivenName
        ? state.originalGivenName
        : getRandom(JAPANESE_GIVEN_NAMES);
      const pun = getRandom(FUNNY_NAMES);

      setState((prev) => ({ ...prev, japaneseSurname: jpSurname, punName: pun, step: 'result' }));
      setDisplayGivenName(finalGivenName);
      setLoading(false);
    }, 1000);
  };

  const rerollSurname = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const key = state.originalSurname;
    const possibleSurnames = SURNAME_MAP[key] ??
      SURNAME_MAP[key.substring(0, 1)] ?? [`${key}山`, `${key}田`, '田中', '佐藤', '鈴木'];
    setState((prev) => ({ ...prev, japaneseSurname: getRandom(possibleSurnames) }));
  };

  const handleSelectName = (name: string) => {
    setState((prev) => ({ ...prev, japaneseSurname: name }));
    setShowLookup(false);
  };

  const rerollGivenName = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDisplayGivenName(getRandom(JAPANESE_GIVEN_NAMES));
  };

  const rerollPun = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setState((prev) => ({ ...prev, punName: getRandom(FUNNY_NAMES) }));
  };

  const toggleUI = () => {
    setShowUI(false);
    setShowHint(true);

    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = setTimeout(() => {
      setShowHint(false);
    }, 2500);

    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => {
      setShowUI(true);
      setShowHint(false);
    }, 10000);
  };

  const handleBackgroundClick = () => {
    if (!showUI) {
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      setShowUI(true);
      setShowHint(false);
    }
  };

  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len >= 4) return 'text-4xl md:text-5xl';
    if (len === 3) return 'text-5xl md:text-6xl';
    return 'text-6xl md:text-7xl';
  };

  const safeAreaTop = 'pt-[env(safe-area-inset-top,20px)]';

  return (
    <>
      <SEOHelmet
        pathname="/"
        keywords={[
          '皇民化運動',
          '日式姓名產生器',
          '改姓運動',
          '日治時期',
          '台灣歷史',
          '1940年代',
          '日本名字',
        ]}
      />

      <div
        className={`h-[100dvh] w-full bg-[#f5f5f4] text-stone-900 font-sans relative flex flex-col overflow-hidden selection:bg-red-900 selection:text-white ${safeAreaTop}`}
        onClick={handleBackgroundClick}
      >
        <SakuraBackground />
        <LookupModal
          surname={state.originalSurname}
          isOpen={showLookup}
          onClose={() => setShowLookup(false)}
          currentSelection={state.japaneseSurname}
          onSelect={handleSelectName}
        />

        {/* Background Decoration Pattern */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.04] z-0">
          <AsanohaPattern />
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-500">
            <div className="bg-stone-50/50 backdrop-blur-sm p-4 rounded-full border border-stone-100 shadow-xl">
              <KamonIcon className="w-12 h-12 text-red-800 animate-spin opacity-80" />
            </div>
          </div>
        )}

        {/* Main Container */}
        <div
          className={`relative z-10 w-full h-full flex flex-col items-center max-w-lg mx-auto transition-all duration-1000 px-5 md:px-0 ${state.step === 'result' ? 'justify-center' : 'justify-start'}`}
        >
          {/* Header */}
          <header
            className={`w-full text-center transition-all duration-700 ease-in-out z-20 shrink-0 ${state.step === 'result' ? (showUI ? 'mt-0 mb-6' : 'mt-0 mb-8') : 'mt-[12vh] md:mt-[15vh]'}`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`transition-all duration-700 ${state.step === 'result' && !showUI ? 'opacity-100 scale-110 mb-4' : 'opacity-100 border-y border-red-900/30 py-1 mb-3'}`}
              >
                <span
                  className={`text-red-900 tracking-[0.3em] font-bold uppercase mx-4 font-serif transition-all flex items-center gap-2 ${state.step === 'result' && !showUI ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}
                >
                  <ToriiIcon className="w-4 h-4 opacity-70" />
                  Taiwan 1940
                  <ToriiIcon className="w-4 h-4 opacity-70" />
                </span>
              </div>

              <h1 className="relative inline-block text-4xl md:text-5xl font-bold font-jp text-red-900 drop-shadow-sm leading-tight transition-all duration-500 opacity-100">
                <span className="block text-lg md:text-xl text-stone-500 tracking-[0.5em] mb-1 font-serif">
                  皇民化改姓運動
                </span>
                姓名<span className="text-red-600">変換</span>所
                <div className="absolute -right-4 -top-2 text-red-800 opacity-20 rotate-12">
                  <KamonIcon className="w-12 h-12" />
                </div>
              </h1>
            </div>
          </header>

          {/* Input Step */}
          {state.step === 'input' && (
            <div
              className={`w-full flex-1 flex flex-col justify-start pt-10 transition-all duration-1000 ease-in-out ${loading ? 'opacity-0 translate-y-[-2rem] scale-95 blur-sm' : 'animate-in slide-in-from-bottom-10 fade-in duration-700'}`}
            >
              <div className="bg-white/90 backdrop-blur-md shadow-2xl shadow-stone-300/50 border border-stone-100 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <SeigaihaPattern />
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-red-600 to-red-900"></div>

                <div className="space-y-8 relative z-10">
                  <div className="group">
                    <label className="block text-stone-500 font-bold mb-3 text-xs tracking-widest uppercase">
                      Surname (Traditional Chinese)
                    </label>
                    <input
                      type="text"
                      maxLength={1}
                      value={state.originalSurname}
                      onChange={handleSurnameChange}
                      placeholder="陳"
                      className="w-full bg-stone-50 border-b-2 border-stone-200 focus:border-red-800 outline-none py-3 text-3xl text-center font-jp text-stone-800 transition-all placeholder:text-stone-300 rounded-t-lg focus:bg-white"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-stone-500 font-bold mb-3 text-xs tracking-widest uppercase flex justify-between">
                      <span>Given Name</span>
                      <span className="text-stone-300 font-normal normal-case">Optional</span>
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={state.originalGivenName}
                      onChange={handleGivenNameChange}
                      placeholder="隨機"
                      className="w-full bg-stone-50 border-b-2 border-stone-200 focus:border-red-800 outline-none py-3 text-2xl text-center font-jp text-stone-800 transition-all placeholder:text-stone-300 rounded-t-lg focus:bg-white"
                    />
                  </div>

                  <button
                    onClick={generateNames}
                    disabled={!state.originalSurname || loading}
                    className="w-full bg-stone-900 hover:bg-red-900 active:scale-[0.98] text-stone-50 font-bold py-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    {loading ? (
                      <span className="flex items-center space-x-2">
                        <span className="tracking-widest">生成中...</span>
                      </span>
                    ) : (
                      <>
                        <DarumaIcon className="w-5 h-5 text-red-500" />
                        <span className="tracking-[0.2em]">改名実行</span>
                        <ChevronRight
                          size={18}
                          className="text-stone-400 group-hover:translate-x-1 transition-transform"
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-center text-stone-400 text-[10px] mt-6 tracking-widest opacity-60">
                本系統依據 1940 年代歷史文獻運算
              </p>
            </div>
          )}

          {/* Result Step */}
          {state.step === 'result' && (
            <div
              className={`w-full flex flex-col justify-center items-center relative shrink-0 transition-all duration-500 ${showUI ? 'pb-8 md:pb-12' : 'pb-0'} animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-1000 ease-out fill-mode-forwards`}
            >
              {/* Main Result Card */}
              <div
                className={`relative w-full transition-all duration-500 ${showUI ? 'scale-100' : 'scale-[1.02]'}`}
              >
                <div className="bg-[#fcfaf7] w-full shadow-2xl relative border-8 border-double border-stone-200 p-6 md:p-10 text-center flex flex-col items-center justify-center rounded-sm ring-1 ring-black/5 overflow-hidden">
                  {/* Card Background Texture */}
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                    <SeigaihaPattern />
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-4 left-4 w-16 h-16 border-t border-l border-red-900/20"></div>
                  <div className="absolute bottom-4 right-4 w-16 h-16 border-b border-r border-red-900/20"></div>
                  <div className="absolute top-4 right-4 text-red-900/10">
                    <KamonIcon className="w-24 h-24 rotate-12" />
                  </div>

                  {/* Generated Name Block */}
                  <div className="relative py-12 w-full border-b border-stone-800/10 mb-8 z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#fcfaf7] px-4 text-red-800">
                      <Flower size={24} fill="currentColor" className="opacity-80" />
                    </div>

                    {/* Vertical Writing Mode Accent */}
                    <div className="absolute left-2 top-10 bottom-10 w-8 border-r border-stone-200 hidden md:flex flex-col items-center justify-center space-y-4 opacity-50">
                      <span className="text-[10px] tracking-widest uppercase writing-vertical-rl text-stone-400 font-serif">
                        Imperial Naming
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="flex flex-wrap justify-center items-end gap-3 md:gap-4">
                        {/* Surname */}
                        <button
                          onClick={showUI ? rerollSurname : undefined}
                          className="group relative text-center px-2"
                        >
                          <span
                            className={`block font-jp font-bold text-red-900 leading-none group-hover:scale-105 transition-transform drop-shadow-sm ${getFontSizeClass(state.japaneseSurname)}`}
                          >
                            {state.japaneseSurname}
                          </span>
                          {showUI && (
                            <span className="absolute -bottom-6 left-0 right-0 text-[10px] text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center">
                              <RefreshCw size={8} className="mr-1" />
                              重骰
                            </span>
                          )}
                        </button>

                        {/* Given Name */}
                        <button
                          onClick={showUI ? rerollGivenName : undefined}
                          className="group relative text-center px-2"
                        >
                          <span
                            className={`block font-jp font-bold text-stone-800 leading-none group-hover:scale-105 transition-transform drop-shadow-sm ${getFontSizeClass(displayGivenName)}`}
                          >
                            {displayGivenName}
                          </span>
                          {showUI && (
                            <span className="absolute -bottom-6 left-0 right-0 text-[10px] text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center">
                              <Dices size={8} className="mr-1" />
                              重骰
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pun Name Section */}
                  <div
                    className={`w-full bg-stone-100/80 p-5 rounded border-l-4 border-l-amber-500 border-stone-200 relative group cursor-pointer hover:bg-amber-50 transition-all text-left flex items-center justify-between shadow-inner z-10 ${!showUI ? 'opacity-90 grayscale-[0.5]' : ''}`}
                    onClick={showUI ? rerollPun : undefined}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-amber-500 text-white px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase tracking-wider">
                          Alias
                        </span>
                        <span className="text-sm text-amber-700 font-bold font-serif tracking-wide">
                          {state.punName.romaji}
                        </span>
                      </div>
                      <div className="text-4xl font-bold text-stone-800 font-jp mb-2 tracking-wide">
                        {state.punName.kanji}
                      </div>

                      <div
                        className={`text-xs text-stone-500 flex items-center font-bold transition-opacity duration-500 ${!showUI ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}
                      >
                        <Sparkles size={12} className="mr-1.5 text-amber-500" />
                        {state.punName.meaning}
                      </div>
                    </div>
                    {showUI && (
                      <div className="text-stone-300 group-hover:text-amber-500 transition-colors pl-4 border-l border-stone-200 ml-4">
                        <RefreshCw size={24} />
                      </div>
                    )}
                  </div>

                  {/* Footer Stamp */}
                  <div className="mt-8 opacity-60 z-10">
                    <div className="border border-red-900 px-4 py-1.5 inline-block">
                      <span className="text-red-900 text-[10px] tracking-[0.3em] font-serif font-bold">
                        令和七年・改名局
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pure Mode Hint Overlay */}
              {showHint && (
                <div className="absolute bottom-[-60px] md:bottom-[-80px] left-0 right-0 flex justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
                  <div className="bg-stone-900/90 backdrop-blur-md text-white px-6 py-2 rounded-full text-xs shadow-xl flex items-center border border-white/10">
                    <ScanEye size={14} className="mr-2 animate-pulse text-red-400" />
                    準備截圖 (介面隱藏10秒)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          {state.step === 'result' && (
            <div
              className={`w-full max-w-sm mx-auto shrink-0 transition-all duration-500 ease-out transform ${showUI ? 'opacity-100 translate-y-0 pb-6' : 'opacity-0 translate-y-10 pointer-events-none h-0 pb-0 overflow-hidden'}`}
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLookup(true);
                  }}
                  className="bg-white border border-stone-200 text-stone-700 py-3.5 rounded-xl font-bold shadow-sm flex items-center justify-center space-x-2 hover:bg-stone-50 hover:border-red-200 hover:text-red-800 transition-all active:scale-[0.97] text-sm group"
                >
                  <BookOpen size={18} className="group-hover:text-red-600 transition-colors" />
                  <span>族譜查證</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUI();
                  }}
                  className="bg-stone-800 text-stone-100 py-3.5 rounded-xl font-bold shadow-lg shadow-stone-400/50 flex items-center justify-center space-x-2 hover:bg-stone-700 transition-all active:scale-[0.97] text-sm"
                >
                  <Camera size={18} />
                  <span>純淨模式</span>
                </button>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setState((prev) => ({
                      ...prev,
                      step: 'input',
                      originalSurname: '',
                      originalGivenName: '',
                    }));
                  }}
                  className="text-stone-400 text-xs py-2 hover:text-stone-600 transition-colors flex items-center"
                >
                  <RefreshCw size={12} className="mr-1.5" />
                  重新測試
                </button>

                <Link
                  to="/about"
                  className="text-stone-400 text-xs py-2 hover:text-red-600 transition-colors flex items-center"
                >
                  <BookOpen size={12} className="mr-1.5" />
                  關於本站
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
