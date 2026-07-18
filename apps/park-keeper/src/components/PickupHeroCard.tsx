/**
 * PickupHeroCard – 取車 hero 卡（issue #725 首屏 IA 裁決）
 * 有現役記錄時置頂：照片大縮圖＋display 級樓層字＋車號＋經過時間，tap 直入羅盤導引。
 */
import { useTranslation } from 'react-i18next';
import { Car, Clock, MapPin, Navigation } from 'lucide-react';
import type { ThemeConfig, ParkingRecord } from '@app/park-keeper/types';
import { formatPlateLabel } from '@app/park-keeper/services/formatPlate';
import { formatSmartTime } from '@app/park-keeper/services/formatSmartTime';

interface PickupHeroCardProps {
  record: ParkingRecord;
  theme: ThemeConfig;
  onNavigate: (record: ParkingRecord) => void;
}

export default function PickupHeroCard({ record, theme, onNavigate }: PickupHeroCardProps) {
  const { t, i18n } = useTranslation();
  const elapsed = formatSmartTime(record.timestamp, i18n.language, t('home.just_now'));
  const plateLabel = formatPlateLabel(record.plateNumber, t('record.plate_unset'));

  return (
    <button
      type="button"
      data-testid="pickup-hero-card"
      onClick={() => onNavigate(record)}
      aria-label={t('home.pickup_hero_aria', { floor: record.floor })}
      className="block w-full rounded-4xl overflow-hidden shadow-elevation-3 text-left active:scale-[0.99] transition-transform"
      style={{
        backgroundColor: theme.colors.surface,
        boxShadow: `${theme.colors.primary}2E 0px 14px 38px`,
      }}
    >
      {/* 照片大縮圖：無照片時以品牌色佔位，維持 hero 視覺份量 */}
      <div
        className="relative h-44 w-full"
        style={{ backgroundColor: `${theme.colors.primary}12` }}
      >
        {record.photoData ? (
          <img
            src={record.photoData}
            alt=""
            className="w-full h-full object-cover"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car
              size={52}
              strokeWidth={1.5}
              style={{ color: theme.colors.primary, opacity: 0.45 }}
            />
          </div>
        )}
        {/* 徽章文字用 text 實色（R6 掃蕩）：Kawaii pastel primary on 白 surface 僅 1.66:1。 */}
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur-md"
          style={{ backgroundColor: `${theme.colors.surface}E6`, color: theme.colors.text }}
        >
          <MapPin size={10} strokeWidth={3} />
          {t('home.pickup_label')}
        </span>
      </div>

      <div className="px-6 py-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {/* display 級樓層字（text-6xl = 60px ≥ 40px brief 門檻） */}
          <p
            className="text-6xl font-black tracking-tighter leading-none truncate"
            style={{ color: theme.colors.text }}
          >
            {record.floor}
          </p>
          {/* 車號/時間列用 textMuted 實色（R6 掃蕩）：text@65% 於 cute 僅 2.8:1。 */}
          <p
            className="mt-2 flex items-center gap-2 text-xs font-bold truncate"
            style={{ color: theme.colors.textMuted }}
          >
            <span className="truncate">{plateLabel}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock size={12} />
              {elapsed}
            </span>
          </p>
        </div>
        <span
          aria-hidden
          className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Navigation size={24} color={theme.colors.onPrimary} strokeWidth={2.5} />
        </span>
      </div>
    </button>
  );
}
