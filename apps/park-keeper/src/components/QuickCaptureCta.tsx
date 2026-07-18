import { Camera } from 'lucide-react';
import type { ThemeConfig } from '@app/park-keeper/types';

// ---------------------------------------------------------------------------
// 拍照 capture CTA（label 直包 input；iOS 捷徑 webapp:// 只開首頁的旗艦入口）
// hero：空狀態置頂 ≥30dvh；compact：有現役記錄時視覺權重讓位給取車 hero 卡。
// 自 Home 純搬移抽出（issue #725），行為零變更。
//
// 主動作唯一化（issue #753）：底部 + FAB 移除，其「開啟 QuickEntry 空照片模式」
// 職能遷移至本元件內的第三級文字動作 onManualEntry（功能不刪，僅降視覺層級）。
//
// soft depth（issue #753 視覺語言）：陰影節制（降低 alpha／擴散）＋淺色 1dp 邊框，
// 避免深色主題（literary 深栗紅等）在飽和主題色上呈現無層次的重色塊。
// ---------------------------------------------------------------------------
export default function QuickCaptureCta({
  theme,
  variant,
  label,
  hint,
  onPhotoSelected,
  onManualEntry,
  manualEntryLabel,
}: {
  theme: ThemeConfig;
  variant: 'hero' | 'compact';
  label: string;
  hint: string;
  onPhotoSelected: (file: File) => void;
  onManualEntry?: () => void;
  manualEntryLabel?: string;
}) {
  const input = (
    <input
      data-testid="quick-record-cta-input"
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onPhotoSelected(file);
        e.target.value = '';
      }}
    />
  );

  // 第三級文字動作：獨立於 label（camera capture input）之外的 sibling 按鈕，
  // 避免巢狀在 <label> 內誤觸發檔案選擇器。
  // 層級以 textMuted 實色呈現（四主題 vs background ≥4.55:1），不用 opacity dimming 壓對比。
  const manualEntryAction = onManualEntry && manualEntryLabel && (
    <div className="text-center">
      <button
        type="button"
        onClick={onManualEntry}
        className="inline-flex items-center justify-center min-h-11 min-w-11 px-4 text-xs font-bold underline underline-offset-4 hover:opacity-80 transition-opacity"
        style={{ color: theme.colors.textMuted }}
      >
        {manualEntryLabel}
      </button>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className="w-full space-y-2">
        <label
          data-testid="quick-record-cta"
          className="flex items-center justify-center gap-2.5 w-full min-h-14 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform border border-white/15"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.onPrimary,
            boxShadow: `${theme.colors.primary}26 0px 4px 14px`,
          }}
        >
          <Camera size={20} strokeWidth={2.25} />
          <span className="text-sm font-black tracking-wide">{label}</span>
          {input}
        </label>
        {manualEntryAction}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <label
        data-testid="quick-record-cta"
        className="flex flex-col items-center justify-center gap-3 w-full min-h-[32dvh] rounded-3xl cursor-pointer active:scale-[0.98] transition-transform border border-white/15"
        style={{
          backgroundColor: theme.colors.primary,
          color: theme.colors.onPrimary,
          boxShadow: `${theme.colors.primary}33 0px 8px 24px`,
        }}
      >
        <Camera size={44} strokeWidth={2.25} />
        <span className="text-lg font-black tracking-wide">{label}</span>
        {/* hint 用 onPrimary 實色：@70% 混色在 cute 僅 3.89:1 未達 AA，不做 opacity dimming。 */}
        <span className="text-[10px] font-bold uppercase tracking-[0.25em]">{hint}</span>
        {input}
      </label>
      {manualEntryAction}
    </div>
  );
}
