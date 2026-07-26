// v21-v30 章節素材 manifest 分檔（B06 起（五王動畫關鍵幀等，後續批次 append 於此））。
// 由 assets.ts 的 ASSETS 展開引用；與載入策略欄位擴充相容，維持 append-only。
export const ASSETS_V21_PART3: { key: string; url: string }[] = [
  // v21-v30 B06 Tariffang 動畫關鍵幀（載入時機建議：L22 魔王關載入，暫沿 Boot 預載）。
  {
    key: 'boss-tariffang-idle-2',
    url: new URL('../../assets/sprites/boss-tariffang-idle-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-idle-3',
    url: new URL('../../assets/sprites/boss-tariffang-idle-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-entry-1',
    url: new URL('../../assets/sprites/boss-tariffang-entry-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-entry-2',
    url: new URL('../../assets/sprites/boss-tariffang-entry-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-entry-3',
    url: new URL('../../assets/sprites/boss-tariffang-entry-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-entry-4',
    url: new URL('../../assets/sprites/boss-tariffang-entry-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move1-windup',
    url: new URL('../../assets/sprites/boss-tariffang-move1-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move1-charge',
    url: new URL('../../assets/sprites/boss-tariffang-move1-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move1-burst',
    url: new URL('../../assets/sprites/boss-tariffang-move1-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move1-recover',
    url: new URL('../../assets/sprites/boss-tariffang-move1-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move2-windup',
    url: new URL('../../assets/sprites/boss-tariffang-move2-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move2-charge',
    url: new URL('../../assets/sprites/boss-tariffang-move2-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move2-burst',
    url: new URL('../../assets/sprites/boss-tariffang-move2-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move2-recover',
    url: new URL('../../assets/sprites/boss-tariffang-move2-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move3-windup',
    url: new URL('../../assets/sprites/boss-tariffang-move3-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move3-charge',
    url: new URL('../../assets/sprites/boss-tariffang-move3-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move3-burst',
    url: new URL('../../assets/sprites/boss-tariffang-move3-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-move3-recover',
    url: new URL('../../assets/sprites/boss-tariffang-move3-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p2trans-1',
    url: new URL('../../assets/sprites/boss-tariffang-p2trans-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p2trans-2',
    url: new URL('../../assets/sprites/boss-tariffang-p2trans-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p2trans-3',
    url: new URL('../../assets/sprites/boss-tariffang-p2trans-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p2trans-4',
    url: new URL('../../assets/sprites/boss-tariffang-p2trans-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p2trans-5',
    url: new URL('../../assets/sprites/boss-tariffang-p2trans-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p2trans-6',
    url: new URL('../../assets/sprites/boss-tariffang-p2trans-6.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p3trans-1',
    url: new URL('../../assets/sprites/boss-tariffang-p3trans-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p3trans-2',
    url: new URL('../../assets/sprites/boss-tariffang-p3trans-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p3trans-3',
    url: new URL('../../assets/sprites/boss-tariffang-p3trans-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p3trans-4',
    url: new URL('../../assets/sprites/boss-tariffang-p3trans-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p3trans-5',
    url: new URL('../../assets/sprites/boss-tariffang-p3trans-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p3trans-6',
    url: new URL('../../assets/sprites/boss-tariffang-p3trans-6.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-p3trans-7',
    url: new URL('../../assets/sprites/boss-tariffang-p3trans-7.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-hit-1',
    url: new URL('../../assets/sprites/boss-tariffang-hit-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-hit-2',
    url: new URL('../../assets/sprites/boss-tariffang-hit-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-death-1',
    url: new URL('../../assets/sprites/boss-tariffang-death-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-death-2',
    url: new URL('../../assets/sprites/boss-tariffang-death-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-death-3',
    url: new URL('../../assets/sprites/boss-tariffang-death-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-death-4',
    url: new URL('../../assets/sprites/boss-tariffang-death-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-death-5',
    url: new URL('../../assets/sprites/boss-tariffang-death-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-death-6',
    url: new URL('../../assets/sprites/boss-tariffang-death-6.webp', import.meta.url).href,
  },
];
