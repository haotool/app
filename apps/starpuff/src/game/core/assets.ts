// 分階段載入 SSOT（§115）：載入時機由 manifest 的 phase 欄位單點驅動，
// 場景不得自行散寫資產清單。新增條目請一併標註 phase。
//   boot  首屏（Title／Map／Codex／Result 選單殼）必須存在的最小集合
//   level 進入關卡時載入（背景／道具／小怪為關卡限定，其餘為全關共用核心）
//   boss  魔王關才載入的魔王立繪
//   form  形態解鎖後才需要的變身立繪
//   lazy  非戰鬥的按需資產（HUD 徽章等），由使用端自行補載
// lazy 目前無 scene 呼叫點：任何關卡會用到的資產都不得標為 lazy，否則該關會無聲缺圖
// 走佔位色塊。assetPlan.test 的「登場貼圖必定載得到」不變式守門，涵蓋範圍為
// levelAssetKeys 派生鍵——關卡限定的背景／道具／小怪／魔王，加上共用的主角姿勢與
// 形態立繪（SHARED_LEVEL_KEYS）。不在該派生內的資產（例如 form 階段的變身動畫分鏡、
// 特效分層）標錯不會被擋下，新增這類條目時請自行確認載入時機。
export type AssetPhase = 'boot' | 'level' | 'boss' | 'form' | 'lazy';

export interface AssetEntry {
  key: string;
  url: string;
  // 省略＝視為 boot（安全預設）：漏標只會拖慢首屏，不會讓遊戲缺圖。
  phase?: AssetPhase;
}

export const ASSETS: AssetEntry[] = [
  {
    key: 'hero-idle',
    url: new URL('../../assets/sprites/hero-idle.webp', import.meta.url).href,
    phase: 'boot',
  },
  {
    key: 'hero-inhale',
    url: new URL('../../assets/sprites/hero-inhale.webp', import.meta.url).href,
    phase: 'level',
  },
  // 大嘴吸入影格（§77.4）：吸入進行中兩影格交替。
  {
    key: 'hero-inhale-big-1',
    url: new URL('../../assets/sprites/hero-inhale-big-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'hero-inhale-big-2',
    url: new URL('../../assets/sprites/hero-inhale-big-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'hero-puffed',
    url: new URL('../../assets/sprites/hero-puffed.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'hero-hurt',
    url: new URL('../../assets/sprites/hero-hurt.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-jelly',
    url: new URL('../../assets/sprites/minion-jelly.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-floaty',
    url: new URL('../../assets/sprites/minion-floaty.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-spiky',
    url: new URL('../../assets/sprites/minion-spiky.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'boss-idle',
    url: new URL('../../assets/sprites/boss-idle.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'boss-enraged',
    url: new URL('../../assets/sprites/boss-enraged.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-star',
    url: new URL('../../assets/sprites/fx-star.webp', import.meta.url).href,
    phase: 'boot',
  },
  {
    key: 'bg-meadow-l',
    url: new URL('../../assets/sprites/bg-meadow-l.webp', import.meta.url).href,
    phase: 'boot',
  },
  {
    key: 'bg-heights-l',
    url: new URL('../../assets/sprites/bg-heights-l.webp', import.meta.url).href,
    phase: 'boot',
  },
  {
    key: 'bg-arena-l',
    url: new URL('../../assets/sprites/bg-arena-l.webp', import.meta.url).href,
    phase: 'boot',
  },
  {
    key: 'bg-throne-l',
    url: new URL('../../assets/sprites/bg-throne-l.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-clouds',
    url: new URL('../../assets/sprites/fx-clouds.webp', import.meta.url).href,
    phase: 'boot',
  },
  {
    key: 'minion-puffy',
    url: new URL('../../assets/sprites/minion-puffy.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-chompy',
    url: new URL('../../assets/sprites/minion-chompy.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-shelly',
    url: new URL('../../assets/sprites/minion-shelly.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-zappy',
    url: new URL('../../assets/sprites/minion-zappy.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-drilly',
    url: new URL('../../assets/sprites/minion-drilly.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-glowy',
    url: new URL('../../assets/sprites/minion-glowy.webp', import.meta.url).href,
    phase: 'level',
  },
  // v8 世界擴張（§55）：新怪三種＋第二魔王＋L5/L7 新 biome 橫景。
  {
    key: 'minion-spora',
    url: new URL('../../assets/sprites/minion-spora.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-gusty',
    url: new URL('../../assets/sprites/minion-gusty.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-boomy',
    url: new URL('../../assets/sprites/minion-boomy.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'boss-noctra',
    url: new URL('../../assets/sprites/boss-noctra.webp', import.meta.url).href,
    phase: 'boss',
  },
  // v9 星化與挑戰（§61）：hero 三形態＋新怪兩種；背景重用既有（不生成新背景）。
  {
    key: 'hero-volt',
    url: new URL('../../assets/sprites/hero-volt.webp', import.meta.url).href,
    phase: 'form',
  },
  {
    key: 'hero-gale',
    url: new URL('../../assets/sprites/hero-gale.webp', import.meta.url).href,
    phase: 'form',
  },
  {
    key: 'hero-shell',
    url: new URL('../../assets/sprites/hero-shell.webp', import.meta.url).href,
    phase: 'form',
  },
  // v21-v30 素材先行：未接入玩法的 Ember 形態與終章金融魔王資產。
  {
    key: 'hero-ember',
    url: new URL('../../assets/sprites/hero-ember.webp', import.meta.url).href,
  },
  {
    key: 'minion-magno',
    url: new URL('../../assets/sprites/minion-magno.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-mirri',
    url: new URL('../../assets/sprites/minion-mirri.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'bg-canyon-l',
    url: new URL('../../assets/sprites/bg-canyon-l.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'bg-eclipse-l',
    url: new URL('../../assets/sprites/bg-eclipse-l.webp', import.meta.url).href,
    phase: 'level',
  },
  // v10 三區完結（§68）：第三魔王稜晶雙子；L10-L12 背景重用既有貼圖（§66/§67）。
  {
    key: 'boss-prismix',
    url: new URL('../../assets/sprites/boss-prismix.webp', import.meta.url).href,
    phase: 'boss',
  },
  // v11 四區完結（§73/§74/§76）：新怪兩種＋第四魔王＋焙糖火山橫景。
  {
    key: 'minion-bubbla',
    url: new URL('../../assets/sprites/minion-bubbla.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-splatta',
    url: new URL('../../assets/sprites/minion-splatta.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'boss-syrona',
    url: new URL('../../assets/sprites/boss-syrona.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'bg-kiln-l',
    url: new URL('../../assets/sprites/bg-kiln-l.webp', import.meta.url).href,
    phase: 'level',
  },
  // v4 主題道具（§31/§32）：道具條 4 等分切割後逐件註冊，佈景資料驅動於 levels.ts decor。
  {
    key: 'prop-meadow-1',
    url: new URL('../../assets/sprites/prop-meadow-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-meadow-2',
    url: new URL('../../assets/sprites/prop-meadow-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-meadow-3',
    url: new URL('../../assets/sprites/prop-meadow-3.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-meadow-4',
    url: new URL('../../assets/sprites/prop-meadow-4.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-heights-1',
    url: new URL('../../assets/sprites/prop-heights-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-heights-2',
    url: new URL('../../assets/sprites/prop-heights-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-heights-3',
    url: new URL('../../assets/sprites/prop-heights-3.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-heights-4',
    url: new URL('../../assets/sprites/prop-heights-4.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-arena-1',
    url: new URL('../../assets/sprites/prop-arena-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-arena-2',
    url: new URL('../../assets/sprites/prop-arena-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-arena-3',
    url: new URL('../../assets/sprites/prop-arena-3.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-arena-4',
    url: new URL('../../assets/sprites/prop-arena-4.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-throne-1',
    url: new URL('../../assets/sprites/prop-throne-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-throne-2',
    url: new URL('../../assets/sprites/prop-throne-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-throne-3',
    url: new URL('../../assets/sprites/prop-throne-3.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-throne-4',
    url: new URL('../../assets/sprites/prop-throne-4.webp', import.meta.url).href,
    phase: 'level',
  },
  // v11 窯主題道具條（§76）：窯磚/糖罐/風箱/焦糖柱。
  {
    key: 'prop-kiln-1',
    url: new URL('../../assets/sprites/prop-kiln-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-kiln-2',
    url: new URL('../../assets/sprites/prop-kiln-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-kiln-3',
    url: new URL('../../assets/sprites/prop-kiln-3.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-kiln-4',
    url: new URL('../../assets/sprites/prop-kiln-4.webp', import.meta.url).href,
    phase: 'level',
  },
  // v12 五區終章（§80/§82/§84）：新怪兩種＋最終魔王＋星核聖域橫景（四關共用 grade 區分）。
  {
    key: 'minion-twinkla',
    url: new URL('../../assets/sprites/minion-twinkla.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-cometa',
    url: new URL('../../assets/sprites/minion-cometa.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'boss-voidra',
    url: new URL('../../assets/sprites/boss-voidra.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'boss-liudong',
    url: new URL('../../assets/sprites/boss-liudong.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-thinking',
    url: new URL('../../assets/sprites/boss-liudong-thinking.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-down-arrow',
    url: new URL('../../assets/sprites/fx-market-down-arrow.webp', import.meta.url).href,
  },
  {
    key: 'bg-astral-l',
    url: new URL('../../assets/sprites/bg-astral-l.webp', import.meta.url).href,
    phase: 'level',
  },
  // v21-v30 B02 星港／潮灣場景（載入時機建議：L21/L23 關卡載入，暫沿 Boot 預載）。
  {
    key: 'bg-starport-l',
    url: new URL('../../assets/sprites/bg-starport-l.webp', import.meta.url).href,
  },
  {
    key: 'prop-starport-1',
    url: new URL('../../assets/sprites/prop-starport-1.webp', import.meta.url).href,
  },
  {
    key: 'prop-starport-2',
    url: new URL('../../assets/sprites/prop-starport-2.webp', import.meta.url).href,
  },
  {
    key: 'prop-starport-3',
    url: new URL('../../assets/sprites/prop-starport-3.webp', import.meta.url).href,
  },
  {
    key: 'prop-starport-4',
    url: new URL('../../assets/sprites/prop-starport-4.webp', import.meta.url).href,
  },
  {
    key: 'bg-tidebay-l',
    url: new URL('../../assets/sprites/bg-tidebay-l.webp', import.meta.url).href,
  },
  {
    key: 'prop-tidebay-1',
    url: new URL('../../assets/sprites/prop-tidebay-1.webp', import.meta.url).href,
  },
  {
    key: 'prop-tidebay-2',
    url: new URL('../../assets/sprites/prop-tidebay-2.webp', import.meta.url).href,
  },
  {
    key: 'prop-tidebay-3',
    url: new URL('../../assets/sprites/prop-tidebay-3.webp', import.meta.url).href,
  },
  {
    key: 'prop-tidebay-4',
    url: new URL('../../assets/sprites/prop-tidebay-4.webp', import.meta.url).href,
  },
  // v21-v30 B02 雙王（載入時機建議：L22/L24 魔王關載入，暫沿 Boot 預載）。
  {
    key: 'boss-tariffang',
    url: new URL('../../assets/sprites/boss-tariffang.webp', import.meta.url).href,
  },
  {
    key: 'boss-tariffang-enraged',
    url: new URL('../../assets/sprites/boss-tariffang-enraged.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella',
    url: new URL('../../assets/sprites/boss-maridella.webp', import.meta.url).href,
  },
  {
    key: 'boss-maridella-enraged',
    url: new URL('../../assets/sprites/boss-maridella-enraged.webp', import.meta.url).href,
  },
  // v21-v30 B02 六新小怪（載入時機建議：L21/L23 關卡載入，暫沿 Boot 預載）。
  {
    key: 'minion-cargojelly',
    url: new URL('../../assets/sprites/minion-cargojelly.webp', import.meta.url).href,
  },
  {
    key: 'minion-ticketbat',
    url: new URL('../../assets/sprites/minion-ticketbat.webp', import.meta.url).href,
  },
  {
    key: 'minion-scannereye',
    url: new URL('../../assets/sprites/minion-scannereye.webp', import.meta.url).href,
  },
  {
    key: 'minion-bubbler',
    url: new URL('../../assets/sprites/minion-bubbler.webp', import.meta.url).href,
  },
  {
    key: 'minion-iceslime',
    url: new URL('../../assets/sprites/minion-iceslime.webp', import.meta.url).href,
  },
  {
    key: 'minion-tideray',
    url: new URL('../../assets/sprites/minion-tideray.webp', import.meta.url).href,
  },
  // v21-v30 B02 潮化基底與焰化／潮化變身五幀（載入時機建議：形態解鎖前延遲載入，暫沿 Boot 預載）。
  {
    key: 'hero-tide',
    url: new URL('../../assets/sprites/hero-tide.webp', import.meta.url).href,
  },
  {
    key: 'hero-ember-morph-gather',
    url: new URL('../../assets/sprites/hero-ember-morph-gather.webp', import.meta.url).href,
  },
  {
    key: 'hero-ember-morph-shrink',
    url: new URL('../../assets/sprites/hero-ember-morph-shrink.webp', import.meta.url).href,
  },
  {
    key: 'hero-ember-morph-stretch',
    url: new URL('../../assets/sprites/hero-ember-morph-stretch.webp', import.meta.url).href,
  },
  {
    key: 'hero-ember-morph-burst',
    url: new URL('../../assets/sprites/hero-ember-morph-burst.webp', import.meta.url).href,
  },
  {
    key: 'hero-ember-morph-complete',
    url: new URL('../../assets/sprites/hero-ember-morph-complete.webp', import.meta.url).href,
  },
  {
    key: 'hero-tide-morph-gather',
    url: new URL('../../assets/sprites/hero-tide-morph-gather.webp', import.meta.url).href,
  },
  {
    key: 'hero-tide-morph-shrink',
    url: new URL('../../assets/sprites/hero-tide-morph-shrink.webp', import.meta.url).href,
  },
  {
    key: 'hero-tide-morph-stretch',
    url: new URL('../../assets/sprites/hero-tide-morph-stretch.webp', import.meta.url).href,
  },
  {
    key: 'hero-tide-morph-burst',
    url: new URL('../../assets/sprites/hero-tide-morph-burst.webp', import.meta.url).href,
  },
  {
    key: 'hero-tide-morph-complete',
    url: new URL('../../assets/sprites/hero-tide-morph-complete.webp', import.meta.url).href,
  },
  // v21-v30 B02 焰化／潮化技能四拍（載入時機建議：形態解鎖前延遲載入，暫沿 Boot 預載）。
  {
    key: 'hero-ember-skill-windup',
    url: new URL('../../assets/sprites/hero-ember-skill-windup.webp', import.meta.url).href,
  },
  {
    key: 'hero-ember-skill-charge',
    url: new URL('../../assets/sprites/hero-ember-skill-charge.webp', import.meta.url).href,
  },
  {
    key: 'hero-ember-skill-burst',
    url: new URL('../../assets/sprites/hero-ember-skill-burst.webp', import.meta.url).href,
  },
  {
    key: 'hero-ember-skill-recover',
    url: new URL('../../assets/sprites/hero-ember-skill-recover.webp', import.meta.url).href,
  },
  {
    key: 'hero-tide-skill-windup',
    url: new URL('../../assets/sprites/hero-tide-skill-windup.webp', import.meta.url).href,
  },
  {
    key: 'hero-tide-skill-charge',
    url: new URL('../../assets/sprites/hero-tide-skill-charge.webp', import.meta.url).href,
  },
  {
    key: 'hero-tide-skill-burst',
    url: new URL('../../assets/sprites/hero-tide-skill-burst.webp', import.meta.url).href,
  },
  {
    key: 'hero-tide-skill-recover',
    url: new URL('../../assets/sprites/hero-tide-skill-recover.webp', import.meta.url).href,
  },
  // v21-v30 B02 焰化／潮化光環拖尾分層 VFX（核心光/外圈衝擊/拖尾/碎片/overlay 獨立疊加）。
  {
    key: 'fx-ember-aura-core',
    url: new URL('../../assets/sprites/fx-ember-aura-core.webp', import.meta.url).href,
  },
  {
    key: 'fx-ember-aura-shock',
    url: new URL('../../assets/sprites/fx-ember-aura-shock.webp', import.meta.url).href,
  },
  {
    key: 'fx-ember-aura-trail',
    url: new URL('../../assets/sprites/fx-ember-aura-trail.webp', import.meta.url).href,
  },
  {
    key: 'fx-ember-aura-debris',
    url: new URL('../../assets/sprites/fx-ember-aura-debris.webp', import.meta.url).href,
  },
  {
    key: 'fx-ember-aura-overlay',
    url: new URL('../../assets/sprites/fx-ember-aura-overlay.webp', import.meta.url).href,
  },
  {
    key: 'fx-tide-aura-core',
    url: new URL('../../assets/sprites/fx-tide-aura-core.webp', import.meta.url).href,
  },
  {
    key: 'fx-tide-aura-shock',
    url: new URL('../../assets/sprites/fx-tide-aura-shock.webp', import.meta.url).href,
  },
  {
    key: 'fx-tide-aura-trail',
    url: new URL('../../assets/sprites/fx-tide-aura-trail.webp', import.meta.url).href,
  },
  {
    key: 'fx-tide-aura-debris',
    url: new URL('../../assets/sprites/fx-tide-aura-debris.webp', import.meta.url).href,
  },
  {
    key: 'fx-tide-aura-overlay',
    url: new URL('../../assets/sprites/fx-tide-aura-overlay.webp', import.meta.url).href,
  },
  // v21-v30 B02 形態徽章與技能 HUD 圖示（載入時機建議：HUD 顯示前延遲載入，暫沿 Boot 預載）。
  {
    key: 'ui-ember-badge',
    url: new URL('../../assets/sprites/ui-ember-badge.webp', import.meta.url).href,
  },
  {
    key: 'ui-ember-skill',
    url: new URL('../../assets/sprites/ui-ember-skill.webp', import.meta.url).href,
  },
  {
    key: 'ui-tide-badge',
    url: new URL('../../assets/sprites/ui-tide-badge.webp', import.meta.url).href,
  },
  {
    key: 'ui-tide-skill',
    url: new URL('../../assets/sprites/ui-tide-skill.webp', import.meta.url).href,
  },
  // v21-v30 B03 鏡界塔／黑洞外環場景（載入時機建議：L25/L27 關卡載入，暫沿 Boot 預載）。
  {
    key: 'bg-mirror-l',
    url: new URL('../../assets/sprites/bg-mirror-l.webp', import.meta.url).href,
  },
  {
    key: 'prop-mirror-1',
    url: new URL('../../assets/sprites/prop-mirror-1.webp', import.meta.url).href,
  },
  {
    key: 'prop-mirror-2',
    url: new URL('../../assets/sprites/prop-mirror-2.webp', import.meta.url).href,
  },
  {
    key: 'prop-mirror-3',
    url: new URL('../../assets/sprites/prop-mirror-3.webp', import.meta.url).href,
  },
  {
    key: 'prop-mirror-4',
    url: new URL('../../assets/sprites/prop-mirror-4.webp', import.meta.url).href,
  },
  {
    key: 'bg-voidring-l',
    url: new URL('../../assets/sprites/bg-voidring-l.webp', import.meta.url).href,
  },
  {
    key: 'prop-voidring-1',
    url: new URL('../../assets/sprites/prop-voidring-1.webp', import.meta.url).href,
  },
  {
    key: 'prop-voidring-2',
    url: new URL('../../assets/sprites/prop-voidring-2.webp', import.meta.url).href,
  },
  {
    key: 'prop-voidring-3',
    url: new URL('../../assets/sprites/prop-voidring-3.webp', import.meta.url).href,
  },
  {
    key: 'prop-voidring-4',
    url: new URL('../../assets/sprites/prop-voidring-4.webp', import.meta.url).href,
  },
  // v21-v30 B03 雙王（載入時機建議：L26/L28 魔王關載入，暫沿 Boot 預載）。
  {
    key: 'boss-reflector',
    url: new URL('../../assets/sprites/boss-reflector.webp', import.meta.url).href,
  },
  {
    key: 'boss-reflector-enraged',
    url: new URL('../../assets/sprites/boss-reflector-enraged.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion',
    url: new URL('../../assets/sprites/boss-gravion.webp', import.meta.url).href,
  },
  {
    key: 'boss-gravion-enraged',
    url: new URL('../../assets/sprites/boss-gravion-enraged.webp', import.meta.url).href,
  },
  // v21-v30 B03 六新小怪（載入時機建議：L25/L27 關卡載入，暫沿 Boot 預載）。
  {
    key: 'minion-copypuff',
    url: new URL('../../assets/sprites/minion-copypuff.webp', import.meta.url).href,
  },
  {
    key: 'minion-prismbee',
    url: new URL('../../assets/sprites/minion-prismbee.webp', import.meta.url).href,
  },
  {
    key: 'minion-datamote',
    url: new URL('../../assets/sprites/minion-datamote.webp', import.meta.url).href,
  },
  {
    key: 'minion-gravitybub',
    url: new URL('../../assets/sprites/minion-gravitybub.webp', import.meta.url).href,
  },
  {
    key: 'minion-orbiton',
    url: new URL('../../assets/sprites/minion-orbiton.webp', import.meta.url).href,
  },
  {
    key: 'minion-riftling',
    url: new URL('../../assets/sprites/minion-riftling.webp', import.meta.url).href,
  },
  // v21-v30 B03 稜化／引力化基底與變身五幀（載入時機建議：形態解鎖前延遲載入，暫沿 Boot 預載）。
  {
    key: 'hero-prism',
    url: new URL('../../assets/sprites/hero-prism.webp', import.meta.url).href,
  },
  {
    key: 'hero-gravity',
    url: new URL('../../assets/sprites/hero-gravity.webp', import.meta.url).href,
  },
  {
    key: 'hero-prism-morph-gather',
    url: new URL('../../assets/sprites/hero-prism-morph-gather.webp', import.meta.url).href,
  },
  {
    key: 'hero-prism-morph-shrink',
    url: new URL('../../assets/sprites/hero-prism-morph-shrink.webp', import.meta.url).href,
  },
  {
    key: 'hero-prism-morph-stretch',
    url: new URL('../../assets/sprites/hero-prism-morph-stretch.webp', import.meta.url).href,
  },
  {
    key: 'hero-prism-morph-burst',
    url: new URL('../../assets/sprites/hero-prism-morph-burst.webp', import.meta.url).href,
  },
  {
    key: 'hero-prism-morph-complete',
    url: new URL('../../assets/sprites/hero-prism-morph-complete.webp', import.meta.url).href,
  },
  {
    key: 'hero-gravity-morph-gather',
    url: new URL('../../assets/sprites/hero-gravity-morph-gather.webp', import.meta.url).href,
  },
  {
    key: 'hero-gravity-morph-shrink',
    url: new URL('../../assets/sprites/hero-gravity-morph-shrink.webp', import.meta.url).href,
  },
  {
    key: 'hero-gravity-morph-stretch',
    url: new URL('../../assets/sprites/hero-gravity-morph-stretch.webp', import.meta.url).href,
  },
  {
    key: 'hero-gravity-morph-burst',
    url: new URL('../../assets/sprites/hero-gravity-morph-burst.webp', import.meta.url).href,
  },
  {
    key: 'hero-gravity-morph-complete',
    url: new URL('../../assets/sprites/hero-gravity-morph-complete.webp', import.meta.url).href,
  },
  // v21-v30 B03 稜化／引力化技能四拍（載入時機建議：形態解鎖前延遲載入，暫沿 Boot 預載）。
  {
    key: 'hero-prism-skill-windup',
    url: new URL('../../assets/sprites/hero-prism-skill-windup.webp', import.meta.url).href,
  },
  {
    key: 'hero-prism-skill-charge',
    url: new URL('../../assets/sprites/hero-prism-skill-charge.webp', import.meta.url).href,
  },
  {
    key: 'hero-prism-skill-burst',
    url: new URL('../../assets/sprites/hero-prism-skill-burst.webp', import.meta.url).href,
  },
  {
    key: 'hero-prism-skill-recover',
    url: new URL('../../assets/sprites/hero-prism-skill-recover.webp', import.meta.url).href,
  },
  {
    key: 'hero-gravity-skill-windup',
    url: new URL('../../assets/sprites/hero-gravity-skill-windup.webp', import.meta.url).href,
  },
  {
    key: 'hero-gravity-skill-charge',
    url: new URL('../../assets/sprites/hero-gravity-skill-charge.webp', import.meta.url).href,
  },
  {
    key: 'hero-gravity-skill-burst',
    url: new URL('../../assets/sprites/hero-gravity-skill-burst.webp', import.meta.url).href,
  },
  {
    key: 'hero-gravity-skill-recover',
    url: new URL('../../assets/sprites/hero-gravity-skill-recover.webp', import.meta.url).href,
  },
  // v21-v30 B03 稜化／引力化光環拖尾分層 VFX（核心光/外圈衝擊/拖尾/碎片/overlay 獨立疊加）。
  {
    key: 'fx-prism-aura-core',
    url: new URL('../../assets/sprites/fx-prism-aura-core.webp', import.meta.url).href,
  },
  {
    key: 'fx-prism-aura-shock',
    url: new URL('../../assets/sprites/fx-prism-aura-shock.webp', import.meta.url).href,
  },
  {
    key: 'fx-prism-aura-trail',
    url: new URL('../../assets/sprites/fx-prism-aura-trail.webp', import.meta.url).href,
  },
  {
    key: 'fx-prism-aura-debris',
    url: new URL('../../assets/sprites/fx-prism-aura-debris.webp', import.meta.url).href,
  },
  {
    key: 'fx-prism-aura-overlay',
    url: new URL('../../assets/sprites/fx-prism-aura-overlay.webp', import.meta.url).href,
  },
  {
    key: 'fx-gravity-aura-core',
    url: new URL('../../assets/sprites/fx-gravity-aura-core.webp', import.meta.url).href,
  },
  {
    key: 'fx-gravity-aura-shock',
    url: new URL('../../assets/sprites/fx-gravity-aura-shock.webp', import.meta.url).href,
  },
  {
    key: 'fx-gravity-aura-trail',
    url: new URL('../../assets/sprites/fx-gravity-aura-trail.webp', import.meta.url).href,
  },
  {
    key: 'fx-gravity-aura-debris',
    url: new URL('../../assets/sprites/fx-gravity-aura-debris.webp', import.meta.url).href,
  },
  {
    key: 'fx-gravity-aura-overlay',
    url: new URL('../../assets/sprites/fx-gravity-aura-overlay.webp', import.meta.url).href,
  },
  // v21-v30 B03 形態徽章與技能 HUD 圖示（載入時機建議：HUD 顯示前延遲載入，暫沿 Boot 預載）。
  {
    key: 'ui-prism-badge',
    url: new URL('../../assets/sprites/ui-prism-badge.webp', import.meta.url).href,
  },
  {
    key: 'ui-prism-skill',
    url: new URL('../../assets/sprites/ui-prism-skill.webp', import.meta.url).href,
  },
  {
    key: 'ui-gravity-badge',
    url: new URL('../../assets/sprites/ui-gravity-badge.webp', import.meta.url).href,
  },
  {
    key: 'ui-gravity-skill',
    url: new URL('../../assets/sprites/ui-gravity-skill.webp', import.meta.url).href,
  },
  // v21-v30 B04 崩盤前夜／劉董戰場場景（載入時機建議：L29/L30 關卡載入，暫沿 Boot 預載）。
  {
    key: 'bg-crasheve-l',
    url: new URL('../../assets/sprites/bg-crasheve-l.webp', import.meta.url).href,
  },
  {
    key: 'prop-crasheve-1',
    url: new URL('../../assets/sprites/prop-crasheve-1.webp', import.meta.url).href,
  },
  {
    key: 'prop-crasheve-2',
    url: new URL('../../assets/sprites/prop-crasheve-2.webp', import.meta.url).href,
  },
  {
    key: 'prop-crasheve-3',
    url: new URL('../../assets/sprites/prop-crasheve-3.webp', import.meta.url).href,
  },
  {
    key: 'prop-crasheve-4',
    url: new URL('../../assets/sprites/prop-crasheve-4.webp', import.meta.url).href,
  },
  {
    key: 'bg-market-l',
    url: new URL('../../assets/sprites/bg-market-l.webp', import.meta.url).href,
  },
  {
    key: 'prop-market-1',
    url: new URL('../../assets/sprites/prop-market-1.webp', import.meta.url).href,
  },
  {
    key: 'prop-market-2',
    url: new URL('../../assets/sprites/prop-market-2.webp', import.meta.url).href,
  },
  {
    key: 'prop-market-3',
    url: new URL('../../assets/sprites/prop-market-3.webp', import.meta.url).href,
  },
  {
    key: 'prop-market-4',
    url: new URL('../../assets/sprites/prop-market-4.webp', import.meta.url).href,
  },
  // v21-v30 B04 劉董三形態補完與入金演出四幀（載入時機建議：L30 魔王關載入，暫沿 Boot 預載）。
  {
    key: 'boss-liudong-enraged',
    url: new URL('../../assets/sprites/boss-liudong-enraged.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-doom',
    url: new URL('../../assets/sprites/boss-liudong-doom.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-entry-1',
    url: new URL('../../assets/sprites/boss-liudong-entry-1.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-entry-2',
    url: new URL('../../assets/sprites/boss-liudong-entry-2.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-entry-3',
    url: new URL('../../assets/sprites/boss-liudong-entry-3.webp', import.meta.url).href,
  },
  {
    key: 'boss-liudong-entry-4',
    url: new URL('../../assets/sprites/boss-liudong-entry-4.webp', import.meta.url).href,
  },
  // v21-v30 B04 牛熊怪與三市場圖示（載入時機建議：L29/L30 關卡載入，暫沿 Boot 預載）。
  {
    key: 'minion-bullrun',
    url: new URL('../../assets/sprites/minion-bullrun.webp', import.meta.url).href,
  },
  {
    key: 'minion-bearmarket',
    url: new URL('../../assets/sprites/minion-bearmarket.webp', import.meta.url).href,
  },
  {
    key: 'minion-bearlet',
    url: new URL('../../assets/sprites/minion-bearlet.webp', import.meta.url).href,
  },
  {
    key: 'ui-market-usstock',
    url: new URL('../../assets/sprites/ui-market-usstock.webp', import.meta.url).href,
  },
  {
    key: 'ui-market-crypto',
    url: new URL('../../assets/sprites/ui-market-crypto.webp', import.meta.url).href,
  },
  {
    key: 'ui-market-taistock',
    url: new URL('../../assets/sprites/ui-market-taistock.webp', import.meta.url).href,
  },
  // v21-v30 B04 下跌箭頭三變體（假箭頭空心鈍頭可辨識）與市場攻擊單件。
  {
    key: 'fx-market-arrow-big',
    url: new URL('../../assets/sprites/fx-market-arrow-big.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-arrow-small',
    url: new URL('../../assets/sprites/fx-market-arrow-small.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-arrow-fake',
    url: new URL('../../assets/sprites/fx-market-arrow-fake.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-coin',
    url: new URL('../../assets/sprites/fx-market-coin.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-candle-green',
    url: new URL('../../assets/sprites/fx-market-candle-green.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-candle-pin',
    url: new URL('../../assets/sprites/fx-market-candle-pin.webp', import.meta.url).href,
  },
  {
    key: 'fx-market-circuitwall',
    url: new URL('../../assets/sprites/fx-market-circuitwall.webp', import.meta.url).href,
  },
];
