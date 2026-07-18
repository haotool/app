export const ASSETS: { key: string; url: string }[] = [
  { key: 'hero-idle', url: new URL('../../assets/sprites/hero-idle.webp', import.meta.url).href },
  {
    key: 'hero-inhale',
    url: new URL('../../assets/sprites/hero-inhale.webp', import.meta.url).href,
  },
  {
    key: 'hero-puffed',
    url: new URL('../../assets/sprites/hero-puffed.webp', import.meta.url).href,
  },
  { key: 'hero-hurt', url: new URL('../../assets/sprites/hero-hurt.webp', import.meta.url).href },
  {
    key: 'minion-jelly',
    url: new URL('../../assets/sprites/minion-jelly.webp', import.meta.url).href,
  },
  {
    key: 'minion-floaty',
    url: new URL('../../assets/sprites/minion-floaty.webp', import.meta.url).href,
  },
  {
    key: 'minion-spiky',
    url: new URL('../../assets/sprites/minion-spiky.webp', import.meta.url).href,
  },
  { key: 'boss-idle', url: new URL('../../assets/sprites/boss-idle.webp', import.meta.url).href },
  {
    key: 'boss-enraged',
    url: new URL('../../assets/sprites/boss-enraged.webp', import.meta.url).href,
  },
  { key: 'fx-star', url: new URL('../../assets/sprites/fx-star.webp', import.meta.url).href },
  {
    key: 'bg-meadow-l',
    url: new URL('../../assets/sprites/bg-meadow-l.webp', import.meta.url).href,
  },
  {
    key: 'bg-heights-l',
    url: new URL('../../assets/sprites/bg-heights-l.webp', import.meta.url).href,
  },
  {
    key: 'bg-arena-l',
    url: new URL('../../assets/sprites/bg-arena-l.webp', import.meta.url).href,
  },
  {
    key: 'bg-throne-l',
    url: new URL('../../assets/sprites/bg-throne-l.webp', import.meta.url).href,
  },
  { key: 'fx-clouds', url: new URL('../../assets/sprites/fx-clouds.webp', import.meta.url).href },
  {
    key: 'minion-puffy',
    url: new URL('../../assets/sprites/minion-puffy.webp', import.meta.url).href,
  },
  {
    key: 'minion-chompy',
    url: new URL('../../assets/sprites/minion-chompy.webp', import.meta.url).href,
  },
  {
    key: 'minion-shelly',
    url: new URL('../../assets/sprites/minion-shelly.webp', import.meta.url).href,
  },
  {
    key: 'minion-zappy',
    url: new URL('../../assets/sprites/minion-zappy.webp', import.meta.url).href,
  },
  {
    key: 'minion-drilly',
    url: new URL('../../assets/sprites/minion-drilly.webp', import.meta.url).href,
  },
  {
    key: 'minion-glowy',
    url: new URL('../../assets/sprites/minion-glowy.webp', import.meta.url).href,
  },
  // v8 世界擴張（§55）：新怪三種＋第二魔王＋L5/L7 新 biome 橫景。
  {
    key: 'minion-spora',
    url: new URL('../../assets/sprites/minion-spora.webp', import.meta.url).href,
  },
  {
    key: 'minion-gusty',
    url: new URL('../../assets/sprites/minion-gusty.webp', import.meta.url).href,
  },
  {
    key: 'minion-boomy',
    url: new URL('../../assets/sprites/minion-boomy.webp', import.meta.url).href,
  },
  {
    key: 'boss-noctra',
    url: new URL('../../assets/sprites/boss-noctra.webp', import.meta.url).href,
  },
  // v9 星化與挑戰（§61）：hero 三形態＋新怪兩種；背景重用既有（不生成新背景）。
  { key: 'hero-volt', url: new URL('../../assets/sprites/hero-volt.webp', import.meta.url).href },
  { key: 'hero-gale', url: new URL('../../assets/sprites/hero-gale.webp', import.meta.url).href },
  {
    key: 'hero-shell',
    url: new URL('../../assets/sprites/hero-shell.webp', import.meta.url).href,
  },
  {
    key: 'minion-magno',
    url: new URL('../../assets/sprites/minion-magno.webp', import.meta.url).href,
  },
  {
    key: 'minion-mirri',
    url: new URL('../../assets/sprites/minion-mirri.webp', import.meta.url).href,
  },
  {
    key: 'bg-canyon-l',
    url: new URL('../../assets/sprites/bg-canyon-l.webp', import.meta.url).href,
  },
  {
    key: 'bg-eclipse-l',
    url: new URL('../../assets/sprites/bg-eclipse-l.webp', import.meta.url).href,
  },
  // v10 三區完結（§68）：第三魔王稜晶雙子；L10-L12 背景重用既有貼圖（§66/§67）。
  {
    key: 'boss-prismix',
    url: new URL('../../assets/sprites/boss-prismix.webp', import.meta.url).href,
  },
  // v4 主題道具（§31/§32）：道具條 4 等分切割後逐件註冊，佈景資料驅動於 levels.ts decor。
  {
    key: 'prop-meadow-1',
    url: new URL('../../assets/sprites/prop-meadow-1.webp', import.meta.url).href,
  },
  {
    key: 'prop-meadow-2',
    url: new URL('../../assets/sprites/prop-meadow-2.webp', import.meta.url).href,
  },
  {
    key: 'prop-meadow-3',
    url: new URL('../../assets/sprites/prop-meadow-3.webp', import.meta.url).href,
  },
  {
    key: 'prop-meadow-4',
    url: new URL('../../assets/sprites/prop-meadow-4.webp', import.meta.url).href,
  },
  {
    key: 'prop-heights-1',
    url: new URL('../../assets/sprites/prop-heights-1.webp', import.meta.url).href,
  },
  {
    key: 'prop-heights-2',
    url: new URL('../../assets/sprites/prop-heights-2.webp', import.meta.url).href,
  },
  {
    key: 'prop-heights-3',
    url: new URL('../../assets/sprites/prop-heights-3.webp', import.meta.url).href,
  },
  {
    key: 'prop-heights-4',
    url: new URL('../../assets/sprites/prop-heights-4.webp', import.meta.url).href,
  },
  {
    key: 'prop-arena-1',
    url: new URL('../../assets/sprites/prop-arena-1.webp', import.meta.url).href,
  },
  {
    key: 'prop-arena-2',
    url: new URL('../../assets/sprites/prop-arena-2.webp', import.meta.url).href,
  },
  {
    key: 'prop-arena-3',
    url: new URL('../../assets/sprites/prop-arena-3.webp', import.meta.url).href,
  },
  {
    key: 'prop-arena-4',
    url: new URL('../../assets/sprites/prop-arena-4.webp', import.meta.url).href,
  },
  {
    key: 'prop-throne-1',
    url: new URL('../../assets/sprites/prop-throne-1.webp', import.meta.url).href,
  },
  {
    key: 'prop-throne-2',
    url: new URL('../../assets/sprites/prop-throne-2.webp', import.meta.url).href,
  },
  {
    key: 'prop-throne-3',
    url: new URL('../../assets/sprites/prop-throne-3.webp', import.meta.url).href,
  },
  {
    key: 'prop-throne-4',
    url: new URL('../../assets/sprites/prop-throne-4.webp', import.meta.url).href,
  },
];
