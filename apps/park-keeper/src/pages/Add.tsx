/**
 * /add 快速記錄頁：全螢幕快速記錄模式，無導覽 chrome。
 * 服務 Android manifest shortcuts、書籤與一般連結；iOS 捷徑走 webapp://（僅開首頁）。
 * 資安：query 僅白名單枚舉（from ∈ {'shortcut'}），不 render 原始字串、不落 storage。
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ParkingRecord, AppSettings } from '@app/park-keeper/types';
import { THEMES, DEFAULT_SETTINGS } from '@app/park-keeper/constants';
import { dbService } from '@app/park-keeper/services/db';
import { formatPlateLabel, PLATE_UNSET_SENTINEL } from '@app/park-keeper/services/formatPlate';
import { useThemeTokens } from '@app/park-keeper/hooks/useThemeTokens';
import QuickEntry from '@app/park-keeper/components/QuickEntry';

export default function Add() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  // query 白名單：from ∈ {'shortcut'}，僅用於隱藏返回鍵；未知值靜默降級。
  const fromShortcut = searchParams.get('from') === 'shortcut';

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [savedRecord, setSavedRecord] = useState<ParkingRecord | null>(null);
  const [formVisible, setFormVisible] = useState(true);

  const minimalistTheme = THEMES['minimalist'];
  const theme = THEMES[settings.theme] ?? minimalistTheme ?? THEMES['racing'];
  if (!theme) throw new Error('Theme config not found');

  useEffect(() => {
    const init = async () => {
      let savedSettings = DEFAULT_SETTINGS;
      try {
        savedSettings = await dbService.getSettings();
      } catch (error) {
        console.warn('Settings load failed, using defaults', error);
      }
      setSettings(savedSettings);
      // 捷徑使用者可能長期只走 /add：入頁即觸發保存天數清理，失敗靜默不阻斷記錄流程。
      dbService.runStartupCleanup(savedSettings.cacheDurationDays).catch(() => undefined);
    };
    void init();
  }, []);

  // 主題 token 接線與 Home 共用 hook，涵蓋完整 token 集合。
  useThemeTokens(theme);

  const handleSave = useCallback(async (data: Partial<ParkingRecord>) => {
    const newRecord: ParkingRecord = {
      id: crypto.randomUUID(),
      plateNumber: data.plateNumber ?? PLATE_UNSET_SENTINEL,
      floor: data.floor ?? '?',
      notes: data.notes ?? '',
      timestamp: Date.now(),
      photoData: data.photoData,
      hasPhoto: !!data.hasPhoto,
      latitude: data.latitude,
      longitude: data.longitude,
      parkedHeading: data.parkedHeading,
    };
    await dbService.saveRecord(newRecord);
    setSavedRecord(newRecord);
  }, []);

  const savedTime = savedRecord
    ? new Date(savedRecord.timestamp).toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans"
      style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
    >
      <header className="px-6 pb-2 pt-safe-top">
        <div className="max-w-md mx-auto w-full flex items-center gap-3 pt-4 min-h-14">
          {!fromShortcut && (
            <Link
              to="/"
              aria-label={t('action.back_home')}
              className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center active:bg-black/5 transition-colors"
            >
              <ArrowLeft size={22} />
            </Link>
          )}
          <h1 className="text-xl font-black tracking-tight">{t('add.title')}</h1>
        </div>
      </header>

      {/* Layout 已提供 main landmark，此處用 div 避免巢狀 main。 */}
      <div className="flex-1 pb-safe-bottom">
        {savedRecord && !formVisible ? (
          <div
            data-testid="add-summary"
            className="max-w-md mx-auto px-6 pt-10 flex flex-col items-center text-center gap-4"
          >
            <CheckCircle2 size={64} className="text-[var(--color-primary)]" strokeWidth={1.5} />
            {/* 摘要提示用 textMuted 實色（R6 掃蕩）：opacity-60 dimming 未達 AA。 */}
            <p className="text-sm font-bold" style={{ color: theme.colors.textMuted }}>
              {t('add.summary_hint')}
            </p>
            <div
              className="w-full rounded-3xl px-6 py-5 shadow-inner"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <div className="text-4xl font-black tracking-tight">{savedRecord.floor}</div>
              <div className="text-sm font-bold mt-1" style={{ color: theme.colors.textMuted }}>
                {/* 未填車號 sentinel 經 formatPlate SSOT 轉換（round-2 Sonnet R2-U2 第 4 渲染點）。 */}
                {formatPlateLabel(savedRecord.plateNumber, t('record.plate_unset'))}・{savedTime}
              </div>
              {savedRecord.latitude === undefined && (
                <div
                  data-testid="add-summary-no-location"
                  className="text-[10px] font-black uppercase tracking-wide mt-2"
                  style={{ color: theme.colors.textMuted }}
                >
                  {t('record.no_location')}
                </div>
              )}
            </div>
            <Link
              to="/"
              className="w-full h-14 rounded-2xl flex items-center justify-center font-black tracking-wide shadow-lg active:scale-[0.98] transition-transform"
              style={{ backgroundColor: theme.colors.primary, color: theme.colors.onPrimary }}
            >
              {t('action.back_home')}
            </Link>
          </div>
        ) : (
          <QuickEntry
            mode="fullscreen"
            theme={theme}
            onSave={handleSave}
            isVisible={formVisible}
            onClose={() => setFormVisible(false)}
            cacheDurationDays={settings.cacheDurationDays}
          />
        )}
      </div>
    </div>
  );
}
