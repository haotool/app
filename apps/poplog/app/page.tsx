'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import {
  Moon,
  Sun,
  BarChart3,
  ListChecks,
  Upload,
  Download,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Share2,
  Pencil,
  Info,
} from 'lucide-react';

/**
 * Q 版便便記錄器 v4.1 — UI/UX 行動優化改版
 * 變更點摘要：
 * 1) 輸入欄：可編輯底色、動畫 placeholder、可見焦點。
 * 2) 編輯流程：刪除移入編輯 Modal（避免誤觸）。
 * 3) 次要文字：移至卡片下方並調整行高。
 * 4) 型態按鈕：Icon 上 / Label 下，容器等間距自動換行，動態 padding。
 * 5) 趨勢操作列：週趨勢 / 日次數 / 週報圖卡合併為統一操作列，置於圖表上。
 * 6) 行動優先：單欄卡片堆疊、圓角 2xl、柔和陰影、觸控大小 >= 44px。
 * 7) 頁底：品牌 + 版本 + 建立時間提示 + 版權 + 作者連結。
 */

/** Design Tokens */
const THEME = {
  light: {
    primary: '#6D4C41',
    onPrimary: '#fff',
    primaryContainer: '#F3E9E3',
    onPrimaryContainer: '#4E342E',
    surface: '#FFFBF6',
    surfaceAlt: '#FFF6EC',
    onSurface: '#2c2c2c',
    onSurfaceVariant: '#6b6b6b',
    outline: '#E5DAD2',
  },
  dark: {
    primary: '#D7CCC8',
    onPrimary: '#3E2723',
    primaryContainer: '#3E2F2A',
    onPrimaryContainer: '#F3E9E3',
    surface: '#1a1513',
    surfaceAlt: '#221A18',
    onSurface: '#ECDFDB',
    onSurfaceVariant: '#B9AFAA',
    outline: '#3E332F',
  },
  elevation: {
    1: '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)',
    2: '0 4px 12px rgba(0,0,0,.12)',
    3: '0 10px 30px rgba(0,0,0,.18)',
  },
} as const;

const APP_VERSION = 'v4.1.0';

/** LocalStorage Keys */
const KEY_RECORDS = 'poop.v4.records';
const KEY_THEME = 'poop.v4.theme'; // light | dark
const KEY_LAST_TYPE = 'poop.v4.lastType'; // 1..5
const KEY_QUICK = 'poop.v4.quick'; // on | off

/** 5 種狀態（精簡文案） */
const TYPES: { id: 1 | 2 | 3 | 4 | 5; name: string; hint: string; good?: boolean }[] = [
  { id: 1, name: '偏硬', hint: '多水多纖' },
  { id: 2, name: '理想', hint: '保持', good: true },
  { id: 3, name: '稍軟', hint: '少油少辣' },
  { id: 4, name: '糊狀', hint: '腸胃休息' },
  { id: 5, name: '水樣', hint: '補水就醫?' },
];

/** 可愛品牌 Logo */
const BrandPoop: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <defs>
      <linearGradient id="gp1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8D6E63" />
        <stop offset="100%" stopColor="#6D4C41" />
      </linearGradient>
    </defs>
    <path
      d="M20 34c0-8 8-10 12-18 4 8 12 10 12 18 0 10-24 10-24 0z"
      fill="url(#gp1)"
      stroke="#3E2723"
      strokeWidth="2"
    />
    <ellipse cx="32" cy="44" rx="18" ry="10" fill="url(#gp1)" stroke="#3E2723" strokeWidth="2" />
    <circle cx="26" cy="40" r="2" fill="#fff" />
    <circle cx="38" cy="40" r="2" fill="#fff" />
    <path
      d="M26 47c4 3 8 3 12 0"
      stroke="#3E2723"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

/** 可愛圖示（依型態） */
const CuteIcon: React.FC<{ t: 1 | 2 | 3 | 4 | 5; size?: number; stacked?: boolean }> = ({
  t,
  size = 24,
  stacked,
}) => {
  const base = ['#8B5E3C', '#B57E50', '#C68B59', '#D39A64', '#E5A86E'][t - 1];
  const stroke = '#3E2723';
  const s = stacked
    ? { filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.18))', transform: 'translateY(-2px)' }
    : { filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.18))' };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={s} aria-hidden>
      <defs>
        <linearGradient id={`g${t}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={base} stopOpacity=".95" />
          <stop offset="100%" stopColor={base} stopOpacity=".8" />
        </linearGradient>
      </defs>
      {t === 1 && (
        <g>
          {Array.from({ length: 7 }).map((_, i) => {
            const cx = 10 + i * 7 + (i % 2 ? 0 : 2);
            const cy = 40 + (i % 3 === 0 ? -4 : 0);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={4}
                fill={`url(#g${t})`}
                stroke={stroke}
                strokeWidth="1.5"
              />
            );
          })}
        </g>
      )}
      {t === 2 && (
        <path
          d="M6 36c3-10 14-16 26-16s20 6 26 16-10 18-26 18S3 46 6 36z"
          fill={`url(#g${t})`}
          stroke={stroke}
          strokeWidth="2"
        />
      )}
      {t === 3 && (
        <g>
          <path
            d="M6 36c3-10 14-16 26-16s20 6 26 16-10 18-26 18S3 46 6 36z"
            fill={`url(#g${t})`}
            stroke={stroke}
            strokeWidth="2"
          />
          <path
            d="M12 40c8-6 20-10 40-8M10 34c10-6 26-8 44-4"
            stroke="#3b2c28"
            strokeWidth="2"
            opacity=".6"
          />
        </g>
      )}
      {t === 4 && (
        <path
          d="M8 40c6-10 32-8 44-2-8 8-30 16-44 2z"
          fill={`url(#g${t})`}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {t === 5 && (
        <g>
          <path d="M6 42c8-6 22-6 28 0 8 6 16 6 24 0" stroke={stroke} strokeWidth="2" fill="none" />
          <path
            d="M6 46c8-6 22-6 28 0 8 6 16 6 24 0"
            stroke={`url(#g${t})`}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
};

/** ---- 解析：時間/日期 ---- */
const zhMap: Record<string, number> = {
  零: 0,
  〇: 0,
  '○': 0,
  一: 1,
  二: 2,
  兩: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};
const zhNumToInt = (s: string): number | null => {
  if (!s) return null;
  if (s.length === 1 && zhMap[s] !== undefined) return zhMap[s];
  const ten = s.indexOf('十');
  if (ten >= 0) {
    const L = s.slice(0, ten),
      R = s.slice(ten + 1);
    const tens = L ? (zhMap[L] ?? 0) : 1;
    const ones = R ? (zhMap[R] ?? 0) : 0;
    return tens * 10 + ones;
  }
  const ok = s
    .split('')
    .map((c) => zhMap[c])
    .every((v) => v !== undefined);
  if (!ok) return null;
  return Number(
    s
      .split('')
      .map((c) => zhMap[c])
      .join(''),
  );
};
const N = (s: string) =>
  s
    .replace(/：/g, ':')
    .replace(/[．。•·‧]/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
function parseTimeToken(raw: string) {
  let s = N(raw);
  const hint = /上午|下午|晚上|早上|清晨|凌晨|am|pm/i.exec(s)?.[0]?.toLowerCase();
  const isPM = !!hint && /(下午|晚上|pm)/.test(hint);
  const isAM = !!hint && /(上午|早上|清晨|凌晨|am)/.test(hint);
  let m = s.match(/(\d{1,2})\s*:\s*(\d{1,2})/);
  if (m) {
    let h = +m[1],
      mm = +m[2];
    if (/半/.test(s)) mm = 30;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return { h, m: Math.min(Math.max(mm, 0), 59) };
  }
  m = s.match(/(\d{1,2})\s*(?:[.:：])?\s*半/);
  if (m) {
    let h = +m[1];
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return { h, m: 30 };
  }
  m = s.match(/\b(\d{1,2})\.(\d{1,2})\b/);
  if (m) {
    let h = +m[1],
      frac = m[2],
      mm = frac.length >= 2 ? +frac.slice(0, 2) : Math.round(parseFloat('0.' + frac) * 60);
    if (/半/.test(s)) mm = 30;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return { h, m: Math.min(Math.max(mm, 0), 59) };
  }
  const cm = s.match(
    /(上午|下午|晚上|早上|清晨|凌晨)?\s*([零〇○一二兩三四五六七八九十]{1,3})點(?:(半)|([零〇○一二兩三四五六七八九十]{1,3})分?)?/,
  );
  if (cm) {
    const h0 = zhNumToInt(cm[2] || '') ?? 0;
    let h = h0,
      mm = cm[3] ? 30 : cm[4] ? (zhNumToInt(cm[4] || '') ?? 0) : 0;
    const pm = /(下午|晚上)/.test(cm[1] || '') || isPM,
      am = /(上午|早上|清晨|凌晨)/.test(cm[1] || '') || isAM;
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    return { h, m: Math.min(Math.max(mm, 0), 59) };
  }
  m = s.match(/\b(\d{1,2})\s*(am|pm)?\b/i);
  if (m) {
    let h = +m[1],
      mm = 0;
    const suf = m[2]?.toLowerCase();
    if (suf === 'pm' || isPM) {
      if (h < 12) h += 12;
    } else if (suf === 'am' || isAM) {
      if (h === 12) h = 0;
    }
    return { h, m: mm };
  }
  return null;
}
function parseDateToken(raw: string, base: Date) {
  const s = N(raw).replace(/[年]/g, '/').replace(/月/g, '/').replace(/日/g, '');
  let m = s.match(/\b(\d{4})\/(\d{1,2})\/(\d{1,2})\b/);
  if (m) return { y: +m[1], mo: +m[2], d: +m[3] };
  m = s.match(/\b(\d{1,2})[\/-](\d{1,2})\b/);
  if (m) return { y: base.getFullYear(), mo: +m[1], d: +m[2] };
  m = s.match(/\b(\d{1,2})\s*月\s*(\d{1,2})\b/);
  if (m) return { y: base.getFullYear(), mo: +m[1], d: +m[2] };
  return null;
}

/** Types */
interface PoopRecord {
  id: string;
  iso: string;
  type: 1 | 2 | 3 | 4 | 5 | null;
  source?: 'import' | 'manual' | 'quick' | 'sample';
  ephemeral?: boolean;
}

/** Helpers */
const toDateKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);
const fmtHM = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const getCurrentMonthKey = () => {
  const d = new Date();
  return monthKey(d);
};
const parseNotebook = (text: string, base = new Date()) => {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  let cur = base;
  for (const raw of lines) {
    const dd = parseDateToken(raw, cur);
    if (dd) cur = new Date(dd.y, dd.mo - 1, dd.d);
    const tt = parseTimeToken(raw);
    if (!tt) continue;
    const dt = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), tt.h, tt.m, 0, 0);
    out.push(dt.toISOString());
  }
  return out;
};

/** Sample generator（100~150 天） */
function genSample(kind: 'normal' | 'abnormal' | 'over'): PoopRecord[] {
  const days = 100 + Math.floor(Math.random() * 51); // 100~150
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - days + 1);
  const rs: PoopRecord[] = [];
  const R = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
  for (let i = 0; i < days; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    let cnt = 1;
    const r = Math.random();
    if (kind === 'normal') {
      if (r < 0.1) cnt = 0;
      else if (r < 0.85) cnt = 1;
      else if (r < 0.97) cnt = 2;
      else cnt = 3;
    } else if (kind === 'abnormal') {
      if (r < 0.55) cnt = 0;
      else if (r < 0.9) cnt = 1;
      else cnt = 2;
    } else {
      if (r < 0.15) cnt = 2;
      else if (r < 0.7) cnt = 3;
      else if (r < 0.9) cnt = 4;
      else cnt = 5 + (Math.random() < 0.4 ? 1 : 0);
    }
    for (let j = 0; j < cnt; j++) {
      const bucket = Math.random();
      let h = 8,
        m = R(0, 59);
      if (bucket < 0.45) h = R(6, 10);
      else if (bucket < 0.6) h = R(12, 14);
      else {
        h = R(18, 23);
        if (h === 23) m = R(0, 50);
      }
      let t: 1 | 2 | 3 | 4 | 5 = 2;
      const r2 = Math.random();
      if (kind === 'normal') t = r2 < 0.54 ? 2 : r2 < 0.75 ? 3 : r2 < 0.86 ? 1 : r2 < 0.95 ? 4 : 5;
      else if (kind === 'abnormal')
        t = r2 < 0.5 ? 1 : r2 < 0.7 ? 2 : r2 < 0.85 ? 3 : r2 < 0.95 ? 4 : 5;
      else t = r2 < 0.15 ? 2 : r2 < 0.35 ? 3 : r2 < 0.7 ? 4 : 5;
      const dt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
      rs.push({
        id: `s-${kind}-${i}-${j}`,
        iso: dt.toISOString(),
        type: t,
        source: 'sample',
        ephemeral: true,
      });
    }
  }
  return rs.sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());
}

/** 背景（柔和） */
const Bg: React.FC<{ dark: boolean }> = ({ dark }) => (
  <div aria-hidden className="fixed inset-0 -z-10">
    <div
      className="absolute inset-0"
      style={{
        background: dark
          ? 'radial-gradient(1000px 500px at 80% -10%, rgba(216,180,254,.12), transparent), radial-gradient(900px 450px at -10% 100%, rgba(147,197,253,.1), transparent), linear-gradient(180deg,#1a1513 0%,#221a18 60%,#1a1513 100%)'
          : 'radial-gradient(1000px 500px at 80% -10%, rgba(255,203,164,.25), transparent), radial-gradient(900px 450px at -10% 100%, rgba(255,240,210,.35), transparent), linear-gradient(180deg,#FFF7ED 0%, #FFECDD 60%, #FFE3CC 100%)',
      }}
    />
  </div>
);

/** Animated Placeholder（以淡入淡出輪播多種格式） */
const AnimatedHint: React.FC<{ active: boolean; samples: string[]; color: string }> = ({
  active,
  samples,
  color,
}) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % samples.length), 2200);
    return () => clearInterval(t);
  }, [active, samples.length]);
  return (
    <AnimatePresence mode="wait">
      {active && (
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 0.8, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none absolute left-10 right-28 top-1/2 -translate-y-1/2 text-sm"
          style={{ color }}
        >
          {samples[idx]}
        </motion.span>
      )}
    </AnimatePresence>
  );
};

export default function Page() {
  // SSR 安全：mounted 狀態追蹤
  const [mounted, setMounted] = useState(false);

  // theme (預設淺色，記憶切換) - SSR 安全初始化
  const [dark, setDark] = useState<boolean>(false);

  // main states - SSR 安全初始化
  const [mode, setMode] = useState<'log' | 'analysis'>('log');
  const [records, setRecords] = useState<PoopRecord[]>([]);

  // quick mode & last type - SSR 安全初始化
  const [quick, setQuick] = useState<'on' | 'off'>('off');
  const [lastType, setLastType] = useState<1 | 2 | 3 | 4 | 5>(2);

  // 客戶端 mount 後從 localStorage 讀取數據
  useEffect(() => {
    setMounted(true);
    try {
      // 讀取 theme
      const themeValue = localStorage.getItem(KEY_THEME);
      if (themeValue === 'dark') setDark(true);

      // 讀取 records
      const recordsRaw = localStorage.getItem(KEY_RECORDS);
      if (recordsRaw) {
        const parsed = JSON.parse(recordsRaw);
        setRecords(parsed);
      }

      // 讀取 quick mode
      const quickValue = localStorage.getItem(KEY_QUICK);
      if (quickValue === 'on') setQuick('on');

      // 讀取 lastType
      const lastTypeValue = localStorage.getItem(KEY_LAST_TYPE);
      if (lastTypeValue) {
        const num = Number(lastTypeValue);
        if (num >= 1 && num <= 5) setLastType(num as 1 | 2 | 3 | 4 | 5);
      }
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
    }
  }, []);

  // 保存 theme 變更
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(KEY_THEME, dark ? 'dark' : 'light');
    } catch {}
  }, [dark, mounted]);

  // 僅保存非臨時資料
  useEffect(() => {
    if (!mounted) return;
    try {
      const keep = records.filter((r) => !r.ephemeral);
      localStorage.setItem(KEY_RECORDS, JSON.stringify(keep));
    } catch {}
  }, [records, mounted]);

  // 保存 quick mode 變更
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(KEY_QUICK, quick);
    } catch {}
  }, [quick, mounted]);

  // 保存 lastType 變更
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(KEY_LAST_TYPE, String(lastType));
    } catch {}
  }, [lastType, mounted]);

  const theme = dark ? THEME.dark : THEME.light;

  // sample banner
  const [showSampleBanner, setShowSampleBanner] = useState(false);

  // 清空模態
  const [confirmOpen, setConfirmOpen] = useState(false);

  // --- utilities ---
  const addQuick = (t: 1 | 2 | 3 | 4 | 5, source: PoopRecord['source'] = 'quick') => {
    const now = new Date();
    const iso = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      0,
      0,
    ).toISOString();
    setRecords((prev) => [
      ...prev,
      { id: `q-${Date.now()}-${Math.random()}`, iso, type: t, source },
    ]);
    setLastType(t);
  };

  // 一般模式：手動單行 + 也可直接點選型態自動送出
  const [line, setLine] = useState('');
  const [, setInputFocus] = useState(false);
  const addByLine = () => {
    const list = parseNotebook(line, new Date());
    if (!list[0]) return;
    setRecords((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, iso: list[0], type: null, source: 'manual' },
    ]);
    setLine('');
  };

  // delete（移至 Modal 內統一處理）
  const del = (id: string) => setRecords((prev) => prev.filter((r) => r.id !== id));

  // edit
  const [editing, setEditing] = useState<{
    id: string;
    time: string;
    type: 1 | 2 | 3 | 4 | 5 | null;
  } | null>(null);
  const beginEdit = (r: PoopRecord) => {
    const d = new Date(r.iso);
    const t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    setEditing({ id: r.id, time: t, type: r.type });
  };
  const saveEdit = () => {
    if (!editing) return;
    const { id, time, type } = editing;
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const d = new Date(r.iso);
        const [hh, mm] = time.split(':').map(Number);
        const iso = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          hh,
          mm,
          0,
          0,
        ).toISOString();
        return { ...r, iso, type: type ?? r.type };
      }),
    );
    setEditing(null);
  };

  // 月份分組（支援無資料時顯示當月）
  const grouped = useMemo(() => {
    const g: Record<string, PoopRecord[]> = {};
    for (const r of records) {
      (g[toDateKey(r.iso)] ||= []).push(r);
    }
    const arr = Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
    return arr.map(([k, rs]) => [
      k,
      rs.sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime()),
    ]) as [string, PoopRecord[]][];
  }, [records]);
  const monthsAll = useMemo(() => {
    const set = new Set<string>();
    for (const [k] of grouped) {
      set.add(k.slice(0, 7));
    }
    const arr = Array.from(set).sort();
    return arr.length ? arr : [getCurrentMonthKey()];
  }, [grouped]);
  const [monthIdx, setMonthIdx] = useState(() => Math.max(0, monthsAll.length - 1));
  useEffect(() => {
    setMonthIdx(Math.max(0, monthsAll.length - 1));
  }, [monthsAll.length]);
  const curMonth = monthsAll[Math.min(monthIdx, monthsAll.length - 1)] || getCurrentMonthKey();
  const monthDays = useMemo(
    () => grouped.filter(([k]) => k.slice(0, 7) === curMonth),
    [grouped, curMonth],
  );

  // ---- 分析範圍切換：全部/年/月 ----
  type RangeMode = 'all' | 'year' | 'month';
  const [rangeMode, setRangeMode] = useState<RangeMode>('all');
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const r of records) {
      set.add(new Date(r.iso).getFullYear());
    }
    const arr = Array.from(set).sort((a, b) => a - b);
    return arr.length ? arr : [new Date().getFullYear()];
  }, [records]);
  const [yearSel, setYearSel] = useState<number>(() => new Date().getFullYear());
  const [monthSel] = useState<string>(() => getCurrentMonthKey());

  const scopeRecords = useMemo(() => {
    if (rangeMode === 'all') return records;
    if (rangeMode === 'year')
      return records.filter((r) => new Date(r.iso).getFullYear() === yearSel);
    return records.filter((r) => toDateKey(r.iso).startsWith(monthSel));
  }, [records, rangeMode, yearSel, monthSel]);

  // charts data (from scope)
  const weeklyData = useMemo(() => {
    if (scopeRecords.length === 0) return [] as any[];
    const byWeek: Record<string, number> = {};
    for (const r of scopeRecords) {
      const d = new Date(r.iso);
      const oneJan = new Date(d.getFullYear(), 0, 1);
      const day = Math.floor((d.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay();
      const wk = Math.ceil(day / 7);
      const key = `${d.getFullYear()}W${String(wk).padStart(2, '0')}`;
      byWeek[key] = (byWeek[key] || 0) + 1;
    }
    const keys = Object.keys(byWeek).sort();
    return keys.map((k) => ({ 週: k.replace(/\d{4}W/, 'W'), 次數: byWeek[k] }));
  }, [scopeRecords]);
  const dailyData = useMemo(() => {
    const g: Record<string, number> = {};
    for (const r of scopeRecords) {
      const k = toDateKey(r.iso);
      g[k] = (g[k] || 0) + 1;
    }
    return Object.entries(g)
      .sort()
      .map(([k, v]) => ({ day: k.slice(5).replace('-', '/'), 次數: v }));
  }, [scopeRecords]);

  // 分析：月份列表（僅有紀錄的日子、兩欄緊湊，左：型態堆疊，右：合計與分佈）
  const monthsInScope = useMemo(() => {
    const set = new Set<string>();
    for (const r of scopeRecords) {
      set.add(toDateKey(r.iso).slice(0, 7));
    }
    const arr = Array.from(set).sort();
    return arr.length ? arr : [getCurrentMonthKey()];
  }, [scopeRecords]);
  const [anaMonthIdx, setAnaMonthIdx] = useState(() => Math.max(0, monthsInScope.length - 1));
  useEffect(() => {
    setAnaMonthIdx(Math.max(0, monthsInScope.length - 1));
  }, [monthsInScope.length]);
  const anaMonthKey = monthsInScope[Math.min(anaMonthIdx, monthsInScope.length - 1)];
  const anaDays = useMemo(() => {
    const g: Record<string, PoopRecord[]> = {};
    for (const r of scopeRecords) {
      const k = toDateKey(r.iso);
      if (k.startsWith(anaMonthKey)) (g[k] ||= []).push(r);
    }
    return Object.entries(g).sort();
  }, [scopeRecords, anaMonthKey]);

  // chart mode
  const [chartMode, setChartMode] = useState<'week' | 'daily'>('week');

  // sample one-shot 行為：離開分析或切頁即清除
  useEffect(() => {
    if (mode !== 'analysis' && records.some((r) => r.ephemeral)) {
      setRecords((prev) => prev.filter((r) => !r.ephemeral));
      setShowSampleBanner(false);
    }
  }, [mode]);
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden' && records.some((r) => r.ephemeral)) {
        setRecords((prev) => prev.filter((r) => !r.ephemeral));
        setShowSampleBanner(false);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [records]);

  // 匯出 CSV（不含臨時資料）
  const exportCsv = () => {
    const keep = records.filter((r) => !r.ephemeral);
    const header = ['date', 'time', 'type'];
    const rows = keep.map((r) => {
      const d = new Date(r.iso);
      return [d.toISOString().slice(0, 10), fmtHM(r.iso), r.type ?? ''];
    });
    const csv = [header, ...rows].map((a) => a.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poop-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 共享週報卡
  const shareWeekly = () => {
    const g: Record<string, number> = {};
    const days = grouped.slice(-7);
    days.forEach(([k, rs]) => (g[k] = rs.length));
    const W = 900,
      H = 1200;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, dark ? '#2a1f1c' : '#FFEADB');
    grd.addColorStop(1, dark ? '#1a1412' : '#FFF7ED');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = dark ? '#F5E9E4' : '#4E342E';
    ctx.font = 'bold 48px ui-sans-serif,system-ui,-apple-system';
    ctx.fillText('可愛週報', 60, 90);
    ctx.font = '28px ui-sans-serif,system-ui';
    ctx.fillText(new Date().toLocaleDateString(), 60, 140);
    const keys = Object.keys(g).sort();
    let i = 0;
    for (const k of keys) {
      const v = g[k];
      const x = 80 + (i % 5) * 160;
      const y = 260 + Math.floor(i / 5) * 220;
      ctx.fillStyle = dark ? '#F3E9E3' : '#4E342E';
      ctx.font = 'bold 22px ui-sans-serif';
      ctx.fillText(k.slice(5), x, y - 20);
      for (let j = 0; j < Math.min(v, 6); j++) {
        ctx.font = '64px "Apple Color Emoji","Segoe UI Emoji"';
        ctx.fillText('💩', x + j * 26, y + 22);
      }
      if (v > 6) {
        ctx.font = 'bold 20px ui-sans-serif';
        ctx.fillText(`+${v - 6}`, x + 6 * 26, y + 18);
      }
      i++;
    }
    ctx.fillStyle = dark ? '#E7DBD6' : '#6D4C41';
    ctx.font = '24px ui-sans-serif';
    ctx.fillText('小叮嚀：規律、補水、高纖', 60, H - 80);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `poop-weekly-card-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  // ---- UI 片段 ----
  const Header = (
    <header
      className="sticky top-0 z-50"
      style={{ background: theme.surfaceAlt, boxShadow: THEME.elevation[1] }}
    >
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            whileTap={{ scale: 0.92 }}
            className="p-2 rounded-2xl"
            style={{ background: theme.primaryContainer, color: theme.onPrimaryContainer }}
            aria-hidden
          >
            <BrandPoop />
          </motion.div>
          <div className="text-base font-semibold">Q 版便便記錄器</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            aria-label={mode === 'log' ? '切換到分析視圖' : '切換到記錄視圖'}
            onClick={() => setMode((m) => (m === 'log' ? 'analysis' : 'log'))}
            className="h-10 px-3 rounded-full text-sm font-medium flex items-center justify-center focus-visible:outline focus-visible:outline-2"
            style={{
              background: theme.primaryContainer,
              color: theme.onPrimaryContainer,
              minWidth: 96,
            }}
          >
            {mode === 'log' ? (
              <span className="inline-flex items-center gap-1">
                <BarChart3 size={16} /> 分析
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <ListChecks size={16} /> 記錄
              </span>
            )}
          </button>
          <button
            aria-label={dark ? '切換為淺色' : '切換為深色'}
            onClick={() => setDark((v) => !v)}
            className="h-10 w-10 rounded-full grid place-items-center focus-visible:outline focus-visible:outline-2"
            style={{ background: theme.primaryContainer, color: theme.onPrimaryContainer }}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );

  // Quick / General strip（輸入欄：明顯可編輯底色 + 動畫 placeholder）
  const inputSamples = ['10/30 08:06', '15.半', '下午3:20', '七點半', '10-30 08:06'];
  const QuickStrip = (
    <div
      className="p-2 rounded-2xl"
      style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
    >
      {quick === 'off' ? (
        <div className="space-y-2">
          {/* 可輸入區塊 */}
          <div
            className="relative flex w-full items-center gap-2 rounded-2xl"
            style={{
              background: theme.surface,
              border: `1px solid ${theme.outline}`,
              boxShadow: THEME.elevation[1],
            }}
          >
            <div className="pl-3 pr-1 py-2 shrink-0 text-sm opacity-80" aria-hidden>
              <Clock size={18} />
            </div>
            {/* 動畫 placeholder 疊層，僅在空值時顯示 */}
            <AnimatedHint active={!line} samples={inputSamples} color={theme.onSurfaceVariant} />
            <input
              aria-label="輸入時間（例如 10/30 08:06 或 15.半）"
              value={line}
              onFocus={() => setInputFocus(true)}
              onBlur={() => setInputFocus(false)}
              onChange={(e) => setLine(e.target.value)}
              placeholder=""
              className="flex-1 bg-transparent outline-none text-sm h-11 px-1 focus-visible:outline-0"
              style={{ color: theme.onSurface }}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={addByLine}
              className="h-9 px-3 rounded-full text-sm font-medium mr-1 focus-visible:outline focus-visible:outline-2"
              style={{ background: theme.primary, color: theme.onPrimary }}
            >
              新增
            </motion.button>
            <button
              onClick={() => setQuick('on')}
              className="h-9 px-3 rounded-full text-sm mr-2 focus-visible:outline focus-visible:outline-2"
              style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
            >
              快速
            </button>
          </div>

          {/* 型態選項：等間距自動換行，Icon 上 / Label 下 */}
          <div className="grid grid-cols-5 gap-2">
            {TYPES.map((t) => (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => addQuick(t.id, 'manual')}
                className="rounded-2xl flex flex-col items-center justify-center focus-visible:outline focus-visible:outline-2"
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.outline}`,
                  padding: 'clamp(8px, 1.4vw, 12px) 0',
                }}
              >
                <CuteIcon t={t.id} />
                <span className="text-xs mt-1.5">{t.name}</span>
              </motion.button>
            ))}
          </div>
          <div className="text-[12px] text-center" style={{ color: theme.onSurfaceVariant }}>
            點擊型態即可立即記錄當前時間
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-2">
            {TYPES.map((t) => (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => addQuick(t.id, 'quick')}
                className="h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 focus-visible:outline focus-visible:outline-2"
                style={{
                  background: t.id === lastType ? theme.primaryContainer : theme.surface,
                  border: `1px solid ${theme.outline}`,
                }}
              >
                <CuteIcon t={t.id} />
                <div className="text-[11px]">{t.name}</div>
              </motion.button>
            ))}
            <button
              onClick={() => setQuick('off')}
              className="h-16 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2"
              style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
            >
              一般
            </button>
          </div>
          <div className="text-[12px] text-center" style={{ color: theme.onSurfaceVariant }}>
            點擊型態立即紀錄當前時間
          </div>
        </div>
      )}
    </div>
  );

  // 記錄清單（刪除按鈕自卡片移除；統一到編輯 Modal）
  const RecordList = (
    <div className="space-y-4">
      {/* month header */}
      <div className="flex items-center justify-between">
        <button
          aria-label="上一個月份"
          onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
          className="h-10 w-10 rounded-full grid place-items-center focus-visible:outline focus-visible:outline-2"
          style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="inline-flex items-center gap-2 text-sm font-semibold">
          <Calendar size={16} /> {curMonth}
        </div>
        <button
          aria-label="下一個月份"
          onClick={() => setMonthIdx((i) => Math.min(monthsAll.length - 1, i + 1))}
          className="h-10 w-10 rounded-full grid place-items-center focus-visible:outline focus-visible:outline-2"
          style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {monthDays.length === 0 && (
        <div
          className="p-6 rounded-2xl text-sm text-center"
          style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
        >
          本月尚無記錄
        </div>
      )}

      <div className="space-y-3">
        {monthDays.map(([k, rs]) => (
          <motion.div
            key={k}
            layout
            className="rounded-2xl"
            style={{
              background: theme.surfaceAlt,
              border: `1px solid ${theme.outline}`,
              boxShadow: THEME.elevation[1],
            }}
          >
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="text-sm font-medium">{k.slice(5).replace('-', '/')}</div>
              <div className="text-xs" style={{ color: theme.onSurfaceVariant }}>
                點擊卡片可編輯
              </div>
            </div>
            <div className="px-3 pb-2 grid grid-cols-2 gap-3">
              {rs.map((r) => (
                <button
                  key={r.id}
                  onClick={() => beginEdit(r)}
                  className="rounded-xl p-2 flex items-start gap-2 text-left focus-visible:outline focus-visible:outline-2"
                  style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
                  aria-label={`編輯 ${fmtHM(r.iso)} 的紀錄`}
                >
                  <div className="shrink-0 mt-0.5">
                    <CuteIcon t={(r.type || 2) as 1 | 2 | 3 | 4 | 5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold tracking-wide">{fmtHM(r.iso)}</div>
                    {/* 次要文字改置底下，行高與字級微調 */}
                    <div
                      className="text-[12px] mt-0.5 leading-[1.45]"
                      style={{ color: theme.onSurfaceVariant }}
                    >
                      {TYPES.find((t) => t.id === (r.type || 2))?.hint}
                    </div>
                  </div>
                  <div className="opacity-60" aria-hidden>
                    <Pencil size={16} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // 編輯浮層（含刪除）
  const EditSheet = (
    <AnimatePresence>
      {editing && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(0,0,0,.5)' }}
          onClick={() => setEditing(null)}
          role="dialog"
          aria-modal
        >
          <motion.div
            initial={{ y: 400 }}
            animate={{ y: 0 }}
            exit={{ y: 400 }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            className="w-[calc(100%-2rem)] max-w-md mx-auto mb-4 rounded-2xl p-4"
            style={{ background: theme.surfaceAlt, boxShadow: THEME.elevation[3] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold mb-2">編輯記錄</div>
            <div className="flex items-center gap-2 mb-3">
              <input
                aria-label="調整時間"
                type="time"
                value={editing.time}
                onChange={(e) => setEditing({ ...editing!, time: e.target.value })}
                className="h-11 px-3 rounded-xl flex-1 focus-visible:outline focus-visible:outline-2"
                style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
              />
              <div className="flex items-center gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    aria-label={`選擇型態 ${t.name}`}
                    onClick={() => setEditing({ ...editing!, type: t.id })}
                    className="h-11 w-11 rounded-xl grid place-items-center focus-visible:outline focus-visible:outline-2"
                    style={{
                      background:
                        (editing.type || 2) === t.id ? theme.primaryContainer : theme.surface,
                      border: `1px solid ${theme.outline}`,
                    }}
                  >
                    <CuteIcon t={t.id} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (!editing) return;
                  const id = editing.id;
                  setEditing(null);
                  del(id);
                }}
                className="h-11 px-3 rounded-full text-sm inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2"
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.outline}`,
                  color: '#B3261E',
                }}
              >
                <Trash2 size={16} /> 刪除
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="h-11 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2"
                  style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
                >
                  取消
                </button>
                <button
                  onClick={saveEdit}
                  className="h-11 px-3 rounded-full text-sm font-medium focus-visible:outline focus-visible:outline-2"
                  style={{ background: theme.primary, color: theme.onPrimary }}
                >
                  儲存
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 趨勢：統一操作列 + 響應式圖表
  const TrendBlock = (
    <div
      className="rounded-2xl p-3 space-y-3"
      style={{
        background: theme.surfaceAlt,
        border: `1px solid ${theme.outline}`,
        boxShadow: THEME.elevation[1],
      }}
    >
      {/* 操作列 */}
      <div
        className="p-2 rounded-2xl flex items-center justify-between"
        style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setChartMode('week')}
            className={`h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2 ${chartMode === 'week' ? 'font-semibold' : ''}`}
            style={{
              background: chartMode === 'week' ? theme.primaryContainer : theme.surfaceAlt,
              border: `1px solid ${theme.outline}`,
            }}
          >
            週趨勢
          </button>
          <button
            onClick={() => setChartMode('daily')}
            className={`h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2 ${chartMode === 'daily' ? 'font-semibold' : ''}`}
            style={{
              background: chartMode === 'daily' ? theme.primaryContainer : theme.surfaceAlt,
              border: `1px solid ${theme.outline}`,
            }}
          >
            日次數
          </button>
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={shareWeekly}
          className="h-9 px-3 rounded-full text-sm inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2"
          style={{ background: theme.primary, color: theme.onPrimary }}
        >
          <Share2 size={16} /> 週報圖卡
        </motion.button>
      </div>

      {/* 圖表容器 */}
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'week' ? (
            <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={theme.outline} strokeOpacity={0.3} strokeDasharray="3 3" />
              <XAxis dataKey="週" tick={{ fill: theme.onSurfaceVariant }} />
              <YAxis allowDecimals={false} tick={{ fill: theme.onSurfaceVariant }} />
              <Tooltip
                contentStyle={{
                  background: theme.surfaceAlt,
                  border: `1px solid ${theme.outline}`,
                  borderRadius: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="次數"
                stroke={theme.primary}
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          ) : (
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={theme.outline} strokeOpacity={0.3} strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: theme.onSurfaceVariant }} />
              <YAxis allowDecimals={false} tick={{ fill: theme.onSurfaceVariant }} />
              <Tooltip
                contentStyle={{
                  background: theme.surfaceAlt,
                  border: `1px solid ${theme.outline}`,
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="次數" fill={theme.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );

  // 分析專用：兩欄緊湊列表 + 趨勢 + 貼心建議
  const Analysis = (
    <div className="space-y-4">
      {showSampleBanner && (
        <div
          className="p-3 rounded-2xl flex items-start gap-2"
          style={{ background: theme.primaryContainer, color: theme.onPrimaryContainer }}
        >
          <Info size={18} />
          <div className="text-sm">
            目前顯示為「範例資料」，僅供一次查看。切換頁面或離開將自動清除，不影響原有記錄。
          </div>
        </div>
      )}

      {/* 範圍切換 */}
      <div
        className="p-2 rounded-2xl flex items-center justify-between flex-wrap gap-2"
        style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRangeMode('all')}
            className={`h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2 ${rangeMode === 'all' ? 'font-semibold' : ''}`}
            style={{
              background: rangeMode === 'all' ? theme.primaryContainer : theme.surface,
              border: `1px solid ${theme.outline}`,
            }}
          >
            全部
          </button>
          <button
            onClick={() => setRangeMode('year')}
            className={`h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2 ${rangeMode === 'year' ? 'font-semibold' : ''}`}
            style={{
              background: rangeMode === 'year' ? theme.primaryContainer : theme.surface,
              border: `1px solid ${theme.outline}`,
            }}
          >
            年
          </button>
          <button
            onClick={() => setRangeMode('month')}
            className={`h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2 ${rangeMode === 'month' ? 'font-semibold' : ''}`}
            style={{
              background: rangeMode === 'month' ? theme.primaryContainer : theme.surface,
              border: `1px solid ${theme.outline}`,
            }}
          >
            月
          </button>
        </div>
        <div className="flex items-center gap-2">
          {rangeMode === 'year' && (
            <select
              aria-label="選擇年份"
              value={yearSel}
              onChange={(e) => setYearSel(Number(e.target.value))}
              className="h-9 px-2 rounded-lg text-sm focus-visible:outline focus-visible:outline-2"
              style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
          {rangeMode === 'month' && (
            <div className="flex items-center gap-1.5">
              <button
                aria-label="上一個月份"
                onClick={() => setAnaMonthIdx((i) => Math.max(0, i - 1))}
                className="h-9 w-9 rounded-full grid place-items-center focus-visible:outline focus-visible:outline-2"
                style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-sm font-medium inline-flex items-center gap-1">
                <Calendar size={16} /> {anaMonthKey}
              </div>
              <button
                aria-label="下一個月份"
                onClick={() => setAnaMonthIdx((i) => Math.min(monthsInScope.length - 1, i + 1))}
                className="h-9 w-9 rounded-full grid place-items-center focus-visible:outline focus-visible:outline-2"
                style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <div className="hidden sm:block text-[12px]" style={{ color: theme.onSurfaceVariant }}>
            資料：{scopeRecords.length} 筆
          </div>
        </div>
      </div>

      {/* 趨勢統一區塊 */}
      {TrendBlock}

      {/* 分析月份：兩欄緊湊列表 */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-semibold">
          <Calendar size={16} /> {anaMonthKey}
        </div>
        <div className="text-[12px]" style={{ color: theme.onSurfaceVariant }}>
          僅列出有紀錄日
        </div>
      </div>
      <div className="space-y-2">
        {anaDays.length === 0 && (
          <div
            className="p-6 rounded-2xl text-sm text-center"
            style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
          >
            此範圍尚無資料
          </div>
        )}
        {anaDays.map(([k, rs]) => {
          const cnt: Record<number, number> = {} as any;
          rs.forEach((r) => {
            const t = (r.type || 2) as number;
            cnt[t] = (cnt[t] || 0) + 1;
          });
          const total = rs.length;
          const typesSorted = Object.entries(cnt)
            .sort((a, b) => Number(b[1]) - Number(a[1]))
            .slice(0, 4);
          const extra = Math.max(0, Object.keys(cnt).length - typesSorted.length);
          return (
            <div
              key={k}
              className="rounded-2xl px-3 py-2 grid grid-cols-2 gap-2 items-center"
              style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
            >
              {/* 左：堆疊圖示 */}
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex -space-x-2">
                  {typesSorted.map(([t]) => (
                    <div
                      key={t}
                      className="w-8 h-8 rounded-full grid place-items-center ring-1"
                      style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
                    >
                      <CuteIcon t={Number(t) as 1 | 2 | 3 | 4 | 5} stacked />
                    </div>
                  ))}
                  {extra > 0 && (
                    <div
                      className="w-8 h-8 rounded-full grid place-items-center text-[11px]"
                      style={{
                        background: theme.surface,
                        border: `1px solid ${theme.outline}`,
                        color: theme.onSurfaceVariant,
                      }}
                    >
                      +{extra}
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium">{k.slice(5).replace('-', '/')}</div>
              </div>
              {/* 右：合計 + 型態分佈 */}
              <div className="flex items-center justify-end gap-2 flex-wrap">
                <div className="text-sm font-semibold">共 {total}</div>
                {Object.entries(cnt)
                  .sort((a, b) => Number(b[1]) - Number(a[1]))
                  .map(([t, c]) => (
                    <div
                      key={t}
                      className="px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1"
                      style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
                    >
                      <CuteIcon t={Number(t) as 1 | 2 | 3 | 4 | 5} />
                      <span>×{c}</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 貼心建議區 */}
      <div
        className="rounded-2xl p-3 space-y-2"
        style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
      >
        <div className="text-sm font-semibold">健康建議</div>
        {(() => {
          const last14 = Array.from(new Set(scopeRecords.map((r) => toDateKey(r.iso)))).slice(-14);
          const freq7 = Array.from(new Set(scopeRecords.map((r) => toDateKey(r.iso)))).slice(
            -7,
          ).length;
          const byDay: Record<string, PoopRecord[]> = {};
          scopeRecords.forEach((r) => {
            const k = toDateKey(r.iso);
            (byDay[k] ||= []).push(r);
          });
          const noneStreak = (() => {
            const days = [...Object.keys(byDay)].sort();
            let maxS = 0;
            let prev: '' | string = '';
            for (const d of days) {
              if (prev) {
                const pd = new Date(prev),
                  nd = new Date(d);
                const diff = (+nd - +pd) / 86400000;
                if (diff > 1) {
                  const gap = Math.floor(diff - 1);
                  maxS = Math.max(maxS, gap);
                }
              }
              prev = d;
            }
            return maxS;
          })();
          const hardRate =
            scopeRecords.filter((r) => r.type === 1).length / Math.max(1, scopeRecords.length);
          const waterRate =
            scopeRecords.filter((r) => r.type === 5).length / Math.max(1, scopeRecords.length);

          const cards: { title: string; tip: string }[] = [];
          if (freq7 <= 2)
            cards.push({
              title: '這週有點少',
              tip: '多喝水、多蔬果 + 固定時段嘗試（早餐後或晚餐後）。若連續多日未解，留意是否腹脹與不適。',
            });
          if (hardRate > 0.35)
            cards.push({
              title: '偏硬比例較高',
              tip: '增加膳食纖維（全穀、蔬菜）、每天 1500–2000ml 水，睡前可輕微腹部按摩。',
            });
          if (waterRate > 0.25)
            cards.push({
              title: '水樣較多',
              tip: '注意補水與電解質，暫避生冷辛辣。若合併腹痛/血便/發燒，請及早就醫。',
            });
          if (noneStreak >= 2)
            cards.push({
              title: '出現斷層日',
              tip: `偵測到最長 ${noneStreak} 天未記錄排便，建議調整作息與纖維水分，持續觀察。`,
            });
          if (last14.length >= 10)
            cards.push({
              title: '很棒，穩定紀錄中',
              tip: '保持規律作息與運動，記錄能幫你更了解身體節奏，為自己鼓掌！',
            });
          if (cards.length === 0)
            cards.push({
              title: '維持目前節奏',
              tip: '偶爾調整飲食與運動即可。身體的訊號最誠實，做得很好！',
            });

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cards.map((c, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl"
                  style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
                >
                  <div className="text-sm font-semibold mb-1">{c.title}</div>
                  <div className="text-[12px]" style={{ color: theme.onSurfaceVariant }}>
                    {c.tip}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );

  // 匯入模態：貼上記事本或一次性範例
  const [openImport, setOpenImport] = useState(false);
  const [importTab, setImportTab] = useState<'paste' | 'sample'>('paste');
  const [note, setNote] = useState('');

  const importSample = (kind: 'normal' | 'abnormal' | 'over') => {
    const demo = genSample(kind);
    setRecords((prev) => [...prev, ...demo]);
    setOpenImport(false);
    setShowSampleBanner(true);
    setMode('analysis');
  };

  const ImportModal = (
    <AnimatePresence>
      {openImport && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(0,0,0,.55)' }}
          onClick={() => setOpenImport(false)}
          role="dialog"
          aria-modal
        >
          <motion.div
            layout
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{ background: theme.surfaceAlt, boxShadow: THEME.elevation[3] }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: theme.surface }}
            >
              <div className="text-sm font-semibold inline-flex items-center gap-2">
                <Upload size={16} /> 匯入記錄
              </div>
              <button
                onClick={() => setOpenImport(false)}
                className="h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2"
                style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
              >
                關閉
              </button>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setImportTab('paste')}
                  className={`h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2 ${importTab === 'paste' ? 'font-semibold' : ''}`}
                  style={{
                    background: importTab === 'paste' ? theme.primaryContainer : theme.surface,
                    border: `1px solid ${theme.outline}`,
                  }}
                >
                  貼上記事本
                </button>
                <button
                  onClick={() => setImportTab('sample')}
                  className={`h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2 ${importTab === 'sample' ? 'font-semibold' : ''}`}
                  style={{
                    background: importTab === 'sample' ? theme.primaryContainer : theme.surface,
                    border: `1px solid ${theme.outline}`,
                  }}
                >
                  隨機範例
                </button>
              </div>

              {importTab === 'paste' && (
                <div className="space-y-2">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={`貼上多行，例如\n10/28 10:01\n10/28 17:44\n10/30 08:06\n也支援：15.半 / 下午3:20 / 七點半`}
                    className="w-full min-h-[160px] p-3 rounded-2xl text-sm focus-visible:outline focus-visible:outline-2"
                    style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setNote('')}
                      className="h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2"
                      style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
                    >
                      清空
                    </button>
                    <button
                      onClick={() => {
                        const list = parseNotebook(note, new Date());
                        const add = list.map((iso, i) => ({
                          id: `imp-${Date.now()}-${i}`,
                          iso,
                          type: null,
                          source: 'import' as const,
                        }));
                        if (add.length) {
                          setRecords((prev) => [...prev, ...add]);
                        }
                        setOpenImport(false);
                        setNote('');
                      }}
                      className="h-9 px-3 rounded-full text-sm font-medium focus-visible:outline focus-visible:outline-2"
                      style={{ background: theme.primary, color: theme.onPrimary }}
                    >
                      加入記錄
                    </button>
                  </div>
                </div>
              )}

              {importTab === 'sample' && (
                <div className="space-y-2">
                  <div className="text-[12px]" style={{ color: theme.onSurfaceVariant }}>
                    點選一個版本，將會把範例資料（100–150 天）<b>臨時寫入</b>
                    到主畫面並自動切換到分析。離開分析或切換頁面即清除，不寫入本地。
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => importSample('normal')}
                      className="h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2"
                      style={{ background: theme.primary, color: theme.onPrimary }}
                    >
                      正常版
                    </button>
                    <button
                      onClick={() => importSample('abnormal')}
                      className="h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2"
                      style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
                    >
                      異常版
                    </button>
                    <button
                      onClick={() => importSample('over')}
                      className="h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2"
                      style={{ background: theme.surface, border: `1px solid ${theme.outline}` }}
                    >
                      超量版
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 清空資料模態
  const ClearModal = (
    <AnimatePresence>
      {confirmOpen && (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(0,0,0,.55)' }}
          onClick={() => setConfirmOpen(false)}
          role="dialog"
          aria-modal
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: theme.surfaceAlt, boxShadow: THEME.elevation[3] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3" style={{ background: theme.surface }}>
              <div className="text-sm font-semibold">清除所有記錄</div>
            </div>
            <div className="p-4 text-sm" style={{ color: theme.onSurfaceVariant }}>
              確定要刪除所有的永久記錄嗎？（臨時範例資料會自動清除）
            </div>
            <div
              className="px-4 py-3 flex items-center justify-end gap-2"
              style={{ background: theme.surface }}
            >
              <button
                onClick={() => setConfirmOpen(false)}
                className="h-9 px-3 rounded-full text-sm focus-visible:outline focus-visible:outline-2"
                style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  setRecords((prev) => prev.filter((r) => r.ephemeral));
                }}
                className="h-9 px-3 rounded-full text-sm font-medium focus-visible:outline focus-visible:outline-2"
                style={{ background: theme.primary, color: theme.onPrimary }}
              >
                確定刪除
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const now = new Date();
  const buildTip = `Built on ${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <main className="min-h-screen" style={{ background: theme.surface, color: theme.onSurface }}>
      <Bg dark={dark} />
      {Header}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4 pb-28">
        {/* toolbar */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setOpenImport(true)}
            className="h-10 px-3 rounded-full text-sm font-medium inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2"
            style={{ background: theme.primaryContainer, color: theme.onPrimaryContainer }}
          >
            <Upload size={16} /> 匯入
          </motion.button>
          <button
            onClick={exportCsv}
            className="h-10 px-3 rounded-full text-sm inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2"
            style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
          >
            <Download size={16} /> 匯出
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            className="h-10 px-3 rounded-full text-sm inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2"
            style={{ background: theme.surfaceAlt, border: `1px solid ${theme.outline}` }}
          >
            <Trash2 size={16} /> 清空
          </button>
          <div className="ml-auto">
            {mode === 'analysis' ? (
              <span className="text-xs" style={{ color: theme.onSurfaceVariant }}>
                分析視圖
              </span>
            ) : (
              <span className="text-xs" style={{ color: theme.onSurfaceVariant }}>
                記錄視圖
              </span>
            )}
          </div>
        </div>

        {/* quick & content */}
        {QuickStrip}

        {mode === 'log' ? (
          <div className="space-y-4">{RecordList}</div>
        ) : (
          <div className="space-y-4">{Analysis}</div>
        )}

        {/* footer */}
        <footer className="mt-6">
          <div className="flex flex-col items-center justify-center gap-3 text-sm">
            <div
              className="flex items-center gap-2"
              style={{ color: dark ? 'rgba(255,255,255,0.9)' : '#4E342E' }}
            >
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center"
                style={{
                  background: dark ? 'rgba(255,255,255,0.2)' : 'rgba(78,52,46,0.1)',
                  backdropFilter: 'blur(6px)',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.3)' : 'rgba(78,52,46,0.2)'}`,
                }}
                aria-hidden
              >
                <BrandPoop size={14} />
              </div>
              <span className="font-semibold">Q 版便便記錄器</span>
              <span style={{ color: dark ? 'rgba(255,255,255,0.5)' : '#876' }}>•</span>
              <span
                className="relative inline-block cursor-help text-xs font-mono group"
                title={buildTip}
              >
                {APP_VERSION}
                <span
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
                  style={{ background: '#111' }}
                >
                  {buildTip}
                  <span
                    className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
                    style={{ borderTopColor: '#111' }}
                  ></span>
                </span>
              </span>
              <span style={{ color: dark ? 'rgba(255,255,255,0.5)' : '#876' }}>•</span>
              <span style={{ color: dark ? 'rgba(255,255,255,0.7)' : '#5c4037' }}>
                © {now.getFullYear()}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5"
              style={{ color: dark ? 'rgba(255,255,255,0.8)' : '#4E342E' }}
            >
              <span>By</span>
              <svg
                viewBox="0 0 192 192"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="w-4 h-4"
                aria-label="Threads"
              >
                <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"></path>
              </svg>
              <a
                href="https://www.threads.net/@azlife_1224"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline font-medium"
                style={{ color: dark ? 'rgba(255,255,255,0.9)' : '#3e2723' }}
              >
                azlife_1224
              </a>
            </div>
          </div>
        </footer>
      </div>

      {ImportModal}
      {EditSheet}
      {ClearModal}

      {/* bottom nav（行動裝置友善） */}
      <nav className="fixed bottom-3 left-0 right-0 flex items-center justify-center">
        <div
          className="mx-auto w-[min(480px,92%)] h-14 rounded-2xl px-3 flex items-center justify-between focus-visible:outline focus-visible:outline-2"
          style={{
            background: theme.surfaceAlt,
            border: `1px solid ${theme.outline}`,
            boxShadow: THEME.elevation[2],
          }}
        >
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setMode('log')}
            className={`h-10 px-3 rounded-xl text-sm inline-flex items-center gap-2 ${mode === 'log' ? 'font-semibold' : ''} focus-visible:outline focus-visible:outline-2`}
            style={{ background: mode === 'log' ? theme.primaryContainer : 'transparent' }}
            aria-label="切換到記錄頁籤"
          >
            <ListChecks size={18} /> 記錄
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setMode('analysis')}
            className={`h-10 px-3 rounded-xl text-sm inline-flex items-center gap-2 ${mode === 'analysis' ? 'font-semibold' : ''} focus-visible:outline focus-visible:outline-2`}
            style={{ background: mode === 'analysis' ? theme.primaryContainer : 'transparent' }}
            aria-label="切換到分析頁籤"
          >
            <BarChart3 size={18} /> 分析
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setOpenImport(true)}
            className="h-10 px-3 rounded-xl text-sm inline-flex items-center gap-2 focus-visible:outline focus-visible:outline-2"
            aria-label="開啟匯入"
          >
            <Upload size={18} /> 匯入
          </motion.button>
        </div>
      </nav>
    </main>
  );
}
