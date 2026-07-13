export type SfxName =
  | 'jump'
  | 'flap'
  | 'inhale'
  | 'swallow'
  | 'shoot'
  | 'hit'
  | 'hurt'
  | 'boss-roar'
  | 'boss-slam'
  | 'win'
  | 'lose';

// TODO(US-007)：以 zzfx 實作 §9 全部音效；inhale 為迴圈音，需回傳停止控制。
export function playSfx(_name: SfxName): void {
  // TODO(US-007)
}

// TODO(US-007)：首次觸控後 resume AudioContext（iOS 必須）。
export function unlockAudio(): void {
  // TODO(US-007)
}
