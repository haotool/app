/**
 * Home page for NihonName
 * Main name generator functionality
 * [UI/UX 2025-12-04] 高級和紙質感 + RollingText 動畫 + JapaneseDiceButton
 * [Ref] 參考 nihonname---imperial-surname-generator 的設計
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Camera,
  ChevronRight,
  BookOpen,
  ExternalLink,
  X,
  ScanEye,
  Flower,
  Scroll,
  CheckCircle2,
  RotateCcw,
  ArrowDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClientOnly } from 'vite-react-ssg';
import { SEOHelmet } from '../components/SEOHelmet';
import { RollingText } from '../components/RollingText';
import { JapaneseDiceButton } from '../components/JapaneseDiceButton';
import { ShareModal } from '../components/ShareModal';
import { SURNAME_MAP, FUNNY_NAMES, JAPANESE_GIVEN_NAMES, PRIMARY_SOURCE } from '../constants';
import { getSurnameDetail } from '../data/surnameData';
import { useCustomPunNames } from '../hooks/useCustomPunNames';
import { useEasterEggs } from '../hooks/useEasterEggs';
import { EasterEggs } from '../components/EasterEggs';
import { SourceAccordion } from '../components/SourceAccordion';
import { convertToRomaji } from '../utils/romajiConverter';
import type { GeneratorState, PunName, CustomPunName } from '../types';

// 複姓對照表（複姓 → 對應單姓）
// [context7:taiwan-surnames:2025-12-06] 台灣常見複姓
const COMPOUND_SURNAMES: Record<string, string> = {
  歐陽: '歐',
  司馬: '司',
  司徒: '司',
  上官: '上',
  諸葛: '諸',
  皇甫: '皇',
  東方: '東',
  西門: '西',
  南宮: '南',
  北堂: '北',
  令狐: '令',
  公孫: '公',
  尉遲: '尉',
  長孫: '長',
  慕容: '慕',
  獨孤: '獨',
  宇文: '宇',
  軒轅: '軒',
  鮮于: '鮮',
  呼延: '呼',
  端木: '端',
  百里: '百',
  東郭: '東',
  南門: '南',
  羊舌: '羊',
  微生: '微',
  公冶: '公',
  梁丘: '梁',
  左丘: '左',
  公羊: '公',
  穀梁: '穀',
  公西: '公',
  顓孫: '顓',
  壤駟: '壤',
  公良: '公',
  漆雕: '漆',
  樂正: '樂',
  宰父: '宰',
  夾谷: '夾',
  巫馬: '巫',
  公伯: '公',
  南榮: '南',
  申屠: '申',
  夏侯: '夏',
  鍾離: '鍾',
  段干: '段',
  仲孫: '仲',
  叔孫: '叔',
  閭丘: '閭',
  濮陽: '濮',
  淳于: '淳',
  單于: '單',
  太叔: '太',
  公戶: '公',
  公玉: '公',
  公儀: '公',
  公賓: '公',
  公仲: '公',
  公上: '公',
  公門: '公',
  公山: '公',
  公堅: '公',
  公乘: '公',
  公肩: '公',
  公石: '公',
  公祖: '公',
  第五: '第',
  第一: '第',
  第二: '第',
  第三: '第',
  第四: '第',
};

/**
 * 處理複姓輸入，返回對應的單姓
 * @param input 用戶輸入的姓氏
 * @returns { surname: 用於查詢的姓氏, isCompound: 是否為複姓, originalCompound: 原始複姓 }
 */
const processCompoundSurname = (
  input: string,
): { surname: string; isCompound: boolean; originalCompound: string | null } => {
  const trimmed = input.trim();

  // 檢查是否為複姓
  if (trimmed.length === 2 && COMPOUND_SURNAMES[trimmed]) {
    return {
      surname: COMPOUND_SURNAMES[trimmed],
      isCompound: true,
      originalCompound: trimmed,
    };
  }

  // 非複姓，取第一個字
  return {
    surname: trimmed.substring(0, 1),
    isCompound: false,
    originalCompound: null,
  };
};

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

// Pre-generate static petal data
const SAKURA_PETALS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: (i * 3.33) % 100,
  animationDuration: 8 + (i % 5) * 2.4,
  animationDelay: (i % 8) * 1,
  size: 10 + (i % 6) * 2.5,
  rotation: (i * 36) % 360,
  color: i % 4 === 0 ? '#fda4af' : '#fecdd3',
}));

const SakuraBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {SAKURA_PETALS.map((petal) => (
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
  // 優先使用完整資料，fallback 到簡易對照表
  const surnameDetail = getSurnameDetail(key) ?? getSurnameDetail(key.substring(0, 1));
  const mappedNames: string[] =
    surnameDetail?.names ?? SURNAME_MAP[key] ?? SURNAME_MAP[key.substring(0, 1)] ?? [];
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
          {surnameDetail && (
            <p className="text-xs text-red-200 mt-2 opacity-80">
              共 {surnameDetail.count} 筆歷史記錄
            </p>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 relative bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]">
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

            {/* 展開式來源清單 */}
            {surnameDetail && surnameDetail.sources.length > 0 && (
              <SourceAccordion
                sources={surnameDetail.sources}
                description={surnameDetail.description}
                count={surnameDetail.count}
              />
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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [compoundHint, setCompoundHint] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  // 新增：截圖模式按鈕發光引導（進入結果頁 10 秒後顯示）
  const [showScreenshotGuide, setShowScreenshotGuide] = useState(false);
  const [surnamePlaceholder, setSurnamePlaceholder] = useState('陳 / 歐陽');
  const [placeholderActive, setPlaceholderActive] = useState(true);
  // 搖晃彩蛋授權：進站滿 60 秒後才允許顯示 DeviceMotion 提示
  const [canShowMotionPrompt, setCanShowMotionPrompt] = useState(false);
  const [motionPromptPending, setMotionPromptPending] = useState(false);

  const uiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenshotGuideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeholderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const placeholderSwapRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const motionPromptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 內聯編輯模式狀態
  const [editingField, setEditingField] = useState<'kanji' | 'romaji' | 'meaning' | null>(null);
  const [editKanji, setEditKanji] = useState('');
  const [editRomaji, setEditRomaji] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const kanjiInputRef = useRef<HTMLInputElement>(null);
  const romajiInputRef = useRef<HTMLInputElement>(null);
  const meaningInputRef = useRef<HTMLInputElement>(null);

  // Custom pun names hook
  const { customPunNames, addCustomPunName } = useCustomPunNames();
  // Easter Eggs hook
  const {
    activeEgg,
    handleLogoClick,
    handleDoubleTextClick,
    handleToriiClick,
    requestMotionPermission,
    triggerConfetti,
  } = useEasterEggs();
  // iOS DeviceMotion 權限狀態
  const [hasMotionPermission, setHasMotionPermission] = useState(false);
  const [showMotionPrompt, setShowMotionPrompt] = useState(false);

  // Combined pun names (built-in + custom)
  const allPunNames: PunName[] = [...FUNNY_NAMES, ...customPunNames];
  // 用於 placeholder 的姓氏集合（含單姓與複姓）
  const allSurnames = useMemo(() => {
    const unique = new Set<string>();
    Object.keys(SURNAME_MAP).forEach((key) => unique.add(key));
    Object.keys(COMPOUND_SURNAMES).forEach((key) => unique.add(key));
    return Array.from(unique);
  }, []);

  // 處理漢字輸入變更 - 同時自動更新羅馬拼音
  const handleKanjiChange = (value: string) => {
    setEditKanji(value);
    if (value) {
      const autoRomaji = convertToRomaji(value);
      setEditRomaji(autoRomaji);
    }
  };

  // 開始編輯某個欄位
  const startEditing = (field: 'kanji' | 'romaji' | 'meaning', e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!showUI) return;
    setEditingField(field);
    if (field === 'kanji') {
      setEditKanji(state.punName.kanji);
      setEditRomaji(state.punName.romaji);
      setEditMeaning(''); // 解釋預設空白讓用戶填寫
      setTimeout(() => kanjiInputRef.current?.focus(), 50);
    } else if (field === 'romaji') {
      setEditRomaji(state.punName.romaji);
      setTimeout(() => romajiInputRef.current?.focus(), 50);
    } else if (field === 'meaning') {
      setEditMeaning(''); // 預設空白
      setTimeout(() => meaningInputRef.current?.focus(), 50);
    }
  };

  // 確認編輯
  const confirmEdit = () => {
    if (editingField === 'kanji' && editKanji.trim()) {
      const newPunName: CustomPunName = {
        kanji: editKanji.trim(),
        romaji: editRomaji.trim() || convertToRomaji(editKanji.trim()),
        meaning: editMeaning.trim() || '自訂諧音',
        category: 'custom',
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, punName: newPunName }));
      // 儲存到 localStorage
      addCustomPunName({
        kanji: newPunName.kanji,
        romaji: newPunName.romaji,
        meaning: newPunName.meaning,
      });
    } else if (editingField === 'romaji' && editRomaji.trim()) {
      setState((prev) => ({
        ...prev,
        punName: { ...prev.punName, romaji: editRomaji.trim() },
      }));
    } else if (editingField === 'meaning') {
      setState((prev) => ({
        ...prev,
        punName: { ...prev.punName, meaning: editMeaning.trim() || '自訂諧音' },
      }));
    }
    setEditingField(null);
  };

  // 取消編輯
  const cancelEdit = () => {
    setEditingField(null);
    setEditKanji('');
    setEditRomaji('');
    setEditMeaning('');
  };

  // 處理按鍵事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirmEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // 顯示吐司訊息
  const showToastMessage = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleSurnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setState((prev) => ({ ...prev, originalSurname: value }));

    // 檢查是否為複姓並顯示提示
    if (value.length === 2) {
      if (COMPOUND_SURNAMES[value]) {
        setCompoundHint(`複姓「${value}」將以「${COMPOUND_SURNAMES[value]}」進行改姓查詢`);
      } else {
        setCompoundHint(`輸入兩字時，系統將取第一字「${value.substring(0, 1)}」作為姓氏查詢`);
      }
    } else {
      setCompoundHint(null);
    }
  };

  const handleGivenNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, originalGivenName: e.target.value.trim() }));
  };

  // 動態 placeholder：循環展示收錄的姓氏，僅在輸入框為空時顯示
  useEffect(() => {
    if (!allSurnames.length) return;

    if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
    if (placeholderSwapRef.current) clearTimeout(placeholderSwapRef.current);

    placeholderIntervalRef.current = setInterval(() => {
      if (state.originalSurname) return;
      setPlaceholderActive(false);
      placeholderSwapRef.current = setTimeout(() => {
        setSurnamePlaceholder(getRandom(allSurnames));
        setPlaceholderActive(true);
      }, 150);
    }, 2600);

    return () => {
      if (placeholderIntervalRef.current) clearInterval(placeholderIntervalRef.current);
      if (placeholderSwapRef.current) clearTimeout(placeholderSwapRef.current);
    };
  }, [allSurnames, state.originalSurname]);

  // 進站 60 秒後才允許顯示 DeviceMotion 授權提示，避免一入站即打擾
  useEffect(() => {
    motionPromptTimeoutRef.current = setTimeout(() => setCanShowMotionPrompt(true), 60000);
    return () => {
      if (motionPromptTimeoutRef.current) clearTimeout(motionPromptTimeoutRef.current);
    };
  }, []);

  // 若已進入結果頁但尚未達 60 秒，倒數結束後再顯示提示
  useEffect(() => {
    if (canShowMotionPrompt && motionPromptPending && !hasMotionPermission) {
      setShowMotionPrompt(true);
      setMotionPromptPending(false);
    }
  }, [canShowMotionPrompt, motionPromptPending, hasMotionPermission]);

  const generateNames = () => {
    setLoading(true);

    // 如果沒有輸入姓氏，顯示吐司並使用隨機姓氏
    if (!state.originalSurname) {
      showToastMessage('未填姓氏，隨機抽選');
    }

    setTimeout(() => {
      let key = state.originalSurname;

      // 處理複姓
      if (key) {
        const { surname } = processCompoundSurname(key);
        key = surname;
      }

      // 如果沒有輸入姓氏，使用隨機日本姓氏
      const possibleSurnames = key
        ? (SURNAME_MAP[key] ??
          SURNAME_MAP[key.substring(0, 1)] ?? [
            `${key}山`,
            `${key}田`,
            `${key}本`,
            '田中',
            '佐藤',
            '鈴木',
          ])
        : ['田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '山本', '中村', '小林', '加藤'];

      const jpSurname = getRandom(possibleSurnames);
      const finalGivenName = state.originalGivenName
        ? state.originalGivenName
        : getRandom(JAPANESE_GIVEN_NAMES);
      const pun = getRandom(allPunNames);

      setState((prev) => ({ ...prev, japaneseSurname: jpSurname, punName: pun, step: 'result' }));
      setDisplayGivenName(finalGivenName);
      setLoading(false);

      // 高分諧音梗 (8分以上) 觸發彩帶慶祝效果
      if (pun.funnyScore && pun.funnyScore >= 8) {
        // 延遲一點觸發，讓結果頁動畫先完成
        setTimeout(() => {
          triggerConfetti();
        }, 500);
      }

      // 進入結果頁 10 秒後顯示截圖模式引導
      if (screenshotGuideTimeoutRef.current) clearTimeout(screenshotGuideTimeoutRef.current);
      screenshotGuideTimeoutRef.current = setTimeout(() => {
        setShowScreenshotGuide(true);
      }, 10000);

      // iOS 設備：首次進入結果頁時提示請求 DeviceMotion 權限（用於搖晃彩蛋）
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window && !hasMotionPermission) {
        const requestPermission = (
          DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }
        ).requestPermission;
        if (typeof requestPermission === 'function') {
          // iOS 設備需要用戶授權；僅在進站滿 60 秒後提示
          if (canShowMotionPrompt) {
            setShowMotionPrompt(true);
          } else {
            setMotionPromptPending(true);
          }
        } else {
          // 非 iOS 設備已自動啟用
          setHasMotionPermission(true);
        }
      }
    }, 1000);
  };

  const rerollSurname = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    let key = state.originalSurname;

    // 處理複姓
    if (key) {
      const { surname } = processCompoundSurname(key);
      key = surname;
    }

    const possibleSurnames = key
      ? (SURNAME_MAP[key] ??
        SURNAME_MAP[key.substring(0, 1)] ?? [`${key}山`, `${key}田`, '田中', '佐藤', '鈴木'])
      : ['田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '山本', '中村', '小林', '加藤'];
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
    if (editingField) return; // 編輯中不能隨機
    const newPun = getRandom(allPunNames);
    setState((prev) => ({ ...prev, punName: newPun }));
    // 高分諧音梗 (8分以上) 觸發彩帶慶祝效果
    if (newPun.funnyScore && newPun.funnyScore >= 8) {
      triggerConfetti();
    }
  };

  const toggleUI = () => {
    setShowUI(false);
    setShowHint(true);
    setShowScreenshotGuide(false); // 關閉引導

    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = setTimeout(() => {
      setShowHint(false);
    }, 1000); // 截圖模式提示縮短為 1 秒

    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => {
      setShowUI(true);
      setShowHint(false);
      // 截圖模式結束後自動顯示分享模態窗
      setIsShareModalOpen(true);
    }, 10000); // Restore UI after 10 seconds
  };

  const handleBackgroundClick = () => {
    if (!showUI) {
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      setShowUI(true);
      setShowHint(false);
      // 點擊恢復 UI 後也顯示分享模態窗
      setIsShareModalOpen(true);
    }
  };

  // 姓氏和名字字體大小（姓氏始終 >= 名字）
  const getFontSizeClass = (text: string, isSurname = false) => {
    const len = text.length;
    // 姓氏：統一使用最大字體
    if (isSurname) {
      return 'text-6xl md:text-7xl';
    }
    // 名字：根據長度調整
    if (len >= 4) return 'text-4xl md:text-5xl';
    if (len === 3) return 'text-5xl md:text-6xl';
    return 'text-6xl md:text-7xl';
  };

  const safeAreaTop = 'pt-[env(safe-area-inset-top,20px)]';
  const safeAreaBottom = 'pb-[env(safe-area-inset-bottom,12px)]';

  // 截圖模式引導文案 - 10 種隨機有趣的方式提示用戶點擊
  // 截圖模式引導文案 - 使用 useState lazy initializer 避免 SSG Hydration mismatch
  // [context7:react.dev/reference/react/useState:2025-12-06] useState initializer 只在初始化時執行一次
  // [fix:2025-12-07] 修復 Hydration #418：將隨機文字改為 useEffect 客戶端初始化
  // 避免 SSG 與 CSR 初始值不匹配導致 hydration error
  // [context7:/reactjs/react.dev:hydration-mismatch:2025-12-07]
  const GUIDE_MESSAGES = [
    '📸 點我截圖更好看！',
    '✨ 按下去畫面會更純淨喔～',
    '🎯 截圖模式讓你的名字更閃亮！',
    '👆 點這裡！UI 會暫時隱藏',
    '📷 想分享？先點我讓畫面更乾淨',
    '🌸 截圖模式讓你的名字像藝術品',
    '💫 按我！10 秒後自動恢復',
    '🎨 截圖模式 = 純淨背景 + 美美名字',
    '👉 點擊後截圖，效果超讚！',
    '✨ 讓你的日本名字更上相！',
  ];
  const HINT_MESSAGES = [
    '點擊任意處恢復介面 👆',
    '截圖完成？點一下恢復 ✨',
    '10 秒後自動恢復，或點擊任意處',
  ];

  // 使用固定初始值，客戶端 hydration 後再隨機
  const [randomGuideMsg, setRandomGuideMsg] = useState(GUIDE_MESSAGES[0] ?? '');
  const [randomHintMsg, setRandomHintMsg] = useState(HINT_MESSAGES[0] ?? '');

  // 客戶端 hydration 完成後再設定隨機值
  useEffect(() => {
    setRandomGuideMsg(GUIDE_MESSAGES[Math.floor(Math.random() * GUIDE_MESSAGES.length)] ?? '');
    setRandomHintMsg(HINT_MESSAGES[Math.floor(Math.random() * HINT_MESSAGES.length)] ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 僅在 mount 時執行一次
  }, []);

  return (
    <>
      <SEOHelmet
        pathname="/"
        title="皇民化改姓生成器 - 日治時期台灣姓名對照"
        description="探索1940年代台灣皇民化運動的歷史。根據國史館檔案、學術論文等多方歷史文獻，收錄90+漢姓、1,700+筆日本姓氏對照記錄，每筆皆標註變異法說明與來源。"
        keywords={[
          '皇民化運動',
          '日式姓名產生器',
          '改姓運動',
          '日治時期',
          '台灣歷史',
          '1940年代',
          '日本名字',
          '姓氏對照',
          '內地式改姓名',
          '臺灣總督府',
        ]}
      />
      {/* [fix:2025-12-06] JSON-LD (homeJsonLd) 已移至 vite.config.ts onPageRendered hook */}

      {/* [fix:2025-12-07] 使用 ClientOnly 包裝 EasterEggs 避免 Hydration #418 錯誤 */}
      {/* [context7:/daydreamer-riri/vite-react-ssg:ClientOnly:2025-12-07] */}
      <ClientOnly>{() => <EasterEggs activeEgg={activeEgg} />}</ClientOnly>

      {/* iOS DeviceMotion 權限請求提示 */}
      {showMotionPrompt && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowMotionPrompt(false)}
        >
          <div
            className="bg-[#fcfaf7] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-red-900 to-red-950 p-6 text-center">
              <div className="text-5xl mb-3">📱</div>
              <h3 className="text-xl font-bold text-white font-jp">啟用搖晃彩蛋</h3>
              <p className="text-sm text-red-200 mt-1">搖晃手機觸發花火大會！</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-600 text-center">
                允許動態感測器權限，即可透過搖晃手機觸發隱藏彩蛋 🎆
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMotionPrompt(false)}
                  className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 transition-colors"
                >
                  稍後
                </button>
                <button
                  onClick={() => {
                    void requestMotionPermission().then((granted) => {
                      setHasMotionPermission(granted);
                      setShowMotionPrompt(false);
                    });
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-900 text-white font-bold hover:bg-red-800 transition-colors"
                >
                  允許
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        surname={state.originalSurname}
        japaneseSurname={state.japaneseSurname}
        japaneseGivenName={displayGivenName}
        punName={state.punName.kanji}
      />

      <div
        className={`min-h-[100dvh] h-[100dvh] w-full bg-[#f5f5f4] text-stone-900 font-sans relative flex flex-col overflow-x-hidden overflow-y-auto selection:bg-red-900 selection:text-white ${safeAreaTop}`}
        onClick={handleBackgroundClick}
      >
        {/* 日式吐司訊息 */}
        {showToast && (
          <div className="fixed left-1/2 -translate-x-1/2 z-[200] bottom-[calc(1.5rem+env(safe-area-inset-bottom,12px))] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
            <div className="bg-red-900/90 backdrop-blur-md text-amber-50 px-6 py-3 rounded-full text-sm shadow-[0_8px_20px_-6px_rgba(127,29,29,0.45)] flex items-center border border-red-200/50 ring-1 ring-red-200/40">
              <Flower size={16} className="mr-2 text-amber-200" />
              {toastMessage}
            </div>
          </div>
        )}
        <SakuraBackground />
        <LookupModal
          surname={state.originalSurname}
          isOpen={showLookup}
          onClose={() => setShowLookup(false)}
          currentSelection={state.japaneseSurname}
          onSelect={handleSelectName}
        />

        {/* Background Decoration Pattern */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] z-0">
          <SeigaihaPattern />
        </div>

        {/* Main Container */}
        {/* [fix:2025-12-04] 優化 RWD 佈局：
            - 使用 flex-1 + justify-center 實現垂直置中
            - 所有頁面內容統一垂直置中
            - 內容緊湊綁定，上下自動留白
        */}
        <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center max-w-lg mx-auto transition-all duration-500 px-5 md:px-0 py-4">
          {/* Header */}
          {/* [fix:2025-12-04] 移除固定 margin，使用 flex 置中 */}
          <header
            className={`w-full text-center transition-all duration-700 ease-in-out z-20 shrink-0 ${
              state.step === 'result' ? (showUI ? 'mb-4' : 'mb-6') : 'mb-6' // 輸入頁：與表單的間距
            }`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`transition-all duration-700 ${state.step === 'result' && !showUI ? 'opacity-100 scale-110 mb-4' : 'opacity-100 border-y border-red-900/30 py-1 mb-3'}`}
              >
                <button
                  type="button"
                  className={`text-red-900 tracking-[0.3em] font-bold uppercase mx-4 font-serif transition-all flex items-center gap-2 ${state.step === 'result' && !showUI ? 'text-sm md:text-base' : 'text-xs md:text-sm'} select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 rounded-md px-2 active:scale-[0.98]`}
                  onClick={handleDoubleTextClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleDoubleTextClick();
                    }
                  }}
                >
                  <ToriiIcon className="w-4 h-4 opacity-70" />
                  Taiwan 1940
                  <ToriiIcon className="w-4 h-4 opacity-70" />
                </button>
              </div>

              <h1
                className="relative inline-block text-4xl md:text-5xl font-bold font-jp text-red-900 drop-shadow-sm leading-tight transition-all duration-500 opacity-100 cursor-pointer"
                onClick={handleLogoClick}
              >
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
            <div className="w-full flex flex-col justify-start animate-in slide-in-from-bottom-10 fade-in duration-700">
              <div className="bg-white/90 backdrop-blur-md shadow-2xl shadow-stone-300/50 border border-stone-100 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <SeigaihaPattern />
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-red-600 to-red-900"></div>

                <div className="space-y-8 relative z-10">
                  <div className="group relative">
                    <label
                      htmlFor="surname-input"
                      className="block text-stone-500 font-bold mb-3 text-xs tracking-widest uppercase flex justify-between"
                    >
                      <span>Surname (Traditional Chinese)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-0 rounded-t-lg bg-stone-50 border-b-2 border-stone-200 transition-colors duration-300 group-focus-within:border-red-800"></div>
                      {!state.originalSurname && (
                        <div
                          className={`absolute inset-0 flex items-center justify-center text-3xl font-jp text-stone-300 pointer-events-none select-none transition-all duration-500 ease-out ${
                            placeholderActive
                              ? 'opacity-80 translate-y-0'
                              : 'opacity-0 translate-y-1'
                          }`}
                        >
                          {surnamePlaceholder}
                        </div>
                      )}
                      <input
                        id="surname-input"
                        type="text"
                        maxLength={2}
                        value={state.originalSurname}
                        onChange={handleSurnameChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !loading) {
                            generateNames();
                          }
                        }}
                        placeholder={surnamePlaceholder}
                        className="relative z-10 w-full bg-transparent border-none outline-none py-3 text-3xl text-center font-jp text-stone-800 transition-all rounded-t-lg focus:bg-white/60"
                      />
                    </div>
                    {/* 複姓提示 */}
                    {compoundHint && (
                      <p className="text-xs text-amber-600 mt-2 text-center animate-in fade-in duration-300">
                        💡 {compoundHint}
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label
                      htmlFor="given-name-input"
                      className="block text-stone-500 font-bold mb-3 text-xs tracking-widest uppercase flex justify-between"
                    >
                      <span>Given Name</span>
                      {/* [Modified: Optional -> 選填] */}
                      <span className="text-stone-300 font-normal normal-case">選填</span>
                    </label>
                    <input
                      id="given-name-input"
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
                    disabled={loading}
                    className="w-full bg-stone-900 hover:bg-red-900 active:scale-[0.98] text-stone-50 font-bold py-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    {loading ? (
                      <KamonIcon className="w-6 h-6 animate-spin text-stone-400" />
                    ) : (
                      <>
                        <Flower size={18} className="text-red-500" />
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
          {/* [fix:2025-12-04] 優化結果頁面佈局：
              - 內容緊湊綁定，減少元素間距
              - 確保所有手機尺寸正確顯示
          */}
          {state.step === 'result' && (
            <div
              className={`w-full flex flex-col justify-center items-center relative min-h-0 transition-all duration-500`}
            >
              {/* Main Result Card - 和紙質感 */}
              {/* [fix:2025-12-04] 優化卡片樣式：
                  - 使用 max-h 限制最大高度
                  - 減少 padding 在小螢幕上的空間佔用
                  - 確保卡片不會超出視窗
              */}
              <div
                className={`relative w-full transition-all duration-500 ease-out ${showUI ? 'scale-100' : 'scale-[1.02]'}`}
              >
                <div className="bg-[#fcfaf7] w-full shadow-2xl relative border-8 border-double border-stone-200 p-5 md:p-8 text-center flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] rounded-sm animate-in zoom-in-95 duration-700 ring-1 ring-black/5">
                  {/* Corner Decorations */}
                  <div className="absolute top-4 left-4 w-16 h-16 border-t border-l border-red-900/20"></div>
                  <div className="absolute bottom-4 right-4 w-16 h-16 border-b border-r border-red-900/20"></div>
                  <div className="absolute top-4 right-4 text-red-900/10">
                    <KamonIcon className="w-24 h-24 rotate-12" />
                  </div>

                  {/* Generated Name Block */}
                  {/* [fix:2025-12-04] 減少垂直 padding 適配小螢幕 */}
                  <div className="relative py-6 md:py-10 w-full border-b border-stone-800/10 mb-4 md:mb-6">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#fcfaf7] px-4 text-red-800">
                      <Flower size={24} fill="currentColor" className="opacity-80" />
                    </div>

                    {/* Vertical Writing Mode Accent */}
                    <div className="absolute left-2 top-10 bottom-10 w-8 border-r border-stone-200 hidden md:flex flex-col items-center justify-center space-y-4 opacity-50">
                      <span className="text-[10px] tracking-widest uppercase writing-vertical-rl text-stone-400 font-serif">
                        Imperial Naming
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      {/* 日文姓名 - 不換行 */}
                      <div className="flex justify-center items-end gap-2 md:gap-3 relative whitespace-nowrap">
                        {/* Surname - 點擊文字直接改姓 */}
                        <div className="group relative text-center flex flex-col items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (showUI) rerollSurname();
                            }}
                            className={`block font-jp font-bold text-red-900 leading-none drop-shadow-sm transition-all hover:scale-105 cursor-pointer ${getFontSizeClass(state.japaneseSurname, true)}`}
                          >
                            <RollingText text={state.japaneseSurname} />
                          </button>
                        </div>

                        {/* Given Name - 點擊文字直接改名 */}
                        <div className="group relative text-center flex flex-col items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (showUI) rerollGivenName();
                            }}
                            className={`block font-jp font-bold text-stone-800 leading-none drop-shadow-sm transition-all hover:scale-105 cursor-pointer ${getFontSizeClass(displayGivenName, false)}`}
                          >
                            <RollingText text={displayGivenName} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pun Name Section - 點擊文字編輯，點擊骰子隨機 */}
                  {/* [UI/UX 2025-12-04] 保留諧音區塊和骰子，隱藏解釋文字（因常有錯誤） */}
                  <div
                    className={`w-full bg-stone-100/80 p-5 rounded border-l-4 border-l-amber-500 border-stone-200 relative group transition-all text-left flex items-center justify-between shadow-inner ${!showUI ? 'opacity-90 grayscale-[0.5]' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex-1">
                      {/* 羅馬拼音區 - 置左對齊 */}
                      <div className="flex items-center space-x-2 mb-2">
                        {/* [Modified: Alias -> Kuso] */}
                        <span className="bg-amber-500 text-white px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase tracking-wider">
                          Kuso
                        </span>
                        {/* 羅馬拼音 - 可點擊編輯 */}
                        {editingField === 'romaji' ? (
                          <input
                            ref={romajiInputRef}
                            type="text"
                            value={editRomaji}
                            onChange={(e) => setEditRomaji(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={confirmEdit}
                            className="text-sm text-amber-700 font-bold font-serif tracking-wide bg-white border border-amber-300 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-amber-200 text-left"
                            placeholder="羅馬拼音"
                          />
                        ) : (
                          <button
                            onClick={(e) => startEditing('romaji', e)}
                            className="text-sm text-amber-700 font-bold font-serif tracking-wide hover:bg-amber-100 px-2 py-0.5 rounded transition-colors cursor-text text-left"
                            title="點擊編輯羅馬拼音"
                          >
                            <RollingText text={state.punName.romaji} />
                          </button>
                        )}
                      </div>

                      {/* 漢字名 - 可點擊編輯 */}
                      {editingField === 'kanji' ? (
                        <div className="space-y-2 mb-2">
                          <input
                            ref={kanjiInputRef}
                            type="text"
                            value={editKanji}
                            onChange={(e) => handleKanjiChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="text-3xl font-bold text-stone-800 font-jp tracking-wide bg-white border border-amber-300 rounded px-3 py-1 outline-none focus:ring-2 focus:ring-amber-200 w-full"
                            placeholder="輸入日文漢字"
                          />
                          <div className="text-xs text-stone-400">
                            羅馬拼音：
                            <span className="text-amber-600">{editRomaji || '自動轉換中...'}</span>
                          </div>
                          <input
                            ref={meaningInputRef}
                            type="text"
                            value={editMeaning}
                            onChange={(e) => setEditMeaning(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="text-sm text-stone-600 bg-white border border-stone-200 rounded px-3 py-1.5 outline-none focus:ring-2 focus:ring-amber-200 w-full"
                            placeholder="輸入諧音解釋（選填）"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={confirmEdit}
                              className="flex-1 bg-amber-500 text-white text-xs py-1.5 rounded hover:bg-amber-600 transition-colors"
                            >
                              確認
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 bg-stone-200 text-stone-600 text-xs py-1.5 rounded hover:bg-stone-300 transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => startEditing('kanji', e)}
                          className="text-4xl font-bold text-stone-800 font-jp mb-2 tracking-wide hover:bg-amber-100/50 px-2 py-1 -mx-2 rounded transition-colors cursor-text block"
                          title="點擊自訂諧音名"
                        >
                          <RollingText text={state.punName.kanji} />
                        </button>
                      )}
                    </div>

                    {/* 骰子按鈕 - 點擊隨機換名 */}
                    {showUI && !editingField && (
                      <div className="pl-4 border-l border-stone-200 ml-4 flex flex-col items-center">
                        <JapaneseDiceButton onClick={rerollPun} label="諧音" size="md" />
                      </div>
                    )}
                  </div>

                  {/* Footer Stamp */}
                  <div className="mt-6 opacity-60 cursor-pointer" onClick={handleToriiClick}>
                    <div className="border border-red-900 px-4 py-1.5 inline-block">
                      <span className="text-red-900 text-[10px] tracking-[0.3em] font-serif font-bold">
                        令和七年・改名局
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pure Mode Hint Overlay - 截圖模式啟動後的提示 */}
              {showHint && (
                <div className="absolute bottom-[-120px] left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-50 animate-in fade-in zoom-in duration-500">
                  {/* Main Badge */}
                  <div className="bg-red-900/95 backdrop-blur-md text-amber-50 px-6 py-3 rounded-2xl text-sm shadow-2xl flex items-center gap-3 border border-red-200/30">
                    <ScanEye size={18} className="animate-pulse text-amber-200" />
                    <div className="flex flex-col">
                      <span className="font-bold">純淨截圖模式</span>
                      <span className="text-xs text-red-200">{randomHintMsg}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          {state.step === 'result' && (
            <div
              className={`w-full max-w-sm mx-auto shrink-0 transition-all duration-500 ease-out transform mt-4 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none h-0 overflow-hidden'} ${safeAreaBottom}`}
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

                <div className="relative">
                  {/* 截圖模式引導箭頭和文案 */}
                  {showScreenshotGuide && (
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex flex-col items-center animate-in fade-in zoom-in duration-500 z-50">
                      <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap mb-2">
                        {randomGuideMsg}
                      </div>
                      <ArrowDown
                        size={28}
                        className="text-amber-500 animate-bounce drop-shadow-lg"
                      />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowScreenshotGuide(false);
                      toggleUI();
                    }}
                    className={`w-full bg-red-900 text-red-50 py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2 hover:bg-red-800 transition-all active:scale-[0.97] text-sm relative overflow-hidden group ${showScreenshotGuide ? 'ring-4 ring-red-500 ring-offset-2 animate-glow' : 'shadow-red-400/30'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-700/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <Camera size={18} className="relative z-10" />
                    <span className="relative z-10">截圖模式</span>
                  </button>
                  <style>{`
                    @keyframes glow {
                      0%, 100% { box-shadow: 0 0 6px rgba(185, 28, 28, 0.55), 0 0 18px rgba(220, 38, 38, 0.35); }
                      50% { box-shadow: 0 0 18px rgba(185, 28, 28, 0.75), 0 0 36px rgba(220, 38, 38, 0.45); }
                    }
                    .animate-glow {
                      animation: glow 1.5s ease-in-out infinite;
                    }
                  `}</style>
                </div>
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
                  <RotateCcw size={12} className="mr-1.5" />
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

          {/* Minimal Footer - 日式簡約風格 */}
          {/* [fix:2025-12-04] Footer 與主內容綁定，統一間距 */}
          <footer className="w-full shrink-0 py-3 text-center mt-4">
            <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400">
              <a
                href="https://haotool.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                haotool 好工具
              </a>
              <span className="text-stone-300">·</span>
              <span>作者：阿璋</span>
              <span className="text-stone-300">·</span>
              <a
                href="https://www.threads.com/@azlife_1224/post/DR2NCeEj6Fo?xmt=AQF0K8pg5PLpzoBz7nnYMEI2CdxVzs2pUyIJHabwZWeYCw"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                @azlife_1224
              </a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
