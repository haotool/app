// v21-v30 章節素材 manifest 分檔（B02–B03（星港潮灣/鏡界黑洞場景、四王、小怪、焰潮稜引力完整包））。
// 由 assets.ts 的 ASSETS 展開引用；與載入策略欄位擴充相容，維持 append-only。
// 【暫時 lazy 契約】本檔條目在 W2/W3 接關前一律標 lazy（零 scene 呼叫點，避免被
// entriesForLevel 的未認領 fallback 每關全載）；接入時依行內註解改回原 phase，
// assetsV21.test.ts 的守門會在 LevelSpec／TRANSFORM_FORMS 認領後自動翻紅提醒。
import type { AssetEntry } from './assets';

export const ASSETS_V21_PART1: AssetEntry[] = [
  // 稜化／引力化立繪：已於 §123 W3 接關認領（FORM_INTRO_LEVEL L25/L27），
  // 條目搬回主 manifest（assets.ts）並標 'form'。
  // v21-v30 首批（B04 前先行）：焰化基底與劉董本體、市場箭頭 canon。
  {
    key: 'boss-liudong',
    url: new URL('../../assets/sprites/boss-liudong.webp', import.meta.url).href,
    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'boss-liudong-thinking',
    url: new URL('../../assets/sprites/boss-liudong-thinking.webp', import.meta.url).href,
    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-market-down-arrow',
    url: new URL('../../assets/sprites/fx-market-down-arrow.webp', import.meta.url).href,
    phase: 'lazy', // 待接關改回 'boss'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B02 星港／潮灣場景與雙王：已於 §122 W2 接關認領，條目搬回主 manifest
  //（assets.ts）並標正確 phase——本檔僅保留未認領批次。
  // v21-v30 B02 六新小怪（載入時機建議：L21/L23 關卡載入，暫沿 Boot 預載）。
  // v21-v30 B02 潮化基底與焰化／潮化變身五幀（載入時機建議：形態解鎖前延遲載入，暫沿 Boot 預載）。
  {
    key: 'hero-ember-morph-gather',
    url: new URL('../../assets/sprites/hero-ember-morph-gather.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-ember-morph-shrink',
    url: new URL('../../assets/sprites/hero-ember-morph-shrink.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-ember-morph-stretch',
    url: new URL('../../assets/sprites/hero-ember-morph-stretch.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-ember-morph-burst',
    url: new URL('../../assets/sprites/hero-ember-morph-burst.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-ember-morph-complete',
    url: new URL('../../assets/sprites/hero-ember-morph-complete.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-tide-morph-gather',
    url: new URL('../../assets/sprites/hero-tide-morph-gather.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-tide-morph-shrink',
    url: new URL('../../assets/sprites/hero-tide-morph-shrink.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-tide-morph-stretch',
    url: new URL('../../assets/sprites/hero-tide-morph-stretch.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-tide-morph-burst',
    url: new URL('../../assets/sprites/hero-tide-morph-burst.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-tide-morph-complete',
    url: new URL('../../assets/sprites/hero-tide-morph-complete.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B02 焰化／潮化技能四拍（載入時機建議：形態解鎖前延遲載入，暫沿 Boot 預載）。
  {
    key: 'hero-ember-skill-windup',
    url: new URL('../../assets/sprites/hero-ember-skill-windup.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-ember-skill-charge',
    url: new URL('../../assets/sprites/hero-ember-skill-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-ember-skill-burst',
    url: new URL('../../assets/sprites/hero-ember-skill-burst.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-ember-skill-recover',
    url: new URL('../../assets/sprites/hero-ember-skill-recover.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-tide-skill-windup',
    url: new URL('../../assets/sprites/hero-tide-skill-windup.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-tide-skill-charge',
    url: new URL('../../assets/sprites/hero-tide-skill-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-tide-skill-burst',
    url: new URL('../../assets/sprites/hero-tide-skill-burst.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-tide-skill-recover',
    url: new URL('../../assets/sprites/hero-tide-skill-recover.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B02 焰化／潮化光環拖尾分層 VFX（核心光/外圈衝擊/拖尾/碎片/overlay 獨立疊加）。
  {
    key: 'fx-ember-aura-core',
    url: new URL('../../assets/sprites/fx-ember-aura-core.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-ember-aura-shock',
    url: new URL('../../assets/sprites/fx-ember-aura-shock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-ember-aura-trail',
    url: new URL('../../assets/sprites/fx-ember-aura-trail.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-ember-aura-debris',
    url: new URL('../../assets/sprites/fx-ember-aura-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-ember-aura-overlay',
    url: new URL('../../assets/sprites/fx-ember-aura-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-tide-aura-core',
    url: new URL('../../assets/sprites/fx-tide-aura-core.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-tide-aura-shock',
    url: new URL('../../assets/sprites/fx-tide-aura-shock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-tide-aura-trail',
    url: new URL('../../assets/sprites/fx-tide-aura-trail.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-tide-aura-debris',
    url: new URL('../../assets/sprites/fx-tide-aura-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-tide-aura-overlay',
    url: new URL('../../assets/sprites/fx-tide-aura-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B02 形態徽章與技能 HUD 圖示（載入時機建議：HUD 顯示前延遲載入，暫沿 Boot 預載）。
  {
    key: 'ui-ember-badge',
    url: new URL('../../assets/sprites/ui-ember-badge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-ember-skill',
    url: new URL('../../assets/sprites/ui-ember-skill.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-tide-badge',
    url: new URL('../../assets/sprites/ui-tide-badge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-tide-skill',
    url: new URL('../../assets/sprites/ui-tide-skill.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B03 鏡界塔／黑洞外環場景、雙王與六新小怪：已於 §123 W3 接關認領，
  // 條目搬回主 manifest（assets.ts）並標正確 phase——本檔僅保留未認領批次。
  // v21-v30 B03 稜化／引力化基底與變身五幀（載入時機建議：形態解鎖前延遲載入，暫沿 Boot 預載）。
  {
    key: 'hero-prism-morph-gather',
    url: new URL('../../assets/sprites/hero-prism-morph-gather.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-prism-morph-shrink',
    url: new URL('../../assets/sprites/hero-prism-morph-shrink.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-prism-morph-stretch',
    url: new URL('../../assets/sprites/hero-prism-morph-stretch.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-prism-morph-burst',
    url: new URL('../../assets/sprites/hero-prism-morph-burst.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-prism-morph-complete',
    url: new URL('../../assets/sprites/hero-prism-morph-complete.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-gravity-morph-gather',
    url: new URL('../../assets/sprites/hero-gravity-morph-gather.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-gravity-morph-shrink',
    url: new URL('../../assets/sprites/hero-gravity-morph-shrink.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-gravity-morph-stretch',
    url: new URL('../../assets/sprites/hero-gravity-morph-stretch.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-gravity-morph-burst',
    url: new URL('../../assets/sprites/hero-gravity-morph-burst.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-gravity-morph-complete',
    url: new URL('../../assets/sprites/hero-gravity-morph-complete.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B03 稜化／引力化技能四拍（載入時機建議：形態解鎖前延遲載入，暫沿 Boot 預載）。
  {
    key: 'hero-prism-skill-windup',
    url: new URL('../../assets/sprites/hero-prism-skill-windup.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-prism-skill-charge',
    url: new URL('../../assets/sprites/hero-prism-skill-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-prism-skill-burst',
    url: new URL('../../assets/sprites/hero-prism-skill-burst.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-prism-skill-recover',
    url: new URL('../../assets/sprites/hero-prism-skill-recover.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-gravity-skill-windup',
    url: new URL('../../assets/sprites/hero-gravity-skill-windup.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-gravity-skill-charge',
    url: new URL('../../assets/sprites/hero-gravity-skill-charge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-gravity-skill-burst',
    url: new URL('../../assets/sprites/hero-gravity-skill-burst.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'hero-gravity-skill-recover',
    url: new URL('../../assets/sprites/hero-gravity-skill-recover.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B03 稜化／引力化光環拖尾分層 VFX（核心光/外圈衝擊/拖尾/碎片/overlay 獨立疊加）。
  {
    key: 'fx-prism-aura-core',
    url: new URL('../../assets/sprites/fx-prism-aura-core.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-prism-aura-shock',
    url: new URL('../../assets/sprites/fx-prism-aura-shock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-prism-aura-trail',
    url: new URL('../../assets/sprites/fx-prism-aura-trail.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-prism-aura-debris',
    url: new URL('../../assets/sprites/fx-prism-aura-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-prism-aura-overlay',
    url: new URL('../../assets/sprites/fx-prism-aura-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-gravity-aura-core',
    url: new URL('../../assets/sprites/fx-gravity-aura-core.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-gravity-aura-shock',
    url: new URL('../../assets/sprites/fx-gravity-aura-shock.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-gravity-aura-trail',
    url: new URL('../../assets/sprites/fx-gravity-aura-trail.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-gravity-aura-debris',
    url: new URL('../../assets/sprites/fx-gravity-aura-debris.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'fx-gravity-aura-overlay',
    url: new URL('../../assets/sprites/fx-gravity-aura-overlay.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  // v21-v30 B03 形態徽章與技能 HUD 圖示（載入時機建議：HUD 顯示前延遲載入，暫沿 Boot 預載）。
  {
    key: 'ui-prism-badge',
    url: new URL('../../assets/sprites/ui-prism-badge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-prism-skill',
    url: new URL('../../assets/sprites/ui-prism-skill.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-gravity-badge',
    url: new URL('../../assets/sprites/ui-gravity-badge.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
  {
    key: 'ui-gravity-skill',
    url: new URL('../../assets/sprites/ui-gravity-skill.webp', import.meta.url).href,

    phase: 'lazy', // 待接關改回 'form'（W2/W3 接入 LevelSpec／TRANSFORM_FORMS 時必改）
  },
];
