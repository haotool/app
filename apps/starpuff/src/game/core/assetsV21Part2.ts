// v21-v30 章節素材 manifest 分檔（B04–B05（崩盤前夜/劉董戰場、市場素材、十二系星彈、共通技能、HUD））。
// 由 assets.ts 的 ASSETS 展開引用；與載入策略欄位擴充相容，維持 append-only。
// 【暫時 lazy 契約】本檔條目在 W2/W3 接關前一律標 lazy（零 scene 呼叫點，避免被
// entriesForLevel 的未認領 fallback 每關全載）；接入時依行內註解改回原 phase，
// assetsV21.test.ts 的守門會在 LevelSpec／TRANSFORM_FORMS 認領後自動翻紅提醒。
import type { AssetEntry } from './assets';

export const ASSETS_V21_PART2: AssetEntry[] = [
  // v21-v30 B04 崩盤前夜／劉董戰場場景（載入時機建議：L29/L30 關卡載入，暫沿 Boot 預載）。
  {
    key: 'bg-crasheve-l',
    url: new URL('../../assets/sprites/bg-crasheve-l.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'prop-crasheve-1',
    url: new URL('../../assets/sprites/prop-crasheve-1.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'prop-crasheve-2',
    url: new URL('../../assets/sprites/prop-crasheve-2.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'prop-crasheve-3',
    url: new URL('../../assets/sprites/prop-crasheve-3.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'prop-crasheve-4',
    url: new URL('../../assets/sprites/prop-crasheve-4.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'bg-market-l',
    url: new URL('../../assets/sprites/bg-market-l.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'prop-market-1',
    url: new URL('../../assets/sprites/prop-market-1.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'prop-market-2',
    url: new URL('../../assets/sprites/prop-market-2.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'prop-market-3',
    url: new URL('../../assets/sprites/prop-market-3.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'prop-market-4',
    url: new URL('../../assets/sprites/prop-market-4.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B04 劉董三形態補完與入金演出四幀（載入時機建議：L30 魔王關載入，暫沿 Boot 預載）。
  {
    key: 'boss-liudong-enraged',
    url: new URL('../../assets/sprites/boss-liudong-enraged.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'boss-liudong-doom',
    url: new URL('../../assets/sprites/boss-liudong-doom.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'boss-liudong-entry-1',
    url: new URL('../../assets/sprites/boss-liudong-entry-1.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'boss-liudong-entry-2',
    url: new URL('../../assets/sprites/boss-liudong-entry-2.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'boss-liudong-entry-3',
    url: new URL('../../assets/sprites/boss-liudong-entry-3.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'boss-liudong-entry-4',
    url: new URL('../../assets/sprites/boss-liudong-entry-4.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B04 牛熊怪與三市場圖示（載入時機建議：L29/L30 關卡載入，暫沿 Boot 預載）。
  {
    key: 'minion-bullrun',
    url: new URL('../../assets/sprites/minion-bullrun.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'minion-bearmarket',
    url: new URL('../../assets/sprites/minion-bearmarket.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
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
  {
    key: 'fx-market-arrow-big',
    url: new URL('../../assets/sprites/fx-market-arrow-big.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-arrow-small',
    url: new URL('../../assets/sprites/fx-market-arrow-small.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-arrow-fake',
    url: new URL('../../assets/sprites/fx-market-arrow-fake.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-coin',
    url: new URL('../../assets/sprites/fx-market-coin.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-candle-green',
    url: new URL('../../assets/sprites/fx-market-candle-green.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-candle-pin',
    url: new URL('../../assets/sprites/fx-market-candle-pin.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-circuitwall',
    url: new URL('../../assets/sprites/fx-market-circuitwall.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B04 市場終招分層 VFX（崩跌衝擊波/K線海嘯/市場黑洞/入金光束，各五層獨立疊加）。
  {
    key: 'fx-market-crashwave-core',
    url: new URL('../../assets/sprites/fx-market-crashwave-core.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-crashwave-shock',
    url: new URL('../../assets/sprites/fx-market-crashwave-shock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
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
    key: 'fx-market-klinewave-core',
    url: new URL('../../assets/sprites/fx-market-klinewave-core.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-klinewave-shock',
    url: new URL('../../assets/sprites/fx-market-klinewave-shock.webp', import.meta.url).href,

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
    key: 'fx-market-blackhole-core',
    url: new URL('../../assets/sprites/fx-market-blackhole-core.webp', import.meta.url).href,

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
    key: 'fx-market-blackhole-overlay',
    url: new URL('../../assets/sprites/fx-market-blackhole-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-deposit-core',
    url: new URL('../../assets/sprites/fx-market-deposit-core.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-deposit-shock',
    url: new URL('../../assets/sprites/fx-market-deposit-shock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-deposit-trail',
    url: new URL('../../assets/sprites/fx-market-deposit-trail.webp', import.meta.url).href,

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
  {
    key: 'fx-star-jelly-flight',
    url: new URL('../../assets/sprites/fx-star-jelly-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-jelly-charge',
    url: new URL('../../assets/sprites/fx-star-jelly-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-jelly-hit',
    url: new URL('../../assets/sprites/fx-star-jelly-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-jelly-explosion',
    url: new URL('../../assets/sprites/fx-star-jelly-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-floaty-flight',
    url: new URL('../../assets/sprites/fx-star-floaty-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-floaty-charge',
    url: new URL('../../assets/sprites/fx-star-floaty-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-floaty-hit',
    url: new URL('../../assets/sprites/fx-star-floaty-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-floaty-explosion',
    url: new URL('../../assets/sprites/fx-star-floaty-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-puffy-flight',
    url: new URL('../../assets/sprites/fx-star-puffy-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-puffy-charge',
    url: new URL('../../assets/sprites/fx-star-puffy-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-puffy-hit',
    url: new URL('../../assets/sprites/fx-star-puffy-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-puffy-explosion',
    url: new URL('../../assets/sprites/fx-star-puffy-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-shelly-flight',
    url: new URL('../../assets/sprites/fx-star-shelly-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-shelly-charge',
    url: new URL('../../assets/sprites/fx-star-shelly-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-shelly-hit',
    url: new URL('../../assets/sprites/fx-star-shelly-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-shelly-explosion',
    url: new URL('../../assets/sprites/fx-star-shelly-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-zappy-flight',
    url: new URL('../../assets/sprites/fx-star-zappy-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-zappy-charge',
    url: new URL('../../assets/sprites/fx-star-zappy-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-zappy-hit',
    url: new URL('../../assets/sprites/fx-star-zappy-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-zappy-explosion',
    url: new URL('../../assets/sprites/fx-star-zappy-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-drilly-flight',
    url: new URL('../../assets/sprites/fx-star-drilly-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-drilly-charge',
    url: new URL('../../assets/sprites/fx-star-drilly-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-drilly-hit',
    url: new URL('../../assets/sprites/fx-star-drilly-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-drilly-explosion',
    url: new URL('../../assets/sprites/fx-star-drilly-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-glowy-flight',
    url: new URL('../../assets/sprites/fx-star-glowy-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-glowy-charge',
    url: new URL('../../assets/sprites/fx-star-glowy-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-glowy-hit',
    url: new URL('../../assets/sprites/fx-star-glowy-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-glowy-explosion',
    url: new URL('../../assets/sprites/fx-star-glowy-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-spora-flight',
    url: new URL('../../assets/sprites/fx-star-spora-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-spora-charge',
    url: new URL('../../assets/sprites/fx-star-spora-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-spora-hit',
    url: new URL('../../assets/sprites/fx-star-spora-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-spora-explosion',
    url: new URL('../../assets/sprites/fx-star-spora-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-boomy-flight',
    url: new URL('../../assets/sprites/fx-star-boomy-flight.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-boomy-charge',
    url: new URL('../../assets/sprites/fx-star-boomy-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-boomy-hit',
    url: new URL('../../assets/sprites/fx-star-boomy-hit.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-star-boomy-explosion',
    url: new URL('../../assets/sprites/fx-star-boomy-explosion.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
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
  {
    key: 'fx-common-inhale-core',
    url: new URL('../../assets/sprites/fx-common-inhale-core.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-inhale-shock',
    url: new URL('../../assets/sprites/fx-common-inhale-shock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-inhale-trail',
    url: new URL('../../assets/sprites/fx-common-inhale-trail.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-inhale-debris',
    url: new URL('../../assets/sprites/fx-common-inhale-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-inhale-overlay',
    url: new URL('../../assets/sprites/fx-common-inhale-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-float-core',
    url: new URL('../../assets/sprites/fx-common-float-core.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-float-shock',
    url: new URL('../../assets/sprites/fx-common-float-shock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-float-trail',
    url: new URL('../../assets/sprites/fx-common-float-trail.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-float-debris',
    url: new URL('../../assets/sprites/fx-common-float-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-float-overlay',
    url: new URL('../../assets/sprites/fx-common-float-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-landing-core',
    url: new URL('../../assets/sprites/fx-common-landing-core.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-landing-shock',
    url: new URL('../../assets/sprites/fx-common-landing-shock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-landing-trail',
    url: new URL('../../assets/sprites/fx-common-landing-trail.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-landing-debris',
    url: new URL('../../assets/sprites/fx-common-landing-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-common-landing-overlay',
    url: new URL('../../assets/sprites/fx-common-landing-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'level'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
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
