// §124 W5a 素材接關分檔：星彈四層／基礎動作分層／變身分鏡／光環分層／形態徽章。
// 由 assets.ts 的 ASSETS 展開引用（全數為已接關的消費中條目，非停車場）；
// phase 語意：level＝進關載入（星味由 levelAssetKeys 派生、fx-common 全關共用）、
// deferred＝關卡開場後背景補載（變身演出級資產，缺載時運行期安全回退）。
import type { AssetEntry } from './assets';

export const ASSETS_W5A_FX: AssetEntry[] = [
  // §124 W5a 接關：九星味 × 四層星彈特效（charge/flight/hit/explosion）與吸入／
  // 浮空／落地五分層基礎動作特效，自 assetsV21Part2 逐筆搬回（#857 接關契約）；
  // 星味四層由 levelAssetKeys 依該關可吞品種派生（jelly 保底恆載）。
  {
    key: 'fx-star-jelly-flight',
    url: new URL('../../assets/sprites/fx-star-jelly-flight.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-jelly-charge',
    url: new URL('../../assets/sprites/fx-star-jelly-charge.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-jelly-hit',
    url: new URL('../../assets/sprites/fx-star-jelly-hit.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-jelly-explosion',
    url: new URL('../../assets/sprites/fx-star-jelly-explosion.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-floaty-flight',
    url: new URL('../../assets/sprites/fx-star-floaty-flight.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-floaty-charge',
    url: new URL('../../assets/sprites/fx-star-floaty-charge.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-floaty-hit',
    url: new URL('../../assets/sprites/fx-star-floaty-hit.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-floaty-explosion',
    url: new URL('../../assets/sprites/fx-star-floaty-explosion.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-puffy-flight',
    url: new URL('../../assets/sprites/fx-star-puffy-flight.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-puffy-charge',
    url: new URL('../../assets/sprites/fx-star-puffy-charge.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-puffy-hit',
    url: new URL('../../assets/sprites/fx-star-puffy-hit.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-puffy-explosion',
    url: new URL('../../assets/sprites/fx-star-puffy-explosion.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-shelly-flight',
    url: new URL('../../assets/sprites/fx-star-shelly-flight.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-shelly-charge',
    url: new URL('../../assets/sprites/fx-star-shelly-charge.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-shelly-hit',
    url: new URL('../../assets/sprites/fx-star-shelly-hit.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-shelly-explosion',
    url: new URL('../../assets/sprites/fx-star-shelly-explosion.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-zappy-flight',
    url: new URL('../../assets/sprites/fx-star-zappy-flight.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-zappy-charge',
    url: new URL('../../assets/sprites/fx-star-zappy-charge.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-zappy-hit',
    url: new URL('../../assets/sprites/fx-star-zappy-hit.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-zappy-explosion',
    url: new URL('../../assets/sprites/fx-star-zappy-explosion.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-drilly-flight',
    url: new URL('../../assets/sprites/fx-star-drilly-flight.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-drilly-charge',
    url: new URL('../../assets/sprites/fx-star-drilly-charge.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-drilly-hit',
    url: new URL('../../assets/sprites/fx-star-drilly-hit.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-drilly-explosion',
    url: new URL('../../assets/sprites/fx-star-drilly-explosion.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-glowy-flight',
    url: new URL('../../assets/sprites/fx-star-glowy-flight.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-glowy-charge',
    url: new URL('../../assets/sprites/fx-star-glowy-charge.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-glowy-hit',
    url: new URL('../../assets/sprites/fx-star-glowy-hit.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-glowy-explosion',
    url: new URL('../../assets/sprites/fx-star-glowy-explosion.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-spora-flight',
    url: new URL('../../assets/sprites/fx-star-spora-flight.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-spora-charge',
    url: new URL('../../assets/sprites/fx-star-spora-charge.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-spora-hit',
    url: new URL('../../assets/sprites/fx-star-spora-hit.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-spora-explosion',
    url: new URL('../../assets/sprites/fx-star-spora-explosion.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-boomy-flight',
    url: new URL('../../assets/sprites/fx-star-boomy-flight.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-boomy-charge',
    url: new URL('../../assets/sprites/fx-star-boomy-charge.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-boomy-hit',
    url: new URL('../../assets/sprites/fx-star-boomy-hit.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-star-boomy-explosion',
    url: new URL('../../assets/sprites/fx-star-boomy-explosion.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-float-core',
    url: new URL('../../assets/sprites/fx-common-float-core.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-float-shock',
    url: new URL('../../assets/sprites/fx-common-float-shock.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-float-trail',
    url: new URL('../../assets/sprites/fx-common-float-trail.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-float-debris',
    url: new URL('../../assets/sprites/fx-common-float-debris.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-float-overlay',
    url: new URL('../../assets/sprites/fx-common-float-overlay.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-landing-core',
    url: new URL('../../assets/sprites/fx-common-landing-core.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-landing-shock',
    url: new URL('../../assets/sprites/fx-common-landing-shock.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-landing-trail',
    url: new URL('../../assets/sprites/fx-common-landing-trail.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-landing-debris',
    url: new URL('../../assets/sprites/fx-common-landing-debris.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-landing-overlay',
    url: new URL('../../assets/sprites/fx-common-landing-overlay.webp', import.meta.url).href,
    phase: 'level',
  },
  // §124 W5a Wave2 接關：七形態變身分鏡五幀、四新形態光環五分層、七形態 HUD
  // 徽章與 tide/prism/gravity 形態技星彈四層，自 assetsV21Part1/2/3 逐筆搬回
  //（#857 接關契約）；全數屬形態綁定鍵（FORM_SCOPED_KEYS），依 FORM_INTRO_LEVEL
  // 逐關納入。
  {
    key: 'hero-ember-morph-gather',
    url: new URL('../../assets/sprites/hero-ember-morph-gather.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-ember-morph-shrink',
    url: new URL('../../assets/sprites/hero-ember-morph-shrink.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-ember-morph-stretch',
    url: new URL('../../assets/sprites/hero-ember-morph-stretch.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-ember-morph-burst',
    url: new URL('../../assets/sprites/hero-ember-morph-burst.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-ember-morph-complete',
    url: new URL('../../assets/sprites/hero-ember-morph-complete.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-tide-morph-gather',
    url: new URL('../../assets/sprites/hero-tide-morph-gather.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-tide-morph-shrink',
    url: new URL('../../assets/sprites/hero-tide-morph-shrink.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-tide-morph-stretch',
    url: new URL('../../assets/sprites/hero-tide-morph-stretch.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-tide-morph-burst',
    url: new URL('../../assets/sprites/hero-tide-morph-burst.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-tide-morph-complete',
    url: new URL('../../assets/sprites/hero-tide-morph-complete.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-prism-morph-gather',
    url: new URL('../../assets/sprites/hero-prism-morph-gather.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-prism-morph-shrink',
    url: new URL('../../assets/sprites/hero-prism-morph-shrink.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-prism-morph-stretch',
    url: new URL('../../assets/sprites/hero-prism-morph-stretch.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-prism-morph-burst',
    url: new URL('../../assets/sprites/hero-prism-morph-burst.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-prism-morph-complete',
    url: new URL('../../assets/sprites/hero-prism-morph-complete.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-gravity-morph-gather',
    url: new URL('../../assets/sprites/hero-gravity-morph-gather.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-gravity-morph-shrink',
    url: new URL('../../assets/sprites/hero-gravity-morph-shrink.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-gravity-morph-stretch',
    url: new URL('../../assets/sprites/hero-gravity-morph-stretch.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-gravity-morph-burst',
    url: new URL('../../assets/sprites/hero-gravity-morph-burst.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-gravity-morph-complete',
    url: new URL('../../assets/sprites/hero-gravity-morph-complete.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-ember-aura-core',
    url: new URL('../../assets/sprites/fx-ember-aura-core.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-ember-aura-shock',
    url: new URL('../../assets/sprites/fx-ember-aura-shock.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-ember-aura-trail',
    url: new URL('../../assets/sprites/fx-ember-aura-trail.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-ember-aura-debris',
    url: new URL('../../assets/sprites/fx-ember-aura-debris.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-ember-aura-overlay',
    url: new URL('../../assets/sprites/fx-ember-aura-overlay.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-tide-aura-core',
    url: new URL('../../assets/sprites/fx-tide-aura-core.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-tide-aura-shock',
    url: new URL('../../assets/sprites/fx-tide-aura-shock.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-tide-aura-trail',
    url: new URL('../../assets/sprites/fx-tide-aura-trail.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-tide-aura-debris',
    url: new URL('../../assets/sprites/fx-tide-aura-debris.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-tide-aura-overlay',
    url: new URL('../../assets/sprites/fx-tide-aura-overlay.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-prism-aura-core',
    url: new URL('../../assets/sprites/fx-prism-aura-core.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-prism-aura-shock',
    url: new URL('../../assets/sprites/fx-prism-aura-shock.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-prism-aura-trail',
    url: new URL('../../assets/sprites/fx-prism-aura-trail.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-prism-aura-debris',
    url: new URL('../../assets/sprites/fx-prism-aura-debris.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-prism-aura-overlay',
    url: new URL('../../assets/sprites/fx-prism-aura-overlay.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-gravity-aura-core',
    url: new URL('../../assets/sprites/fx-gravity-aura-core.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-gravity-aura-shock',
    url: new URL('../../assets/sprites/fx-gravity-aura-shock.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-gravity-aura-trail',
    url: new URL('../../assets/sprites/fx-gravity-aura-trail.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-gravity-aura-debris',
    url: new URL('../../assets/sprites/fx-gravity-aura-debris.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-gravity-aura-overlay',
    url: new URL('../../assets/sprites/fx-gravity-aura-overlay.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'ui-ember-badge',
    url: new URL('../../assets/sprites/ui-ember-badge.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'ui-tide-badge',
    url: new URL('../../assets/sprites/ui-tide-badge.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'ui-prism-badge',
    url: new URL('../../assets/sprites/ui-prism-badge.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'ui-gravity-badge',
    url: new URL('../../assets/sprites/ui-gravity-badge.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-tide-flight',
    url: new URL('../../assets/sprites/fx-star-tide-flight.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-tide-charge',
    url: new URL('../../assets/sprites/fx-star-tide-charge.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-tide-hit',
    url: new URL('../../assets/sprites/fx-star-tide-hit.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-tide-explosion',
    url: new URL('../../assets/sprites/fx-star-tide-explosion.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-prism-flight',
    url: new URL('../../assets/sprites/fx-star-prism-flight.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-prism-charge',
    url: new URL('../../assets/sprites/fx-star-prism-charge.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-prism-hit',
    url: new URL('../../assets/sprites/fx-star-prism-hit.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-prism-explosion',
    url: new URL('../../assets/sprites/fx-star-prism-explosion.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-gravity-flight',
    url: new URL('../../assets/sprites/fx-star-gravity-flight.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-gravity-charge',
    url: new URL('../../assets/sprites/fx-star-gravity-charge.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-gravity-hit',
    url: new URL('../../assets/sprites/fx-star-gravity-hit.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'fx-star-gravity-explosion',
    url: new URL('../../assets/sprites/fx-star-gravity-explosion.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'ui-volt-badge',
    url: new URL('../../assets/sprites/ui-volt-badge.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'ui-gale-badge',
    url: new URL('../../assets/sprites/ui-gale-badge.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'ui-shell-badge',
    url: new URL('../../assets/sprites/ui-shell-badge.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-volt-morph-gather',
    url: new URL('../../assets/sprites/hero-volt-morph-gather.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-volt-morph-shrink',
    url: new URL('../../assets/sprites/hero-volt-morph-shrink.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-volt-morph-stretch',
    url: new URL('../../assets/sprites/hero-volt-morph-stretch.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-volt-morph-burst',
    url: new URL('../../assets/sprites/hero-volt-morph-burst.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-volt-morph-complete',
    url: new URL('../../assets/sprites/hero-volt-morph-complete.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-gale-morph-gather',
    url: new URL('../../assets/sprites/hero-gale-morph-gather.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-gale-morph-shrink',
    url: new URL('../../assets/sprites/hero-gale-morph-shrink.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-gale-morph-stretch',
    url: new URL('../../assets/sprites/hero-gale-morph-stretch.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-gale-morph-burst',
    url: new URL('../../assets/sprites/hero-gale-morph-burst.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-gale-morph-complete',
    url: new URL('../../assets/sprites/hero-gale-morph-complete.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-shell-morph-gather',
    url: new URL('../../assets/sprites/hero-shell-morph-gather.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-shell-morph-shrink',
    url: new URL('../../assets/sprites/hero-shell-morph-shrink.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-shell-morph-stretch',
    url: new URL('../../assets/sprites/hero-shell-morph-stretch.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-shell-morph-burst',
    url: new URL('../../assets/sprites/hero-shell-morph-burst.webp', import.meta.url).href,
    phase: 'deferred',
  },
  {
    key: 'hero-shell-morph-complete',
    url: new URL('../../assets/sprites/hero-shell-morph-complete.webp', import.meta.url).href,
    phase: 'deferred',
  },
  // §124 W5a Wave3 接關：HUD 彈藥星圖示（quotaIcon 與彈匣槽共用）——全關共用
  // 核心；ui-hud-sp 與七形態 skill 圖示走 DOM 按鈕層（controls Vite import），
  // 不入 Phaser manifest。
  {
    key: 'ui-hud-ammo',
    url: new URL('../../assets/sprites/ui-hud-ammo.webp', import.meta.url).href,
    phase: 'level',
  },
];
