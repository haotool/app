/**
 * CustomThemeSheet（E2 wave-D＋E7 wave-B/C）：自訂主題色整頁沉浸式選色 sheet。
 *
 * 內容由上而下：即時預覽縮影卡（QA-I #3，真實元件縮影：匯率卡＋品牌 CTA＋底部導覽）→
 * 精選色票（v3 單列 8 格，內建主題近似色剔除）＋「自訂…」（react-colorful＋HEX 收合為進階項）→
 * 對比 gate 警告（近白/近黑主色＋一鍵採用建議色）→ 背景色調單列 6 preset（色調圓票）＋
 * 亮度滑桿（wave-C 連續 tone：任意 L 值 AA 不破）→ 取消／還原預設（二段確認）。
 * v3 緊湊化合約：390×844 sheet 開啟時上列全部控件一屏內完整可見（零捲動）。
 * slim（≤360px，#686）：預覽卡收合為單行摘要（隱藏底部導覽縮影）＋區塊間距收斂，
 * 320×568 預設態同樣零捲動；44px 熱區與 375+ 版面不變。
 *
 * 預覽縮影卡合約（wave-C）：只消費與全站相同的 CSS 變數（Tailwind 語義 token），
 * 禁止獨立配色計算——draft previewTheme 已把派生變數即時寫入 documentElement inline vars，
 * 預覽卡直接繼承，與實際渲染一致性由 CustomThemeSheet.preview-parity 測試守門。
 *
 * E7 wave-B draft 語意：sheet 開啟期間變更即時預覽全站但不持久化；
 * 關閉 sheet＝commit、「取消」＝回滾開啟前快照（由 useCustomThemeDraft 編排）。
 * 選色面板為指標拖曳互動，sheet 關閉整片下拉（enableDrag=false）避免手勢衝突。
 *
 * @see .claude/prds/custom-theme-v2-design.md（3.1 資訊架構＋第 4 節 wave-C＋第 6 節對策 #3/#6）
 * @see .claude/decisions/ADR-001-react-colorful.md
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Home, Plus, Settings, Star, TrendingUp, Wand2 } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { useInlineConfirm } from '../hooks/useInlineConfirm';
import {
  CUSTOM_PRIMARY_PRESETS,
  CUSTOM_BACKGROUND_TONES,
  DEFAULT_CUSTOM_PRIMARY,
  backgroundToneValueHex,
  choosePrimaryForeground,
  continuousToneHexAtPosition,
  deriveCustomThemeCssVars,
  evaluatePrimaryContrastGate,
  sanitizeHexInput,
  sliderPositionForToneValue,
  type CustomBackgroundTone,
  type CustomBackgroundToneValue,
} from '../config/custom-theme';

export interface CustomThemeSheetProps {
  isOpen: boolean;
  /** 關閉 sheet（X / backdrop / Esc）＝ commit draft。 */
  onClose: () => void;
  /** 取消＝回滾開啟前快照後關閉。 */
  onCancel: () => void;
  customPrimary: string;
  customBackgroundTone: CustomBackgroundToneValue;
  onSelectPrimary: (hex: string) => void;
  onSelectBackgroundTone: (tone: CustomBackgroundToneValue) => void;
  onReset: () => void;
}

// v3 緊湊化：單列 6 preset（淺 3＋深 3）；mint/rose 保留 enum 向後相容
//（持久化資料仍有效），UI 入口由亮度滑桿的連續 tone 覆蓋。
const BACKGROUND_TONE_ORDER: readonly CustomBackgroundTone[] = [
  'pure',
  'warm',
  'cool',
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

/** 16ms trailing debounce（選色/滑桿拖動共用；與 derive memoize 並用，PM 簡報第 5 節）。 */
function useTrailingDebounce16<T>(commit: (value: T) => void) {
  const pendingRef = useRef<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedule = useCallback(
    (value: T) => {
      pendingRef.current = value;
      if (timerRef.current !== null) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (pendingRef.current !== null) commit(pendingRef.current);
      }, 16);
    },
    [commit],
  );
  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );
  return schedule;
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

  // clamp/gate 提示邏輯用演算輸出（非預覽渲染；預覽卡只消費 CSS 變數）。
  const derived = useMemo(
    () => deriveCustomThemeCssVars(customPrimary, customBackgroundTone),
    [customPrimary, customBackgroundTone],
  );
  // 可讀性回饋（#632）：on-surface 被 clamp（≠ raw primary）時提示文字將自動加深。
  const isTextClamped = derived['--color-primary-on-surface'] !== derived['--color-primary'];
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

  // 「自訂…」進階區（QA-I #6）：色域盤與 HEX 收合；開啟 sheet 時若主色非精選票即自動展開。
  // v3：預設品牌藍不再屬精選票（內建近似色剔除），視為已知色維持收合（一屏合約）。
  const [showAdvanced, setShowAdvanced] = useState(false);
  useEffect(() => {
    if (isOpen) {
      const normalized = customPrimary.toUpperCase();
      setShowAdvanced(
        normalized !== DEFAULT_CUSTOM_PRIMARY &&
          !CUSTOM_PRIMARY_PRESETS.includes(normalized as (typeof CUSTOM_PRIMARY_PRESETS)[number]),
      );
    }
    // 僅在 sheet 開啟時機決定初始展開態，不追隨後續選色。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const schedulePrimary = useTrailingDebounce16(onSelectPrimary);
  const scheduleTone = useTrailingDebounce16(onSelectBackgroundTone);

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

  // 亮度滑桿（wave-C 連續 tone）：拖動中以本地值呈現（消除反映射抖動），
  // 16ms debounce 產生任意 background hex；放開後回歸 prop 反映射位置。
  const [toneSliderDraft, setToneSliderDraft] = useState<number | null>(null);
  // 拖動 hue 錨（review 修正）：拖動起始鎖定當前 tone 為色相/飽和度來源，
  // 過程中不隨 debounced tone 回寫漂移（近黑端 hex 捨入會使色相失真並逐步累積）；
  // 放開滑桿/點 preset 圓票/關閉 sheet 時釋放，下次拖動以當時 tone 重新取錨。
  const [toneHueAnchor, setToneHueAnchor] = useState<string | null>(null);
  const toneSliderValue =
    toneSliderDraft ?? Math.round(sliderPositionForToneValue(customBackgroundTone) * 100);
  const toneHueSourceHex = toneHueAnchor ?? backgroundToneValueHex(customBackgroundTone);
  const handleToneSlider = (raw: number) => {
    if (toneHueAnchor === null) setToneHueAnchor(toneHueSourceHex);
    setToneSliderDraft(raw);
    scheduleTone(continuousToneHexAtPosition(raw / 100, toneHueSourceHex));
  };
  const endToneSlide = () => {
    setToneSliderDraft(null);
    setToneHueAnchor(null);
  };
  useEffect(() => {
    if (!isOpen) {
      setToneSliderDraft(null);
      setToneHueAnchor(null);
    }
  }, [isOpen]);

  const handleSelectTone = (tone: CustomBackgroundTone) => {
    selectionHaptic();
    endToneSlide();
    onSelectBackgroundTone(tone);
  };

  // 滑桿軌道渲染實際映射取樣（深域 → 死域跳點 → 淺域），供拖動前預期落點。
  const toneTrackGradient = useMemo(() => {
    const stops = [0, 0.25, 0.499, 0.5, 0.75, 1]
      .map(
        (position) =>
          `${continuousToneHexAtPosition(position, toneHueSourceHex)} ${position * 100}%`,
      )
      .join(', ');
    return `linear-gradient(to right, ${stops})`;
  }, [toneHueSourceHex]);

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
      <div className="overflow-y-auto px-5 pb-8 slim:pb-4">
        {/* 即時預覽縮影卡（QA-I #3）：真實元件縮影——匯率卡（surface 層次＋on-surface 文字）、
            品牌 CTA（bg-primary-strong，與全站 addToHistory 同 token）、底部導覽 active 指示。
            只消費全站語義 token（CSS 變數），draft 即時繼承 inline vars（含深色調）。
            slim（#686 320 檔零捲動）：收合為單行摘要——幣別對＋匯率併一行、導覽縮影隱藏。 */}
        <div
          className="mb-4 max-h-[120px] overflow-hidden rounded-card border border-border/50 bg-background transition-colors duration-300 slim:mb-2.5"
          data-testid="custom-theme-live-preview"
          aria-label={t('settings.customThemePreview')}
        >
          <div className="mx-2.5 mt-2.5 rounded-xl bg-surface px-3 py-2 slim:mx-2 slim:mb-2 slim:mt-2 slim:py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 slim:flex slim:items-baseline slim:gap-1.5">
                <p className="whitespace-nowrap text-2xs leading-tight text-text-muted">USD→TWD</p>
                <p className="text-sm font-bold leading-tight tabular-nums text-text">32,215</p>
              </div>
              <span className="hidden shrink-0 items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-2xs font-bold text-primary-text min-[360px]:flex">
                <TrendingUp
                  className="h-3 w-3 text-[rgb(var(--color-chart-line))]"
                  aria-hidden="true"
                />
                32.215
              </span>
              <button
                type="button"
                tabIndex={-1}
                className="pointer-events-none flex shrink-0 items-center gap-1 rounded-xl bg-primary-strong px-2.5 py-1.5 text-2xs font-semibold text-white transition-colors duration-300 slim:py-1"
                aria-hidden="true"
                data-testid="custom-theme-preview-cta"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                {t('singleConverter.addToHistory')}
              </button>
            </div>
          </div>
          <div
            className="mt-1.5 flex items-start justify-around border-t border-border/60 px-4 pb-1 pt-1.5 slim:hidden"
            data-testid="custom-theme-preview-nav"
            aria-hidden="true"
          >
            <span className="relative flex flex-col items-center text-primary-on-surface">
              <Home className="h-3.5 w-3.5" />
              <span className="mt-0.5 h-[2.5px] w-4 rounded-t-full bg-[rgb(var(--color-primary-on-surface))]" />
            </span>
            <span className="flex flex-col items-center text-text-muted">
              <Star className="h-3.5 w-3.5" />
              <span className="mt-0.5 h-[2.5px] w-4" />
            </span>
            <span className="flex flex-col items-center text-text-muted">
              <Settings className="h-3.5 w-3.5" />
              <span className="mt-0.5 h-[2.5px] w-4" />
            </span>
          </div>
        </div>

        {/* 精選色票（v3 緊湊化：單列 8 格不換行；內建主題近似色已剔除——色距測試守門）。
            熱區高 44px（min-h-11）、寬隨格寬（320px 下 ~35px，WCAG 2.5.8 ≥24px 達標；
            8 格已滿版，負邊距外擴必與鄰格重疊故不外擴）。圓票兩級收斂：slim（≤360px）
            h-8＋選中 ring offset 歸零、narrow（≤349px）h-7——經典捲軸環境（e2e headless）
            格寬再少 ~2px 仍不互貼、ring 不觸鄰票（320px bounding box e2e 守門）。 */}
        <p className="text-2xs font-black uppercase tracking-[0.2em] opacity-40 mb-2 slim:mb-1.5">
          {t('settings.customThemePresets')}
        </p>
        <div
          className="grid grid-cols-8 mb-2 slim:mb-1.5"
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
                className="group/swatch flex min-h-11 w-full cursor-pointer items-center justify-center"
                aria-pressed={isActive}
                aria-label={`${t('styles.custom')} ${preset}`}
              >
                <span
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-[transform,filter] duration-150 ease-out group-hover/swatch:brightness-110 group-active/swatch:scale-90 motion-reduce:transition-none slim:h-8 slim:w-8 narrow:h-7 narrow:w-7 ${
                    isActive ? 'ring-2 ring-offset-1 scale-105 slim:ring-offset-0' : ''
                  }`}
                  style={
                    {
                      backgroundColor: preset,
                      '--tw-ring-color': preset,
                      '--tw-ring-offset-color': 'rgb(var(--color-surface))',
                    } as React.CSSProperties
                  }
                  aria-hidden="true"
                >
                  {isActive && (
                    <Check className="h-4 w-4" style={{ color: choosePrimaryForeground(preset) }} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="mb-4 flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-control border border-border py-2 text-xs font-bold transition-colors hover:bg-primary/5 slim:mb-2.5"
          aria-expanded={showAdvanced}
          data-testid="custom-theme-advanced-toggle"
        >
          {t('settings.customThemeCustomize')}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {showAdvanced && (
          <div data-testid="custom-theme-advanced">
            {/* 二維選色面板（飽和度面板＋色相條，樣式覆寫見 index.css .custom-theme-picker） */}
            <div className="custom-theme-picker mb-4" data-testid="custom-theme-picker">
              <HexColorPicker color={customPrimary} onChange={schedulePrimary} />
            </div>

            {/* HEX 輸入＋演算預覽 chip（token 消費：raw primary 與 strong 白字錨點） */}
            <div className="mb-4 flex items-end justify-between gap-3">
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
                  className="flex h-11 w-14 items-center justify-center rounded-control bg-primary text-sm font-bold shadow-sm transition-colors duration-300"
                  style={{ color: choosePrimaryForeground(customPrimary) }}
                >
                  Aa
                </span>
                <span className="flex h-11 w-14 items-center justify-center rounded-control bg-primary-strong text-sm font-bold text-white shadow-sm transition-colors duration-300">
                  Aa
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 可讀性回饋（#632）：過淺主色不硬擋，即時預覽 clamp 後的實效文字色。 */}
        <div
          role="status"
          aria-live="polite"
          className="mb-4 empty:mb-0 empty:h-0 space-y-2.5 slim:mb-2.5"
        >
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
                className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-control bg-surface px-3 py-2 text-xs font-bold text-primary-on-surface shadow-sm transition-transform active:scale-95 motion-reduce:transition-none"
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
              className="flex items-center gap-3 rounded-control bg-surface-sunken px-3 py-2.5 slim:py-2"
              data-testid="custom-theme-contrast-notice"
            >
              <span
                className="flex h-9 w-12 shrink-0 items-center justify-center rounded-compact bg-surface text-sm font-bold text-primary-on-surface shadow-sm slim:h-7"
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

        {/* 背景色調單列 6 preset（v3 緊湊化）：色調圓票直接呈現底色（所見即所得）。 */}
        <p className="text-2xs font-black uppercase tracking-[0.2em] opacity-40 mb-2 slim:mb-1.5">
          {t('settings.customThemeBackgroundTone')}
        </p>
        <div
          className="mb-3 grid grid-cols-6 gap-1 slim:mb-2"
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
                className="group flex cursor-pointer flex-col items-center gap-1 slim:gap-0.5"
                aria-pressed={isActive}
                data-testid={`background-tone-${tone}`}
              >
                <span
                  className={`h-9 w-9 rounded-full border transition-all duration-150 ease-out group-active:scale-90 motion-reduce:transition-none slim:h-8 slim:w-8 ${
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

        {/* 亮度滑桿（wave-C 連續 tone）：0＝最深、100＝最淺；任意位置 AA 派生鏈守門。 */}
        <label className="mb-4 block slim:mb-2.5">
          <span className="text-2xs font-black uppercase tracking-[0.2em] opacity-40">
            {t('settings.customThemeToneBrightness')}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={toneSliderValue}
            onChange={(event) => handleToneSlider(Number(event.target.value))}
            onPointerUp={endToneSlide}
            onBlur={endToneSlide}
            className="custom-tone-slider mt-2 block w-full cursor-pointer slim:mt-1.5"
            style={{ backgroundImage: toneTrackGradient }}
            aria-label={t('settings.customThemeToneBrightness')}
            data-testid="custom-theme-tone-slider"
          />
        </label>

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
