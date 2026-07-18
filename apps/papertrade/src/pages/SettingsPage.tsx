import { Info, ShieldAlert } from 'lucide-react';
import { DISCLAIMER_TEXT } from '../components/DisclaimerDialog';
import { ResetAccountButton } from '../components/ResetAccountButton';
import { APP_VERSION } from '../config/version';

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-5 lg:mx-auto lg:max-w-2xl">
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
            公開即時數據，下單、持倉與損益全部在你的裝置上以虛擬資金模擬計算。
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
