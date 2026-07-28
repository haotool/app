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
    key: 'bg-astral-l',
    url: new URL('../../assets/sprites/bg-astral-l.webp', import.meta.url).href,
    phase: 'level',
  },
  // §119/§120/§121 W1 接關（PR #886）：焰化/潮化立繪、六新怪立繪、兩張專屬橫景
  // 自 assetsV21Part1 逐筆搬回（#857 接關契約）；稜化/引力化立繪待 L25/L27 入編
  //（FORM_INTRO_LEVEL 過濾下 W1 無關卡認領），留在 lazy 分檔。
  {
    key: 'hero-ember',
    url: new URL('../../assets/sprites/hero-ember.webp', import.meta.url).href,
    phase: 'form',
  },
  {
    key: 'hero-tide',
    url: new URL('../../assets/sprites/hero-tide.webp', import.meta.url).href,
    phase: 'form',
  },
  {
    key: 'bg-starport-l',
    url: new URL('../../assets/sprites/bg-starport-l.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'bg-tidebay-l',
    url: new URL('../../assets/sprites/bg-tidebay-l.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-cargojelly',
    url: new URL('../../assets/sprites/minion-cargojelly.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-ticketbat',
    url: new URL('../../assets/sprites/minion-ticketbat.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-scannereye',
    url: new URL('../../assets/sprites/minion-scannereye.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-bubbler',
    url: new URL('../../assets/sprites/minion-bubbler.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-iceslime',
    url: new URL('../../assets/sprites/minion-iceslime.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-tideray',
    url: new URL('../../assets/sprites/minion-tideray.webp', import.meta.url).href,
    phase: 'level',
  },
  // §122 W2 接關：Tariffang/Maridella 雙王立繪（含 enraged 幀）與星港/潮灣道具條
  // 自 assetsV21Part1 逐筆搬回（#857 接關契約）。
  {
    key: 'boss-tariffang',
    url: new URL('../../assets/sprites/boss-tariffang.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'boss-tariffang-enraged',
    url: new URL('../../assets/sprites/boss-tariffang-enraged.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'boss-maridella',
    url: new URL('../../assets/sprites/boss-maridella.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'boss-maridella-enraged',
    url: new URL('../../assets/sprites/boss-maridella-enraged.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'prop-starport-1',
    url: new URL('../../assets/sprites/prop-starport-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-starport-2',
    url: new URL('../../assets/sprites/prop-starport-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-starport-3',
    url: new URL('../../assets/sprites/prop-starport-3.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-starport-4',
    url: new URL('../../assets/sprites/prop-starport-4.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-tidebay-1',
    url: new URL('../../assets/sprites/prop-tidebay-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-tidebay-2',
    url: new URL('../../assets/sprites/prop-tidebay-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-tidebay-3',
    url: new URL('../../assets/sprites/prop-tidebay-3.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-tidebay-4',
    url: new URL('../../assets/sprites/prop-tidebay-4.webp', import.meta.url).href,
    phase: 'level',
  },
  // §123 W3 接關：稜化/引力化立繪（FORM_INTRO_LEVEL L25/L27 認領）、鏡界塔/黑洞
  // 外環橫景與道具條、Reflector/Gravion 雙王立繪（含 enraged 幀）、七新小怪立繪
  // 自 assetsV21Part1/2 逐筆搬回（#857 接關契約）。
  {
    key: 'hero-prism',
    url: new URL('../../assets/sprites/hero-prism.webp', import.meta.url).href,
    phase: 'form',
  },
  {
    key: 'hero-gravity',
    url: new URL('../../assets/sprites/hero-gravity.webp', import.meta.url).href,
    phase: 'form',
  },
  {
    key: 'bg-mirror-l',
    url: new URL('../../assets/sprites/bg-mirror-l.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'bg-voidring-l',
    url: new URL('../../assets/sprites/bg-voidring-l.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'boss-reflector',
    url: new URL('../../assets/sprites/boss-reflector.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'boss-reflector-enraged',
    url: new URL('../../assets/sprites/boss-reflector-enraged.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'boss-gravion',
    url: new URL('../../assets/sprites/boss-gravion.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'boss-gravion-enraged',
    url: new URL('../../assets/sprites/boss-gravion-enraged.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'minion-copypuff',
    url: new URL('../../assets/sprites/minion-copypuff.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-prismbee',
    url: new URL('../../assets/sprites/minion-prismbee.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-datamote',
    url: new URL('../../assets/sprites/minion-datamote.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-gravitybub',
    url: new URL('../../assets/sprites/minion-gravitybub.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-orbiton',
    url: new URL('../../assets/sprites/minion-orbiton.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-riftling',
    url: new URL('../../assets/sprites/minion-riftling.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-bearlet',
    url: new URL('../../assets/sprites/minion-bearlet.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-mirror-1',
    url: new URL('../../assets/sprites/prop-mirror-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-mirror-2',
    url: new URL('../../assets/sprites/prop-mirror-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-mirror-3',
    url: new URL('../../assets/sprites/prop-mirror-3.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-mirror-4',
    url: new URL('../../assets/sprites/prop-mirror-4.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-voidring-1',
    url: new URL('../../assets/sprites/prop-voidring-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-voidring-2',
    url: new URL('../../assets/sprites/prop-voidring-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-voidring-3',
    url: new URL('../../assets/sprites/prop-voidring-3.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-voidring-4',
    url: new URL('../../assets/sprites/prop-voidring-4.webp', import.meta.url).href,
    phase: 'level',
  },
  // §126 W4 接關：崩盤前夜/市場王座橫景與道具條、牛熊怪立繪、劉董完整動畫組
  // 與市場 FX（liudongCinematics/systems/liudong 消費）自 assetsV21Part1/2/3 逐筆
  // 搬回（#857 接關契約）。
  {
    key: 'bg-crasheve-l',
    url: new URL('../../assets/sprites/bg-crasheve-l.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-crasheve-1',
    url: new URL('../../assets/sprites/prop-crasheve-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-crasheve-2',
    url: new URL('../../assets/sprites/prop-crasheve-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-crasheve-3',
    url: new URL('../../assets/sprites/prop-crasheve-3.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-crasheve-4',
    url: new URL('../../assets/sprites/prop-crasheve-4.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'bg-market-l',
    url: new URL('../../assets/sprites/bg-market-l.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-market-1',
    url: new URL('../../assets/sprites/prop-market-1.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-market-2',
    url: new URL('../../assets/sprites/prop-market-2.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-market-3',
    url: new URL('../../assets/sprites/prop-market-3.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'prop-market-4',
    url: new URL('../../assets/sprites/prop-market-4.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-bullrun',
    url: new URL('../../assets/sprites/minion-bullrun.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'minion-bearmarket',
    url: new URL('../../assets/sprites/minion-bearmarket.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'boss-liudong',
    url: new URL('../../assets/sprites/boss-liudong.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'boss-liudong-thinking',
    url: new URL('../../assets/sprites/boss-liudong-thinking.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'boss-liudong-enraged',
    url: new URL('../../assets/sprites/boss-liudong-enraged.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'boss-liudong-doom',
    url: new URL('../../assets/sprites/boss-liudong-doom.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-down-arrow',
    url: new URL('../../assets/sprites/fx-market-down-arrow.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-arrow-big',
    url: new URL('../../assets/sprites/fx-market-arrow-big.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-arrow-small',
    url: new URL('../../assets/sprites/fx-market-arrow-small.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-arrow-fake',
    url: new URL('../../assets/sprites/fx-market-arrow-fake.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-coin',
    url: new URL('../../assets/sprites/fx-market-coin.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-candle-green',
    url: new URL('../../assets/sprites/fx-market-candle-green.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-candle-pin',
    url: new URL('../../assets/sprites/fx-market-candle-pin.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-circuitwall',
    url: new URL('../../assets/sprites/fx-market-circuitwall.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-arrowrain-shock',
    url: new URL('../../assets/sprites/fx-market-arrowrain-shock.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-arrowrain-overlay',
    url: new URL('../../assets/sprites/fx-market-arrowrain-overlay.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-deposit-core',
    url: new URL('../../assets/sprites/fx-market-deposit-core.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-deposit-trail',
    url: new URL('../../assets/sprites/fx-market-deposit-trail.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-crashwave-core',
    url: new URL('../../assets/sprites/fx-market-crashwave-core.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-crashwave-shock',
    url: new URL('../../assets/sprites/fx-market-crashwave-shock.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-klinewave-core',
    url: new URL('../../assets/sprites/fx-market-klinewave-core.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-klinewave-shock',
    url: new URL('../../assets/sprites/fx-market-klinewave-shock.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-blackhole-core',
    url: new URL('../../assets/sprites/fx-market-blackhole-core.webp', import.meta.url).href,
    phase: 'boss',
  },
  {
    key: 'fx-market-blackhole-overlay',
    url: new URL('../../assets/sprites/fx-market-blackhole-overlay.webp', import.meta.url).href,
    phase: 'boss',
  },
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
    key: 'fx-common-inhale-core',
    url: new URL('../../assets/sprites/fx-common-inhale-core.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-inhale-shock',
    url: new URL('../../assets/sprites/fx-common-inhale-shock.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-inhale-trail',
    url: new URL('../../assets/sprites/fx-common-inhale-trail.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-inhale-debris',
    url: new URL('../../assets/sprites/fx-common-inhale-debris.webp', import.meta.url).href,
    phase: 'level',
  },
  {
    key: 'fx-common-inhale-overlay',
    url: new URL('../../assets/sprites/fx-common-inhale-overlay.webp', import.meta.url).href,
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
];

// v21-v30 未接關素材（442 條）獨立存放於 assetsV21Part1/2/3，刻意不併入本陣列：
// runtime 對 lazy 條目零消費（entriesForLevel 濾除、無載入執行器），併入只會讓
// 條目字面量常駐主 bundle（實測 +67.88kB）且隨批次單向成長。W2/W3 接關時把
// 認領條目搬回本檔並標正確 phase；assetsV21.test.ts 守門防止整批 spread 回歸。
