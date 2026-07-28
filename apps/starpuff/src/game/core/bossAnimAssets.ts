// 四王動畫組 manifest（GAME_DESIGN §125，#883 分階段載入契約）：本檔只允許被
// systems/bossStagecraft.ts 以 dynamic import 載入——條目字面量獨立成 async chunk，
// 主 bundle 零增量（assets.ts 尾註 +67.88kB 教訓）。載入時機＝魔王關 create 期背景
// 補載（前室廊道即充分窗口）；缺圖時演出層以 base 立繪降級，不影響行為。
// 條目自 assetsV21Part2/3 搬入（#857 接關契約）；鍵組完整性由 bossAnimAssets.test 守門。
import type { AssetEntry } from './assets';

const TARIFFANG_ANIM: readonly AssetEntry[] = [
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

const MARIDELLA_ANIM: readonly AssetEntry[] = [
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
];

const REFLECTOR_ANIM: readonly AssetEntry[] = [
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
];

const GRAVION_ANIM: readonly AssetEntry[] = [
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
];

// 演出鍵組 SSOT：四王共用同一幀結構（idle 2＋entry 4＋三招 4×3＋P2 轉段 6＋
// P3 轉段 7＋受擊 2＋死亡 6＝39 鍵/王），bossStagecraft 依 kind 前綴取用。
export const BOSS_ANIM_ASSETS = {
  tariffang: TARIFFANG_ANIM,
  maridella: MARIDELLA_ANIM,
  reflector: REFLECTOR_ANIM,
  gravion: GRAVION_ANIM,
} as const;

export type StagecraftBossKind = keyof typeof BOSS_ANIM_ASSETS;
