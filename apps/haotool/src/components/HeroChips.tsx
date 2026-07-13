import { MapPin, PawPrint, TrendingUp } from 'lucide-react';

// 三枚 chips 規格 SSOT（motion-deep-dive §2 S2 表）：尺寸/底色/radius 由 CSS class 承載。
const CHIPS = [
  { id: 'a', Icon: TrendingUp },
  { id: 'b', Icon: PawPrint },
  { id: 'c', Icon: MapPin },
] as const;

/**
 * 行動 hero 漂浮 chips（motion-deep-dive §2 S2）：<1024px 首屏視覺記憶點。
 * 純裝飾（aria-hidden、pointer-events:none）、純 CSS 動畫、零點陣圖；
 * 父層 chip-scroll 承載 @supports 滾動視差、子層 hero-chip 承載慢漂（transform 不互相覆蓋）。
 */
export default function HeroChips() {
  return (
    <div className="hero-chips" aria-hidden="true" data-testid="hero-chips">
      {CHIPS.map(({ id, Icon }) => (
        <span key={id} className={`chip-scroll chip-scroll-${id}`}>
          <span className={`hero-chip hero-chip-${id}`}>
            <Icon className="size-5 text-primary-strong" strokeWidth={2} aria-hidden="true" />
          </span>
        </span>
      ))}
    </div>
  );
}
