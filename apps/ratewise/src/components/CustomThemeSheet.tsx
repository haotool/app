/**
 * CustomThemeSheet（E2 wave-D）：自訂主題色整頁沉浸式選色 sheet。
 *
 * 內容由上而下：即時預覽卡（模擬主畫面元素跟色）→ 精選色票（20 色 × 5 欄）→
 * HexColorPicker（react-colorful，ADR-001）→ HexColorInput＋演算預覽 chip →
 * 背景色調五選一（色調圓票）→ 恢復預設。
 * 即選即用：所有操作即時經 useAppTheme 走 deriveCustomThemeCssVars 管線全 app 跟色；
 * sheet 為整頁（size="full"）遮住主畫面，故頂部預覽卡承擔「所見即所得」回饋。
 * 選色面板為指標拖曳互動，sheet 關閉整片下拉（enableDrag=false）避免手勢衝突。
 *
 * @see .claude/prds/ratewise-e2c-color-picker-design.md
 * @see .claude/decisions/ADR-001-react-colorful.md
 */

import { useMemo } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { useTranslation } from 'react-i18next';
import { Check, Plus, TrendingUp } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import {
  CUSTOM_PRIMARY_PRESETS,
  CUSTOM_BACKGROUND_TONES,
  choosePrimaryForeground,
  deriveCustomThemeCssVars,
  isValidHexColor,
  type CustomBackgroundTone,
} from '../config/custom-theme';

export interface CustomThemeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  customPrimary: string;
  customBackgroundTone: CustomBackgroundTone;
  onSelectPrimary: (hex: string) => void;
  onSelectBackgroundTone: (tone: CustomBackgroundTone) => void;
  onReset: () => void;
}

const BACKGROUND_TONE_ORDER: readonly CustomBackgroundTone[] = [
  'pure',
  'warm',
  'cool',
  'mint',
  'rose',
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

  const handleHexInput = (raw: string) => {
    const value = raw.startsWith('#') ? raw : `#${raw}`;
    if (isValidHexColor(value)) {
      onSelectPrimary(value.toUpperCase());
    }
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
          <HexColorPicker color={customPrimary} onChange={(hex) => onSelectPrimary(hex)} />
        </div>

        {/* HEX 輸入＋演算預覽 chip */}
        <div className="mb-6 flex items-end justify-between gap-3">
          <label className="block">
            <span className="text-2xs font-black uppercase tracking-[0.2em] opacity-40">
              {t('settings.customThemeHex')}
            </span>
            <HexColorInput
              color={customPrimary}
              onChange={handleHexInput}
              prefixed
              spellCheck={false}
              autoComplete="off"
              className="mt-2 block w-28 min-h-11 rounded-control border border-border bg-transparent px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': customPrimary } as React.CSSProperties}
              aria-label={t('settings.customThemeHex')}
            />
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
        <div role="status" aria-live="polite" className="mb-5 empty:mb-0 empty:h-0">
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
                    isActive ? 'text-primary' : 'text-text-muted'
                  }`}
                >
                  {toneLabels[tone]}
                </span>
              </button>
            );
          })}
        </div>

        {/* 恢復預設（回 zen） */}
        <button
          type="button"
          onClick={onReset}
          className="w-full min-h-11 cursor-pointer rounded-control border border-border py-2.5 text-xs font-bold transition-colors hover:bg-primary/5"
        >
          {t('settings.customThemeReset')}
        </button>
      </div>
    </BottomSheet>
  );
}
