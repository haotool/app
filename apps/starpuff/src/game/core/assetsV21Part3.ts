// v21-v30 章節素材 manifest 分檔（B06 起（五王動畫關鍵幀等，後續批次 append 於此））。
// 由 assets.ts 的 ASSETS 展開引用；與載入策略欄位擴充相容，維持 append-only。
// 【暫時 lazy 契約】本檔條目在 W2/W3 接關前一律標 lazy（零 scene 呼叫點，避免被
// entriesForLevel 的未認領 fallback 每關全載）；接入時依行內註解改回原 phase，
// assetsV21.test.ts 的守門會在 LevelSpec／TRANSFORM_FORMS 認領後自動翻紅提醒。
import type { AssetEntry } from './assets';

export const ASSETS_V21_PART3: AssetEntry[] = [
  // v21-v30 B06 Maridella/Reflector/Gravion 動畫關鍵幀：已於 §125 W5 接關認領
  //（L24/L26/L28 演出層），條目搬入 bossAnimAssets.ts（dynamic import 分檔）。
  // v21-v30 B06 劉董動畫關鍵幀（入場四幀已於 B04 註冊；載入時機建議：L30 魔王關載入，暫沿 Boot 預載）。
  // v21-v30 B06 尾項：volt/gale/shell 變身五幀與全屏箭雨分層（載入時機建議：形態解鎖/L30 延遲，暫沿 Boot 預載）。
  // 吸入五分層：曾於 §124 W5a 接關，因嘴前特效遮蔽待吸目標而退場（吸入回饋回退為
  // systems/fx.ts 的圓點漩渦）。素材保留待重新設計，退回停車場不佔每關頻寬。
  {
    key: 'fx-common-inhale-core',
    url: new URL('../../assets/sprites/fx-common-inhale-core.webp', import.meta.url).href,

    phase: 'lazy', // 重新設計吸入演出並接回 systems/fx.ts 時改回 'level'
  },
  {
    key: 'fx-common-inhale-shock',
    url: new URL('../../assets/sprites/fx-common-inhale-shock.webp', import.meta.url).href,

    phase: 'lazy', // 重新設計吸入演出並接回 systems/fx.ts 時改回 'level'
  },
  {
    key: 'fx-common-inhale-trail',
    url: new URL('../../assets/sprites/fx-common-inhale-trail.webp', import.meta.url).href,

    phase: 'lazy', // 重新設計吸入演出並接回 systems/fx.ts 時改回 'level'
  },
  {
    key: 'fx-common-inhale-debris',
    url: new URL('../../assets/sprites/fx-common-inhale-debris.webp', import.meta.url).href,

    phase: 'lazy', // 重新設計吸入演出並接回 systems/fx.ts 時改回 'level'
  },
  {
    key: 'fx-common-inhale-overlay',
    url: new URL('../../assets/sprites/fx-common-inhale-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 重新設計吸入演出並接回 systems/fx.ts 時改回 'level'
  },
  {
    key: 'fx-market-arrowrain-core',
    url: new URL('../../assets/sprites/fx-market-arrowrain-core.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-arrowrain-trail',
    url: new URL('../../assets/sprites/fx-market-arrowrain-trail.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-arrowrain-debris',
    url: new URL('../../assets/sprites/fx-market-arrowrain-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
];
