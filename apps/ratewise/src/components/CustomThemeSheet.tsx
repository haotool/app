/**
 * CustomThemeSheet（E2 wave-C）：自訂主題色選色 BottomSheet。
 *
 * 內容由上而下：精選色票 → HexColorPicker（react-colorful，ADR-001）→
 * HexColorInput＋演算預覽 chip → 背景色調三選一（SegmentedControl）→ 恢復預設。
 * 即選即用：所有操作即時經 useAppTheme 走 deriveCustomThemeCssVars 管線全 app 跟色。
 * 選色面板為指標拖曳互動，sheet 關閉整片下拉（enableDrag=false）避免手勢衝突。
 *
 * @see .claude/prds/ratewise-e2c-color-picker-design.md
 * @see .claude/decisions/ADR-001-react-colorful.md
 */

import { useMemo } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { SegmentedControl } from './SegmentedControl';
import {
  CUSTOM_PRIMARY_PRESETS,
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

const BACKGROUND_TONE_ORDER: readonly CustomBackgroundTone[] = ['pure', 'warm', 'cool'];

/** 'R G B' 三元組 → rgb() 字串（預覽 chip 消費演算輸出）。 */
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

  // 預覽 chip：顯示演算後的 primary / primary-strong 對比（strong 為白字 AA 錨點）。
  const derived = useMemo(() => deriveCustomThemeCssVars(customPrimary), [customPrimary]);
  const strongRgb = tripleToRgb(derived['--color-primary-strong']);
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

  const toneLabels: Record<CustomBackgroundTone, string> = {
    pure: t('settings.customThemeTonePure'),
    warm: t('settings.customThemeToneWarm'),
    cool: t('settings.customThemeToneCool'),
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('styles.custom')}
      title={t('styles.custom')}
      closeLabel={t('common.close')}
      enableDrag={false}
      testId="custom-theme-sheet"
    >
      <div className="overflow-y-auto px-5 pb-6">
        {/* 精選色票 */}
        <p className="text-2xs font-black uppercase tracking-[0.2em] opacity-40 mb-3">
          {t('settings.customThemePresets')}
        </p>
        <div
          className="grid grid-cols-5 gap-3 mb-5"
          role="group"
          aria-label={t('settings.customThemePresets')}
        >
          {CUSTOM_PRIMARY_PRESETS.map((preset) => {
            const isActive = customPrimary.toUpperCase() === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onSelectPrimary(preset)}
                className={`relative mx-auto h-11 w-11 rounded-full shadow-sm ${
                  isActive ? 'ring-2 ring-offset-2' : ''
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
        <div className="custom-theme-picker mb-5" data-testid="custom-theme-picker">
          <HexColorPicker color={customPrimary} onChange={(hex) => onSelectPrimary(hex)} />
        </div>

        {/* HEX 輸入＋演算預覽 chip */}
        <div className="mb-5 flex items-end justify-between gap-3">
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
              className="flex h-11 w-14 items-center justify-center rounded-control text-sm font-bold shadow-sm"
              style={{
                backgroundColor: customPrimary,
                color: choosePrimaryForeground(customPrimary),
              }}
            >
              Aa
            </span>
            <span
              className="flex h-11 w-14 items-center justify-center rounded-control text-sm font-bold text-white shadow-sm"
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

        {/* 背景色調三選一（只切換 background / surface-sunken 淡色對） */}
        <p className="text-2xs font-black uppercase tracking-[0.2em] opacity-40 mb-3">
          {t('settings.customThemeBackgroundTone')}
        </p>
        <SegmentedControl
          value={customBackgroundTone}
          options={BACKGROUND_TONE_ORDER.map((tone) => ({
            value: tone,
            label: toneLabels[tone],
            testId: `background-tone-${tone}`,
          }))}
          onChange={onSelectBackgroundTone}
          ariaLabel={t('settings.customThemeBackgroundTone')}
          className="mb-5"
        />

        {/* 恢復預設（回 zen） */}
        <button
          type="button"
          onClick={onReset}
          className="w-full min-h-11 rounded-control border border-border py-2.5 text-xs font-bold transition-colors hover:bg-primary/5"
        >
          {t('settings.customThemeReset')}
        </button>
      </div>
    </BottomSheet>
  );
}
