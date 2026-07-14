import { Settings } from 'lucide-react';
import { PlaceholderPage } from '../components/PlaceholderPage';

export function SettingsPage() {
  return (
    <PlaceholderPage
      icon={Settings}
      title="設定"
      description="本站為模擬交易工具，非投資建議；行情數據來源為 Bybit 公開行情。"
    />
  );
}
