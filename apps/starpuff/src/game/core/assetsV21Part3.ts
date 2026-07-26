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
  // v21-v30 B06 Maridella 動畫關鍵幀（載入時機建議：L24 魔王關載入，暫沿 Boot 預載）。
  {
    key: 'boss-maridella-idle-2',
    url: new URL('../../assets/sprites/boss-maridella-idle-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-idle-3',
    url: new URL('../../assets/sprites/boss-maridella-idle-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-entry-1',
    url: new URL('../../assets/sprites/boss-maridella-entry-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-entry-2',
    url: new URL('../../assets/sprites/boss-maridella-entry-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-entry-3',
    url: new URL('../../assets/sprites/boss-maridella-entry-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-entry-4',
    url: new URL('../../assets/sprites/boss-maridella-entry-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move1-windup',
    url: new URL('../../assets/sprites/boss-maridella-move1-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move1-charge',
    url: new URL('../../assets/sprites/boss-maridella-move1-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move1-burst',
    url: new URL('../../assets/sprites/boss-maridella-move1-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move1-recover',
    url: new URL('../../assets/sprites/boss-maridella-move1-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move2-windup',
    url: new URL('../../assets/sprites/boss-maridella-move2-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move2-charge',
    url: new URL('../../assets/sprites/boss-maridella-move2-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move2-burst',
    url: new URL('../../assets/sprites/boss-maridella-move2-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move2-recover',
    url: new URL('../../assets/sprites/boss-maridella-move2-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move3-windup',
    url: new URL('../../assets/sprites/boss-maridella-move3-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move3-charge',
    url: new URL('../../assets/sprites/boss-maridella-move3-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move3-burst',
    url: new URL('../../assets/sprites/boss-maridella-move3-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-move3-recover',
    url: new URL('../../assets/sprites/boss-maridella-move3-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p2trans-1',
    url: new URL('../../assets/sprites/boss-maridella-p2trans-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p2trans-2',
    url: new URL('../../assets/sprites/boss-maridella-p2trans-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p2trans-3',
    url: new URL('../../assets/sprites/boss-maridella-p2trans-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p2trans-4',
    url: new URL('../../assets/sprites/boss-maridella-p2trans-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p2trans-5',
    url: new URL('../../assets/sprites/boss-maridella-p2trans-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p2trans-6',
    url: new URL('../../assets/sprites/boss-maridella-p2trans-6.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p3trans-1',
    url: new URL('../../assets/sprites/boss-maridella-p3trans-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p3trans-2',
    url: new URL('../../assets/sprites/boss-maridella-p3trans-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p3trans-3',
    url: new URL('../../assets/sprites/boss-maridella-p3trans-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p3trans-4',
    url: new URL('../../assets/sprites/boss-maridella-p3trans-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p3trans-5',
    url: new URL('../../assets/sprites/boss-maridella-p3trans-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p3trans-6',
    url: new URL('../../assets/sprites/boss-maridella-p3trans-6.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-p3trans-7',
    url: new URL('../../assets/sprites/boss-maridella-p3trans-7.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-hit-1',
    url: new URL('../../assets/sprites/boss-maridella-hit-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-hit-2',
    url: new URL('../../assets/sprites/boss-maridella-hit-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-death-1',
    url: new URL('../../assets/sprites/boss-maridella-death-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-death-2',
    url: new URL('../../assets/sprites/boss-maridella-death-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-death-3',
    url: new URL('../../assets/sprites/boss-maridella-death-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-death-4',
    url: new URL('../../assets/sprites/boss-maridella-death-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-death-5',
    url: new URL('../../assets/sprites/boss-maridella-death-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-death-6',
    url: new URL('../../assets/sprites/boss-maridella-death-6.webp', import.meta.url).href,
  },
  // v21-v30 B06 Reflector 動畫關鍵幀（載入時機建議：L26 魔王關載入，暫沿 Boot 預載）。
  {
    key: 'boss-reflector-idle-2',
    url: new URL('../../assets/sprites/boss-reflector-idle-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-idle-3',
    url: new URL('../../assets/sprites/boss-reflector-idle-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-entry-1',
    url: new URL('../../assets/sprites/boss-reflector-entry-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-entry-2',
    url: new URL('../../assets/sprites/boss-reflector-entry-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-entry-3',
    url: new URL('../../assets/sprites/boss-reflector-entry-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-entry-4',
    url: new URL('../../assets/sprites/boss-reflector-entry-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move1-windup',
    url: new URL('../../assets/sprites/boss-reflector-move1-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move1-charge',
    url: new URL('../../assets/sprites/boss-reflector-move1-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move1-burst',
    url: new URL('../../assets/sprites/boss-reflector-move1-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move1-recover',
    url: new URL('../../assets/sprites/boss-reflector-move1-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move2-windup',
    url: new URL('../../assets/sprites/boss-reflector-move2-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move2-charge',
    url: new URL('../../assets/sprites/boss-reflector-move2-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move2-burst',
    url: new URL('../../assets/sprites/boss-reflector-move2-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move2-recover',
    url: new URL('../../assets/sprites/boss-reflector-move2-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move3-windup',
    url: new URL('../../assets/sprites/boss-reflector-move3-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move3-charge',
    url: new URL('../../assets/sprites/boss-reflector-move3-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move3-burst',
    url: new URL('../../assets/sprites/boss-reflector-move3-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-move3-recover',
    url: new URL('../../assets/sprites/boss-reflector-move3-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p2trans-1',
    url: new URL('../../assets/sprites/boss-reflector-p2trans-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p2trans-2',
    url: new URL('../../assets/sprites/boss-reflector-p2trans-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p2trans-3',
    url: new URL('../../assets/sprites/boss-reflector-p2trans-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p2trans-4',
    url: new URL('../../assets/sprites/boss-reflector-p2trans-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p2trans-5',
    url: new URL('../../assets/sprites/boss-reflector-p2trans-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p2trans-6',
    url: new URL('../../assets/sprites/boss-reflector-p2trans-6.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p3trans-1',
    url: new URL('../../assets/sprites/boss-reflector-p3trans-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p3trans-2',
    url: new URL('../../assets/sprites/boss-reflector-p3trans-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p3trans-3',
    url: new URL('../../assets/sprites/boss-reflector-p3trans-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p3trans-4',
    url: new URL('../../assets/sprites/boss-reflector-p3trans-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p3trans-5',
    url: new URL('../../assets/sprites/boss-reflector-p3trans-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p3trans-6',
    url: new URL('../../assets/sprites/boss-reflector-p3trans-6.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-p3trans-7',
    url: new URL('../../assets/sprites/boss-reflector-p3trans-7.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-hit-1',
    url: new URL('../../assets/sprites/boss-reflector-hit-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-hit-2',
    url: new URL('../../assets/sprites/boss-reflector-hit-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-death-1',
    url: new URL('../../assets/sprites/boss-reflector-death-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-death-2',
    url: new URL('../../assets/sprites/boss-reflector-death-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-death-3',
    url: new URL('../../assets/sprites/boss-reflector-death-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-death-4',
    url: new URL('../../assets/sprites/boss-reflector-death-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-death-5',
    url: new URL('../../assets/sprites/boss-reflector-death-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-death-6',
    url: new URL('../../assets/sprites/boss-reflector-death-6.webp', import.meta.url).href,
  },
  // v21-v30 B06 Gravion 動畫關鍵幀（載入時機建議：L28 魔王關載入，暫沿 Boot 預載）。
  {
    key: 'boss-gravion-idle-2',
    url: new URL('../../assets/sprites/boss-gravion-idle-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-idle-3',
    url: new URL('../../assets/sprites/boss-gravion-idle-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-entry-1',
    url: new URL('../../assets/sprites/boss-gravion-entry-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-entry-2',
    url: new URL('../../assets/sprites/boss-gravion-entry-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-entry-3',
    url: new URL('../../assets/sprites/boss-gravion-entry-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-entry-4',
    url: new URL('../../assets/sprites/boss-gravion-entry-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move1-windup',
    url: new URL('../../assets/sprites/boss-gravion-move1-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move1-charge',
    url: new URL('../../assets/sprites/boss-gravion-move1-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move1-burst',
    url: new URL('../../assets/sprites/boss-gravion-move1-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move1-recover',
    url: new URL('../../assets/sprites/boss-gravion-move1-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move2-windup',
    url: new URL('../../assets/sprites/boss-gravion-move2-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move2-charge',
    url: new URL('../../assets/sprites/boss-gravion-move2-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move2-burst',
    url: new URL('../../assets/sprites/boss-gravion-move2-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move2-recover',
    url: new URL('../../assets/sprites/boss-gravion-move2-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move3-windup',
    url: new URL('../../assets/sprites/boss-gravion-move3-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move3-charge',
    url: new URL('../../assets/sprites/boss-gravion-move3-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move3-burst',
    url: new URL('../../assets/sprites/boss-gravion-move3-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-move3-recover',
    url: new URL('../../assets/sprites/boss-gravion-move3-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p2trans-1',
    url: new URL('../../assets/sprites/boss-gravion-p2trans-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p2trans-2',
    url: new URL('../../assets/sprites/boss-gravion-p2trans-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p2trans-3',
    url: new URL('../../assets/sprites/boss-gravion-p2trans-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p2trans-4',
    url: new URL('../../assets/sprites/boss-gravion-p2trans-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p2trans-5',
    url: new URL('../../assets/sprites/boss-gravion-p2trans-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p2trans-6',
    url: new URL('../../assets/sprites/boss-gravion-p2trans-6.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p3trans-1',
    url: new URL('../../assets/sprites/boss-gravion-p3trans-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p3trans-2',
    url: new URL('../../assets/sprites/boss-gravion-p3trans-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p3trans-3',
    url: new URL('../../assets/sprites/boss-gravion-p3trans-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p3trans-4',
    url: new URL('../../assets/sprites/boss-gravion-p3trans-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p3trans-5',
    url: new URL('../../assets/sprites/boss-gravion-p3trans-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p3trans-6',
    url: new URL('../../assets/sprites/boss-gravion-p3trans-6.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-p3trans-7',
    url: new URL('../../assets/sprites/boss-gravion-p3trans-7.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-hit-1',
    url: new URL('../../assets/sprites/boss-gravion-hit-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-hit-2',
    url: new URL('../../assets/sprites/boss-gravion-hit-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-death-1',
    url: new URL('../../assets/sprites/boss-gravion-death-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-death-2',
    url: new URL('../../assets/sprites/boss-gravion-death-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-death-3',
    url: new URL('../../assets/sprites/boss-gravion-death-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-death-4',
    url: new URL('../../assets/sprites/boss-gravion-death-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-death-5',
    url: new URL('../../assets/sprites/boss-gravion-death-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-death-6',
    url: new URL('../../assets/sprites/boss-gravion-death-6.webp', import.meta.url).href,
  },
  // v21-v30 B06 劉董動畫關鍵幀（入場四幀已於 B04 註冊；載入時機建議：L30 魔王關載入，暫沿 Boot 預載）。
  {
    key: 'boss-liudong-idle-2',
    url: new URL('../../assets/sprites/boss-liudong-idle-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-idle-3',
    url: new URL('../../assets/sprites/boss-liudong-idle-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move1-windup',
    url: new URL('../../assets/sprites/boss-liudong-move1-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move1-charge',
    url: new URL('../../assets/sprites/boss-liudong-move1-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move1-burst',
    url: new URL('../../assets/sprites/boss-liudong-move1-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move1-recover',
    url: new URL('../../assets/sprites/boss-liudong-move1-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move2-windup',
    url: new URL('../../assets/sprites/boss-liudong-move2-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move2-charge',
    url: new URL('../../assets/sprites/boss-liudong-move2-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move2-burst',
    url: new URL('../../assets/sprites/boss-liudong-move2-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move2-recover',
    url: new URL('../../assets/sprites/boss-liudong-move2-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move3-windup',
    url: new URL('../../assets/sprites/boss-liudong-move3-windup.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move3-charge',
    url: new URL('../../assets/sprites/boss-liudong-move3-charge.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move3-burst',
    url: new URL('../../assets/sprites/boss-liudong-move3-burst.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-move3-recover',
    url: new URL('../../assets/sprites/boss-liudong-move3-recover.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p2trans-1',
    url: new URL('../../assets/sprites/boss-liudong-p2trans-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p2trans-2',
    url: new URL('../../assets/sprites/boss-liudong-p2trans-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p2trans-3',
    url: new URL('../../assets/sprites/boss-liudong-p2trans-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p2trans-4',
    url: new URL('../../assets/sprites/boss-liudong-p2trans-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p2trans-5',
    url: new URL('../../assets/sprites/boss-liudong-p2trans-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p2trans-6',
    url: new URL('../../assets/sprites/boss-liudong-p2trans-6.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p3trans-1',
    url: new URL('../../assets/sprites/boss-liudong-p3trans-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p3trans-2',
    url: new URL('../../assets/sprites/boss-liudong-p3trans-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p3trans-3',
    url: new URL('../../assets/sprites/boss-liudong-p3trans-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p3trans-4',
    url: new URL('../../assets/sprites/boss-liudong-p3trans-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p3trans-5',
    url: new URL('../../assets/sprites/boss-liudong-p3trans-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p3trans-6',
    url: new URL('../../assets/sprites/boss-liudong-p3trans-6.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-p3trans-7',
    url: new URL('../../assets/sprites/boss-liudong-p3trans-7.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-hit-1',
    url: new URL('../../assets/sprites/boss-liudong-hit-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-hit-2',
    url: new URL('../../assets/sprites/boss-liudong-hit-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-death-1',
    url: new URL('../../assets/sprites/boss-liudong-death-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-death-2',
    url: new URL('../../assets/sprites/boss-liudong-death-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-death-3',
    url: new URL('../../assets/sprites/boss-liudong-death-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-death-4',
    url: new URL('../../assets/sprites/boss-liudong-death-4.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-death-5',
    url: new URL('../../assets/sprites/boss-liudong-death-5.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-death-6',
    url: new URL('../../assets/sprites/boss-liudong-death-6.webp', import.meta.url).href,
  },
  // v21-v30 B06 尾項：volt/gale/shell 變身五幀與全屏箭雨分層（載入時機建議：形態解鎖/L30 延遲，暫沿 Boot 預載）。
  {
    key: 'hero-volt-morph-gather',
    url: new URL('../../assets/sprites/hero-volt-morph-gather.webp', import.meta.url).href,
  },
  {
    key: 'hero-volt-morph-shrink',
    url: new URL('../../assets/sprites/hero-volt-morph-shrink.webp', import.meta.url).href,
  },
  {
    key: 'hero-volt-morph-stretch',
    url: new URL('../../assets/sprites/hero-volt-morph-stretch.webp', import.meta.url).href,
  },
  {
    key: 'hero-volt-morph-burst',
    url: new URL('../../assets/sprites/hero-volt-morph-burst.webp', import.meta.url).href,
  },
  {
    key: 'hero-volt-morph-complete',
    url: new URL('../../assets/sprites/hero-volt-morph-complete.webp', import.meta.url).href,
  },
  {
    key: 'hero-gale-morph-gather',
    url: new URL('../../assets/sprites/hero-gale-morph-gather.webp', import.meta.url).href,
  },
  {
    key: 'hero-gale-morph-shrink',
    url: new URL('../../assets/sprites/hero-gale-morph-shrink.webp', import.meta.url).href,
  },
  {
    key: 'hero-gale-morph-stretch',
    url: new URL('../../assets/sprites/hero-gale-morph-stretch.webp', import.meta.url).href,
  },
  {
    key: 'hero-gale-morph-burst',
    url: new URL('../../assets/sprites/hero-gale-morph-burst.webp', import.meta.url).href,
  },
  {
    key: 'hero-gale-morph-complete',
    url: new URL('../../assets/sprites/hero-gale-morph-complete.webp', import.meta.url).href,
  },
  {
    key: 'hero-shell-morph-gather',
    url: new URL('../../assets/sprites/hero-shell-morph-gather.webp', import.meta.url).href,
  },
  {
    key: 'hero-shell-morph-shrink',
    url: new URL('../../assets/sprites/hero-shell-morph-shrink.webp', import.meta.url).href,
  },
  {
    key: 'hero-shell-morph-stretch',
    url: new URL('../../assets/sprites/hero-shell-morph-stretch.webp', import.meta.url).href,
  },
  {
    key: 'hero-shell-morph-burst',
    url: new URL('../../assets/sprites/hero-shell-morph-burst.webp', import.meta.url).href,
  },
  {
    key: 'hero-shell-morph-complete',
    url: new URL('../../assets/sprites/hero-shell-morph-complete.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-arrowrain-core',
    url: new URL('../../assets/sprites/fx-market-arrowrain-core.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-arrowrain-shock',
    url: new URL('../../assets/sprites/fx-market-arrowrain-shock.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-arrowrain-trail',
    url: new URL('../../assets/sprites/fx-market-arrowrain-trail.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-arrowrain-debris',
    url: new URL('../../assets/sprites/fx-market-arrowrain-debris.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-arrowrain-overlay',
    url: new URL('../../assets/sprites/fx-market-arrowrain-overlay.webp', import.meta.url).href,
  },
];
