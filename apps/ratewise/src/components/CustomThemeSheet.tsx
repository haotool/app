/**
 * CustomThemeSheet（E2 wave-D＋E7 wave-B）：自訂主題色整頁沉浸式選色 sheet。
 *
 * 內容由上而下：即時預覽卡（模擬主畫面元素跟色）→ 精選色票（20 色 × 5 欄）→
 * HexColorPicker（react-colorful，ADR-001）→ HEX 欄位（focus 全選/paste 清洗/blur commit）＋
 * 演算預覽 chip → 對比 gate 警告（近白/近黑主色＋一鍵採用建議色）→
 * 背景色調八選一（色調圓票）→ 取消／還原預設（二段確認）。
 * E7 wave-B draft 語意：sheet 開啟期間變更即時預覽全站但不持久化；
 * 關閉 sheet＝commit、「取消」＝回滾開啟前快照（由 useCustomThemeDraft 編排）。
 * sheet 為整頁（size="full"）遮住主畫面，故頂部預覽卡承擔「所見即所得」回饋。
 * 選色面板為指標拖曳互動，sheet 關閉整片下拉（enableDrag=false）避免手勢衝突。
 *
 * @see .claude/prds/custom-theme-v2-design.md（第 4 節 wave-B、第 6 節 QA-I 對策表）
 * @see .claude/decisions/ADR-001-react-colorful.md
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useTranslation } from 'react-i18next';
import { Check, Plus, TrendingUp, Wand2 } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { useInlineConfirm } from '../hooks/useInlineConfirm';
import {
  CUSTOM_PRIMARY_PRESETS,
  CUSTOM_BACKGROUND_TONES,
  choosePrimaryForeground,
  deriveCustomThemeCssVars,
  evaluatePrimaryContrastGate,
  sanitizeHexInput,
  type CustomBackgroundTone,
} from '../config/custom-theme';

export interface CustomThemeSheetProps {
  isOpen: boolean;
  /** 關閉 sheet（X / backdrop / Esc）＝ commit draft。 */
  onClose: () => void;
  /** 取消＝回滾開啟前快照後關閉。 */
  onCancel: () => void;
  customPrimary: string;
  customBackgroundTone: CustomBackgroundTone;
  onSelectPrimary: (hex: string) => void;
  onSelectBackgroundTone: (tone: CustomBackgroundTone) => void;
  onReset: () => void;
}

// 淺檔一列（5）＋深檔一列（3，E7 wave-A）：grid-cols-5 下自然分兩排呈現明暗分組。
const BACKGROUND_TONE_ORDER: readonly CustomBackgroundTone[] = [
  'pure',
  'warm',
  'cool',
  'mint',
  'rose',
  'graphite',
  'midnight',
  'black',
];

/** 選色觸覺回饋（支援裝置才震動；時長對齊 quickAmountButtonTokens.hapticDuration 語意） */
function selectionHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

/** 'R G B' 三元組 → rgb() 字串（預覽區消費演算輸出）。 */
function tripleToRgb(triple: string): string {
  return `rgb(${triple.split(' ').join(', ')})`;
}

export function CustomThemeSheet({
  isOpen,
  onClose,
  onCancel,
  customPrimary,
  customBackgroundTone,
  onSelectPrimary,
  onSelectBackgroundTone,
  onReset,
}: CustomThemeSheetProps) {
  const { t } = useTranslation();

  // 演算輸出：預覽卡與預覽 chip 共同消費（strong 為白字 AA 錨點）。
  const derived = useMemo(
    () => deriveCustomThemeCssVars(customPrimary, customBackgroundTone),
    [customPrimary, customBackgroundTone],
  );
  const strongRgb = tripleToRgb(derived['--color-primary-strong']);
  const lightRgb = tripleToRgb(derived['--color-primary-light']);
  const textRgb = tripleToRgb(derived['--color-primary-text']);
  const chartRgb = tripleToRgb(derived['--color-chart-line']);
  const toneBackground = CUSTOM_BACKGROUND_TONES[customBackgroundTone].background;
  // 可讀性回饋（#632）：on-surface 被 clamp（≠ raw primary）時提示文字將自動加深。
  const onSurfaceTriple = derived['--color-primary-on-surface'];
  const isTextClamped = onSurfaceTriple !== derived['--color-primary'];
  const onSurfaceRgb = tripleToRgb(onSurfaceTriple);
  // 近白/近黑主色 gate（QA-I #2＋#670 S3）：對當前背景調 <2:1 即警告＋建議色（不硬擋）。
  const contrastGate = useMemo(
    () => evaluatePrimaryContrastGate(customPrimary, customBackgroundTone),
    [customPrimary, customBackgroundTone],
  );

  // 還原預設二段確認（QA-I D12）：sheet 關閉時解除確認態。
  const resetConfirm = useInlineConfirm(onReset);
  const resetConfirmReset = resetConfirm.reset;
  useEffect(() => {
    if (!isOpen) resetConfirmReset();
  }, [isOpen, resetConfirmReset]);

  // 選色拖動 16ms debounce（trailing）：全套派生（含深色 neutral scale）高頻執行的效能上限，
  // 與 deriveCustomThemeCssVars 的 memoize 並用（PM 簡報第 5 節）。
  const pendingHexRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlePickerChange = useCallback(
    (hex: string) => {
      pendingHexRef.current = hex;
      if (debounceTimerRef.current !== null) return;
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        if (pendingHexRef.current !== null) onSelectPrimary(pendingHexRef.current);
      }, 16);
    },
    [onSelectPrimary],
  );
  useEffect(
    () => () => {
      if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
    },
    [],
  );

  // HEX 欄位（QA-I #4）：編輯中顯示值與 commit 分離——focus 全選、輸入/貼上即清洗
  //（去 # 空白、統一大寫、截 6 碼），blur/Enter 才 commit，無效值回滾前值。
  // null＝非編輯態（顯示值跟隨 customPrimary，色票/色盤變更即時同步）。
  const [hexFieldDraft, setHexFieldDraft] = useState<string | null>(null);
  const displayedHex = hexFieldDraft ?? customPrimary.replace('#', '').toUpperCase();

  const commitHexField = () => {
    if (hexFieldDraft !== null && hexFieldDraft.length === 6) {
      onSelectPrimary(`#${hexFieldDraft}`);
    }
    setHexFieldDraft(null);
  };

  const handleSelectPreset = (preset: string) => {
    selectionHaptic();
    onSelectPrimary(preset);
  };

  const handleSelectTone = (tone: CustomBackgroundTone) => {
    selectionHaptic();
    onSelectBackgroundTone(tone);
  };

  const toneLabels: Record<CustomBackgroundTone, string> = {
    pure: t('settings.customThemeTonePure'),
    warm: t('settings.customThemeToneWarm'),
    cool: t('settings.customThemeToneCool'),
    mint: t('settings.customThemeToneMint'),
    rose: t('settings.customThemeToneRose'),
    graphite: t('settings.customThemeToneGraphite'),
    midnight: t('settings.customThemeToneMidnight'),
    black: t('settings.customThemeToneBlack'),
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('styles.custom')}
      title={t('styles.custom')}
      closeLabel={t('common.close')}
      size="full"
      enableDrag={false}
      testId="custom-theme-sheet"
    >
      <div className="overflow-y-auto px-5 pb-8">
        {/* 即時預覽卡：整頁 sheet 遮住主畫面，這裡模擬主畫面元素承擔所見即所得 */}
        <div
          className="mb-6 rounded-card border border-border/50 p-4 transition-colors duration-300"
          style={{ backgroundColor: toneBackground }}
          data-testid="custom-theme-live-preview"
          aria-label={t('settings.customThemePreview')}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className="rounded-full px-2.5 py-1 text-2xs font-bold transition-colors duration-300"
              style={{ backgroundColor: lightRgb, color: textRgb }}
            >
              1 USD = 32.215 TWD
            </span>
            <TrendingUp
              className="h-4 w-4 transition-colors duration-300"
              style={{ color: chartRgb }}
              aria-hidden="true"
            />
          </div>
          {/* 迷你趨勢線：以 chart 色演算輸出即時跟色 */}
          <svg
            viewBox="0 0 200 28"
            className="mb-3 h-7 w-full"
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            <path
              d="M0 22 C 25 20, 40 10, 60 12 S 95 24, 120 16 S 165 4, 200 8"
              fill="none"
              stroke={chartRgb}
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-[stroke] duration-300"
            />
          </svg>
          <button
            type="button"
            tabIndex={-1}
            className="pointer-events-none flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white transition-colors duration-300"
            style={{ backgroundColor: strongRgb }}
            aria-hidden="true"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('singleConverter.addToHistory')}
          </button>
        </div>

        {/* 精選色票（20 色 × 5 欄，press 縮放微互動） */}
        <p className="text-2xs font-black uppercase tracking-[0.2em] opacity-40 mb-3">
          {t('settings.customThemePresets')}
        </p>
        <div
          className="grid grid-cols-5 gap-3 mb-6"
          role="group"
          aria-label={t('settings.customThemePresets')}
        >
          {CUSTOM_PRIMARY_PRESETS.map((preset) => {
            const isActive = customPrimary.toUpperCase() === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`relative mx-auto h-11 w-11 cursor-pointer rounded-full shadow-sm transition-[transform,filter] duration-150 ease-out hover:brightness-110 active:scale-90 motion-reduce:transition-none ${
                  isActive ? 'ring-2 ring-offset-2 scale-105' : ''
                }`}
                style={
                  {
                    backgroundColor: preset,
                    '--tw-ring-color': preset,
                    '--tw-ring-offset-color': 'rgb(var(--color-surface))',
                  } as React.CSSProperties
                }
                aria-pressed={isActive}
                aria-label={`${t('styles.custom')} ${preset}`}
              >
                {isActive && (
                  <Check
                    className="absolute inset-0 m-auto h-5 w-5"
                    style={{ color: choosePrimaryForeground(preset) }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 二維選色面板（飽和度面板＋色相條，樣式覆寫見 index.css .custom-theme-picker） */}
        <div className="custom-theme-picker mb-6" data-testid="custom-theme-picker">
          <HexColorPicker color={customPrimary} onChange={handlePickerChange} />
        </div>

        {/* HEX 輸入＋演算預覽 chip */}
        <div className="mb-6 flex items-end justify-between gap-3">
          <label className="block">
            <span className="text-2xs font-black uppercase tracking-[0.2em] opacity-40">
              {t('settings.customThemeHex')}
            </span>
            <span
              className="mt-2 flex w-32 min-h-11 items-center rounded-control border border-border px-3 py-2 font-mono text-sm focus-within:ring-2"
              style={{ '--tw-ring-color': customPrimary } as React.CSSProperties}
            >
              <span aria-hidden="true" className="opacity-50">
                #
              </span>
              <input
                type="text"
                value={displayedHex}
                onFocus={(event) => {
                  setHexFieldDraft(sanitizeHexInput(event.target.value));
                  event.target.select();
                }}
                onChange={(event) => setHexFieldDraft(sanitizeHexInput(event.target.value))}
                onBlur={commitHexField}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    commitHexField();
                    event.currentTarget.blur();
                  }
                }}
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="done"
                className="w-full bg-transparent uppercase focus:outline-none"
                aria-label={t('settings.customThemeHex')}
                data-testid="custom-theme-hex-input"
              />
            </span>
          </label>
          <div
            className="flex items-center gap-2"
            role="img"
            aria-label={t('settings.customThemePreview')}
            data-testid="custom-theme-preview"
          >
            <span
              className="flex h-11 w-14 items-center justify-center rounded-control text-sm font-bold shadow-sm transition-colors duration-300"
              style={{
                backgroundColor: customPrimary,
                color: choosePrimaryForeground(customPrimary),
              }}
            >
              Aa
            </span>
            <span
              className="flex h-11 w-14 items-center justify-center rounded-control text-sm font-bold text-white shadow-sm transition-colors duration-300"
              style={{ backgroundColor: strongRgb }}
            >
              Aa
            </span>
          </div>
        </div>

        {/* 可讀性回饋（#632）：過淺主色不硬擋，即時預覽 clamp 後的實效文字色。 */}
        <div role="status" aria-live="polite" className="mb-5 empty:mb-0 empty:h-0 space-y-2.5">
          {/* 近白/近黑主色 gate（QA-I #2＋#670 S3）：警告＋一鍵採用建議色（不硬擋）。 */}
          {contrastGate.isLowContrast && contrastGate.suggestedPrimary && (
            <div
              className="flex items-center gap-3 rounded-control bg-surface-sunken px-3 py-2.5"
              data-testid="custom-theme-gate-notice"
            >
              <p className="min-w-0 flex-1 text-xs leading-relaxed opacity-70">
                {t('settings.customThemeGateNotice')}
              </p>
              <button
                type="button"
                onClick={() => onSelectPrimary(contrastGate.suggestedPrimary ?? customPrimary)}
                className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-control bg-surface px-3 py-2 text-xs font-bold shadow-sm transition-transform active:scale-95 motion-reduce:transition-none"
                style={{ color: onSurfaceRgb }}
                data-testid="custom-theme-gate-adopt"
              >
                <span
                  className="h-5 w-5 rounded-full border border-border"
                  style={{ backgroundColor: contrastGate.suggestedPrimary }}
                  aria-hidden="true"
                />
                <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t('settings.customThemeGateAdopt')}
              </button>
            </div>
          )}
          {isTextClamped && (
            <div
              className="flex items-center gap-3 rounded-control bg-surface-sunken px-3 py-2.5"
              data-testid="custom-theme-contrast-notice"
            >
              <span
                className="flex h-9 w-12 shrink-0 items-center justify-center rounded-compact bg-surface text-sm font-bold shadow-sm"
                style={{ color: onSurfaceRgb }}
                aria-hidden="true"
              >
                Aa
              </span>
              <p className="text-xs leading-relaxed opacity-70">
                {t('settings.customThemeContrastNotice')}
              </p>
            </div>
          )}
        </div>

        {/* 背景色調五選一：色調圓票直接呈現底色（比文字 segmented 更所見即所得） */}
        <p className="text-2xs font-black uppercase tracking-[0.2em] opacity-40 mb-3">
          {t('settings.customThemeBackgroundTone')}
        </p>
        <div
          className="mb-6 grid grid-cols-5 gap-2"
          role="group"
          aria-label={t('settings.customThemeBackgroundTone')}
        >
          {BACKGROUND_TONE_ORDER.map((tone) => {
            const isActive = customBackgroundTone === tone;
            return (
              <button
                key={tone}
                type="button"
                onClick={() => handleSelectTone(tone)}
                className="group flex cursor-pointer flex-col items-center gap-1.5"
                aria-pressed={isActive}
                data-testid={`background-tone-${tone}`}
              >
                <span
                  className={`h-10 w-10 rounded-full border transition-all duration-150 ease-out group-active:scale-90 motion-reduce:transition-none ${
                    isActive
                      ? 'border-transparent ring-2 ring-primary ring-offset-2 ring-offset-surface scale-105'
                      : 'border-border group-hover:border-primary/40'
                  }`}
                  style={{ backgroundColor: CUSTOM_BACKGROUND_TONES[tone].background }}
                  aria-hidden="true"
                />
                <span
                  className={`text-2xs font-semibold transition-colors duration-150 ${
                    isActive ? 'text-primary-on-surface' : 'text-text-muted'
                  }`}
                >
                  {toneLabels[tone]}
                </span>
              </button>
            );
          })}
        </div>

        {/* 取消（回滾開啟前快照）＋還原預設（回 zen，二段確認） */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 flex-1 cursor-pointer rounded-control border border-border py-2.5 text-xs font-bold transition-colors hover:bg-primary/5"
            data-testid="custom-theme-cancel"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={resetConfirm.handlePress}
            aria-live="polite"
            className={`min-h-11 flex-1 cursor-pointer rounded-control border py-2.5 text-xs font-bold transition-colors ${
              resetConfirm.isConfirming
                ? 'border-danger-text text-danger-text bg-danger-bg'
                : 'border-border hover:bg-primary/5'
            }`}
            data-testid="custom-theme-reset"
          >
            {resetConfirm.isConfirming
              ? t('settings.customThemeResetConfirm')
              : t('settings.customThemeReset')}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
