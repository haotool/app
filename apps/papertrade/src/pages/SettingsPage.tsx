import clsx from 'clsx';
import { Info, ShieldAlert } from 'lucide-react';
import { DISCLAIMER_TEXT } from '../components/DisclaimerDialog';
import { ResetAccountButton } from '../components/ResetAccountButton';
import { APP_VERSION } from '../config/version';
import { useSoundPrefsStore } from '../stores/soundPrefsStore';

function LiquidationSoundToggle() {
  const enabled = useSoundPrefsStore((state) => state.liquidationSound);
  const toggle = useSoundPrefsStore((state) => state.toggleLiquidationSound);

  return (
    // 外殼滿足 44px 觸控契約；內層 span 為視覺 track。
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="強平提示音"
      onClick={toggle}
      className="flex min-h-11 min-w-11 shrink-0 items-center justify-end"
    >
      <span
        className={clsx(
          'relative h-7 w-12 rounded-full transition-colors',
          'after:absolute after:top-1 after:size-5 after:rounded-full after:bg-text after:transition-[left]',
          enabled ? 'bg-primary after:left-6' : 'bg-surface-2 after:left-1',
        )}
      />
    </button>
  );
}

export function SettingsPage() {
  return (
    // pt 疊加 safe-area：非 sticky 頁由頁根消費 --sat（R6-1）。
    <div className="flex flex-col gap-4 px-4 pb-6 pt-[calc(1.25rem+var(--sat))] lg:mx-auto lg:max-w-2xl">
      <h1 className="text-price-lg font-semibold">設定</h1>

      <section
        aria-label="關於"
        className="flex gap-3 rounded-card border border-border bg-surface p-4"
      >
        <Info size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
        <div>
          <h2 className="text-body font-medium">關於 PaperTrade</h2>
          <p className="mt-1 text-label leading-relaxed text-text-2">
            零風險模擬合約交易所。行情為 Bybit
            公開即時數據；下單、持倉與損益均於本機裝置以虛擬資金模擬計算。
          </p>
          <p className="mt-2 text-caption text-text-3 tabular-nums">版本 v{APP_VERSION}</p>
        </div>
      </section>

      <section
        aria-label="免責聲明"
        className="flex gap-3 rounded-card border border-border bg-surface p-4"
      >
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-warning" aria-hidden />
        <div>
          <h2 className="text-body font-medium">免責聲明</h2>
          <p className="mt-1 text-label leading-relaxed text-text-2">{DISCLAIMER_TEXT}</p>
        </div>
      </section>

      <section aria-label="音效" className="rounded-card border border-border bg-surface p-4">
        <h2 className="text-body font-medium">音效</h2>
        <div className="mt-3 flex min-h-11 items-center justify-between gap-3">
          <div>
            <p className="text-label text-text">強平提示音</p>
            <p className="mt-0.5 text-caption text-text-3">持倉遭強制平倉時播放提示音。</p>
          </div>
          <LiquidationSoundToggle />
        </div>
      </section>

      <section aria-label="資料管理" className="rounded-card border border-border bg-surface p-4">
        <h2 className="text-body font-medium">資料管理</h2>
        <p className="mt-1 text-label text-text-2">
          模擬帳戶資料僅儲存於本機瀏覽器，重置後即無法復原。
        </p>
        <div className="mt-3">
          <ResetAccountButton />
        </div>
      </section>
    </div>
  );
}
