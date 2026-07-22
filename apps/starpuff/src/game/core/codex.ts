// 圖鑑與技能介紹資料 SSOT（GAME_DESIGN §36）：內容鏡像 §5/§16/§20/§23/§30 設定表，
// 純資料模組供 CodexScene 呈現與 vitest 驗證；立繪一律取既有 sprite 資產鍵。
import type { MixId, StarFlavor } from './config';
import type { BoundedGridSpec } from './gridLayout';
import type { EnemyKind } from './types';

// 圖鑑分頁有界網格參數 SSOT（§96 P1-01／§104 F-03）：itemH 取各分頁單項最壞
// 內容高（技能＝標題列 26＋詳述 4 行×16；成就＝徽章 58＋描述 2 行；怪物＝
// 立繪 60＋名稱＋標記＋行為 3 行），maxY=470 為邏輯畫布守門線；
// CodexScene 一律引用本表，禁止散落第二份常數。
export const CODEX_TAB_GRIDS = {
  monsters: { startY: 116, rowH: 166, itemH: 150, maxY: 470 },
  skills: { startY: 122, rowH: 100, itemH: 90, maxY: 470 },
  achievements: { startY: 112, rowH: 90, itemH: 84, maxY: 470 },
} as const satisfies Record<string, BoundedGridSpec>;

// 怪物分頁容量（§104 F-03）：每頁 12 格（6×2）——854 最窄殼 cellW 134 仍可讀。
export const MONSTER_PAGE_SIZE = 12;

export interface CodexMonster {
  kind: EnemyKind | 'boss' | 'noctra' | 'prismix' | 'syrona' | 'voidra';
  textureKey: string;
  nameZh: string;
  behavior: string;
  inhalable: boolean;
  // 條件可吸（§30 殼殼）：平時彈開、暈眩窗可吸——badge 顯示「條件可吸」。
  conditional?: boolean;
}

export const CODEX_MONSTERS: readonly CodexMonster[] = [
  {
    kind: 'jelly',
    textureKey: 'minion-jelly',
    nameZh: '果凍丁',
    behavior: '定期彈跳朝玩家，吞下得標準星',
    inhalable: true,
  },
  {
    kind: 'floaty',
    textureKey: 'minion-floaty',
    nameZh: '飄飄',
    behavior: '空中正弦飄移，吞下得疾風星',
    inhalable: true,
  },
  {
    kind: 'spiky',
    textureKey: 'minion-spiky',
    nameZh: '刺刺瓜',
    behavior: '地面滾動衝刺，吸入會被彈開',
    inhalable: false,
  },
  {
    kind: 'puffy',
    textureKey: 'minion-puffy',
    nameZh: '氣球魨',
    behavior: '高空下飄落地爆刺，吞下得爆裂星',
    inhalable: true,
  },
  {
    kind: 'chompy',
    textureKey: 'minion-chompy',
    nameZh: '咬咬花',
    behavior: '定點紮根，近身前搖後咬合',
    inhalable: false,
  },
  {
    kind: 'shelly',
    textureKey: 'minion-shelly',
    nameZh: '殼殼',
    behavior: '受擊縮殼旋轉衝刺，衝刺結束會暈眩——趁暈眩吸入得殼盾星',
    inhalable: false,
    conditional: true,
  },
  {
    kind: 'zappy',
    textureKey: 'minion-zappy',
    nameZh: '雷雷',
    behavior: '懸浮追蹤放電環，吞下得雷鏈星',
    inhalable: true,
  },
  {
    kind: 'drilly',
    textureKey: 'minion-drilly',
    nameZh: '鑽鑽鼴',
    behavior: '潛地僅露鰭追擊，破土窗吞下得重鑽星',
    inhalable: false,
    conditional: true,
  },
  {
    kind: 'glowy',
    textureKey: 'minion-glowy',
    nameZh: '提燈水母',
    behavior: '緩慢漂浮週期光脈衝，吞下得流光星',
    inhalable: true,
  },
  {
    kind: 'spora',
    textureKey: 'minion-spora',
    nameZh: '孢子菇',
    behavior: '定點週期噴孢子雲，吞下得孢子星',
    inhalable: true,
  },
  {
    kind: 'gusty',
    textureKey: 'minion-gusty',
    nameZh: '風飄鳥',
    behavior: '漂移俯衝帶側風，吞下得疾風星',
    inhalable: true,
  },
  {
    kind: 'boomy',
    textureKey: 'minion-boomy',
    nameZh: '迴力殼',
    behavior: '投擲去而復返殼刃，吞下得迴旋星',
    inhalable: true,
  },
  {
    kind: 'magno',
    textureKey: 'minion-magno',
    nameZh: '磁極獸',
    behavior: '週期磁場吸偏星彈，吞下得雷鏈星',
    inhalable: true,
  },
  {
    kind: 'mirri',
    textureKey: 'minion-mirri',
    nameZh: '鏡面蟲',
    behavior: '鏡面態反射星彈，吞下得迴旋星',
    inhalable: true,
  },
  {
    kind: 'bubbla',
    textureKey: 'minion-bubbla',
    nameZh: '焦糖泡',
    behavior: '糖漿潛伏週期躍出，躍出時吞下得爆裂星',
    inhalable: false,
    conditional: true,
  },
  {
    kind: 'splatta',
    textureKey: 'minion-splatta',
    nameZh: '熔糖投手',
    behavior: '舉勺拋糖球留灼斑，吞下得孢子星',
    inhalable: true,
  },
  {
    kind: 'twinkla',
    textureKey: 'minion-twinkla',
    nameZh: '星屑幽靈',
    behavior: '虛化穿身週期現形，實體時吞下得流光星',
    inhalable: false,
    conditional: true,
  },
  {
    kind: 'cometa',
    textureKey: 'minion-cometa',
    nameZh: '彗尾飛魚',
    behavior: '高空鎖定俯衝拖彗尾，吞下得疾風星',
    inhalable: true,
  },
  {
    kind: 'boss',
    textureKey: 'boss-idle',
    nameZh: '果凍王',
    behavior: '果凍雨、震地、衝刺三階段魔王',
    inhalable: false,
  },
  {
    kind: 'noctra',
    textureKey: 'boss-noctra',
    nameZh: '暗月蝠王',
    behavior: '投彈、俯衝、彈幕俯掠空中魔王',
    inhalable: false,
  },
  // v12 圖鑑補完（§84）：三新魔王徽記入鑑。
  {
    kind: 'prismix',
    textureKey: 'boss-prismix',
    nameZh: '稜晶雙子',
    behavior: '晶柱、分裂雙子、裂核彈幕分裂型魔王',
    inhalable: false,
  },
  {
    kind: 'syrona',
    textureKey: 'boss-syrona',
    nameZh: '熔糖窯后',
    behavior: '噴泉、潮汐、糖漿波場控型魔王',
    inhalable: false,
  },
  {
    kind: 'voidra',
    textureKey: 'boss-voidra',
    nameZh: '蝕星魔核',
    behavior: '牽引、轟炸生存段、低重力終局最終魔王',
    inhalable: false,
  },
] as const;

export interface CodexSkill {
  nameZh: string;
  howTo: string;
  detail: string;
}

export const CODEX_SKILLS: readonly CodexSkill[] = [
  {
    nameZh: '吸入',
    howTo: '長按吸入鍵',
    detail: '把可吸怪拉進嘴裡吞下，+1 彈藥（上限 5）',
  },
  {
    nameZh: '星彈九系',
    howTo: '有彈藥時點按吸入鍵',
    detail:
      '吞什麼射什麼：果凍丁標準星／飄飄與風飄鳥疾風星／氣球魨爆裂星／殼殼殼盾星／雷雷雷鏈星／鑽鑽鼴重鑽星／提燈水母流光星／孢子菇孢子星／迴力殼迴旋星',
  },
  {
    nameZh: '強化星',
    howTo: '同種怪連吞兩隻',
    detail: '該槽升級金邊強化星，傷害 1.6 倍',
  },
  {
    nameZh: '混合星彈',
    howTo: '依序吞兩隻不同怪',
    detail:
      '配方成立即合成混合星（共九式）：疾光／巨爆／追電／雷爆／碎鑽／凝光／毒爆雲／電鋸迴旋／迴風刃',
  },
  {
    nameZh: '星暴',
    howTo: '滿匣結晶後按 SP 引爆',
    detail: '彈匣集滿 5 槽自動結晶成頭頂蓄能星（可繼續吸怪、跨關持有），引爆清場全小怪並重創魔王',
  },
  {
    nameZh: '星化變身',
    howTo: '同系 3 發地面按 SP',
    detail: '雷化／風化／殼化 10 秒，消耗全部彈匣；變身中再按 SP 提前解除',
  },
  {
    nameZh: '下衝擊',
    howTo: '空中搖桿下＋跳躍鍵',
    detail: '加速下墜，落地衝擊波擊退小怪、可破磚；腹中含怪也可觸發',
  },
  {
    nameZh: '殼盾',
    howTo: '頂槽殼盾星時長按吸入鍵',
    detail: '舉正面護盾格擋一次攻擊，成功格擋觸發反擊星爆（冷卻 4 秒、消耗該槽）',
  },
  {
    nameZh: '雷鏈',
    howTo: '吞雷雷後點按發射',
    detail: '雷鏈星命中後跳電至最近兩隻小怪，各受 3 點電擊',
  },
  {
    nameZh: '漂浮',
    howTo: '空中連按跳躍鍵',
    detail: '拍翅最多三次延長滯空，落地重置',
  },
] as const;

// 星味首遇提示（§46/§47/§53）：GameScene 於本 session 首次取得該味/配方時 toast 一行文案。
export const FLAVOR_HINTS: Record<StarFlavor, string> = {
  jelly: '標準星：直線速射',
  floaty: '疾風星：高速直射穿透兩敵',
  puffy: '爆裂星：命中小範圍爆炸',
  shelly: '殼盾星：長按舉盾格擋反擊',
  zappy: '雷鏈星：命中跳電最近兩敵',
  drilly: '重鑽星：低速重擊穿透',
  glowy: '流光星：命中光域波及周圍',
  spora: '孢子星：命中緩速並持續掉血',
  boomy: '迴旋星：去而復返雙程判定',
};

export const MIX_HINTS: Record<MixId, string> = {
  swiftlight: '疾光星合成！三重穿透高速直射',
  bigblast: '巨爆星合成！大範圍爆炸',
  voltseeker: '追電星合成！追蹤最近敵再跳電',
  thunderburst: '雷爆星合成！爆炸加三連鎖電',
  shardrill: '碎鑽星合成！三發扇形重擊',
  gleamfield: '凝光星合成！命中凍結光域',
  sporeblast: '毒爆雲合成！爆炸加緩速毒域',
  voltsaw: '電鋸迴旋合成！雙程迴旋沿路鏈電',
  galewheel: '迴風刃合成！高速長弧雙程穿透',
};
