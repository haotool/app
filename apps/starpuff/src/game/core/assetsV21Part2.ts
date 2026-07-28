// v21-v30 章節素材 manifest 分檔（B04–B05（崩盤前夜/劉董戰場、市場素材、十二系星彈、共通技能、HUD））。
// 由 assets.ts 的 ASSETS 展開引用；與載入策略欄位擴充相容，維持 append-only。
// 【暫時 lazy 契約】本檔條目在 W2/W3 接關前一律標 lazy（零 scene 呼叫點，避免被
// entriesForLevel 的未認領 fallback 每關全載）；接入時依行內註解改回原 phase，
// assetsV21.test.ts 的守門會在 LevelSpec／TRANSFORM_FORMS 認領後自動翻紅提醒。
import type { AssetEntry } from './assets';

export const ASSETS_V21_PART2: AssetEntry[] = [
  // v21-v30 B04 崩盤前夜／劉董戰場場景（載入時機建議：L29/L30 關卡載入，暫沿 Boot 預載）。
  // v21-v30 B04 劉董三形態補完與入金演出四幀（載入時機建議：L30 魔王關載入，暫沿 Boot 預載）。
  // v21-v30 B04 牛熊怪與三市場圖示（載入時機建議：L29/L30 關卡載入，暫沿 Boot 預載）。
  // minion-bearlet：已於 §123 W3 接關認領（L27 入編），條目搬回主 manifest（assets.ts）。
  {
    key: 'ui-market-usstock',
    url: new URL('../../assets/sprites/ui-market-usstock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-market-crypto',
    url: new URL('../../assets/sprites/ui-market-crypto.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-market-taistock',
    url: new URL('../../assets/sprites/ui-market-taistock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B04 下跌箭頭三變體（假箭頭空心鈍頭可辨識）與市場攻擊單件。
  // v21-v30 B04 市場終招分層 VFX（崩跌衝擊波/K線海嘯/市場黑洞/入金光束，各五層獨立疊加）。
  {
    key: 'fx-market-crashwave-trail',
    url: new URL('../../assets/sprites/fx-market-crashwave-trail.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-crashwave-debris',
    url: new URL('../../assets/sprites/fx-market-crashwave-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-crashwave-overlay',
    url: new URL('../../assets/sprites/fx-market-crashwave-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-klinewave-trail',
    url: new URL('../../assets/sprites/fx-market-klinewave-trail.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-klinewave-debris',
    url: new URL('../../assets/sprites/fx-market-klinewave-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-klinewave-overlay',
    url: new URL('../../assets/sprites/fx-market-klinewave-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-blackhole-shock',
    url: new URL('../../assets/sprites/fx-market-blackhole-shock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-blackhole-trail',
    url: new URL('../../assets/sprites/fx-market-blackhole-trail.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-blackhole-debris',
    url: new URL('../../assets/sprites/fx-market-blackhole-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-deposit-shock',
    url: new URL('../../assets/sprites/fx-market-deposit-shock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-deposit-debris',
    url: new URL('../../assets/sprites/fx-market-deposit-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-deposit-overlay',
    url: new URL('../../assets/sprites/fx-market-deposit-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B05 十二系星彈四態（載入時機建議：Boot 預載——戰鬥高頻資產）。
  // §124 W5a 接關：九星味四層與 fx-common 十五分層已搬回主 manifest（assets.ts）
  // 並標 'level'（星味由 levelAssetKeys 派生、fx-common 入全關共用核心）；本檔僅
  // 保留 tide/prism/gravity 形態星彈四層待 W5a Wave2 隨形態綁定鍵接關。
  {
    key: 'fx-star-tide-flight',
    url: new URL('../../assets/sprites/fx-star-tide-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-tide-charge',
    url: new URL('../../assets/sprites/fx-star-tide-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-tide-hit',
    url: new URL('../../assets/sprites/fx-star-tide-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-tide-explosion',
    url: new URL('../../assets/sprites/fx-star-tide-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-prism-flight',
    url: new URL('../../assets/sprites/fx-star-prism-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-prism-charge',
    url: new URL('../../assets/sprites/fx-star-prism-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-prism-hit',
    url: new URL('../../assets/sprites/fx-star-prism-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-prism-explosion',
    url: new URL('../../assets/sprites/fx-star-prism-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-gravity-flight',
    url: new URL('../../assets/sprites/fx-star-gravity-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-gravity-charge',
    url: new URL('../../assets/sprites/fx-star-gravity-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-gravity-hit',
    url: new URL('../../assets/sprites/fx-star-gravity-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-gravity-explosion',
    url: new URL('../../assets/sprites/fx-star-gravity-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B05 共通技能分層 VFX（吸入/漂浮/落地，各五層獨立疊加）。
  // v21-v30 B05 HUD 補完（volt/gale/shell 徽章技能圖示與通用彈藥/SP 圖示）。
  {
    key: 'ui-volt-badge',
    url: new URL('../../assets/sprites/ui-volt-badge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-volt-skill',
    url: new URL('../../assets/sprites/ui-volt-skill.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-gale-badge',
    url: new URL('../../assets/sprites/ui-gale-badge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-gale-skill',
    url: new URL('../../assets/sprites/ui-gale-skill.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-shell-badge',
    url: new URL('../../assets/sprites/ui-shell-badge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-shell-skill',
    url: new URL('../../assets/sprites/ui-shell-skill.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-hud-ammo',
    url: new URL('../../assets/sprites/ui-hud-ammo.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-hud-sp',
    url: new URL('../../assets/sprites/ui-hud-sp.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B06 Tariffang 動畫關鍵幀：已於 §125 W5 接關認領（L22 演出層），
  // 條目搬入 bossAnimAssets.ts（dynamic import 分檔，主 bundle 零字面量）。
];
