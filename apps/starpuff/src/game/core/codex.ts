// 圖鑑與技能介紹資料 SSOT（GAME_DESIGN §36）：內容鏡像 §5/§16/§20/§23/§30 設定表，
// 純資料模組供 CodexScene 呈現與 vitest 驗證；立繪一律取既有 sprite 資產鍵。
import type { EnemyKind } from './types';

export interface CodexMonster {
  kind: EnemyKind | 'boss';
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
    behavior: '受擊縮殼旋轉衝刺，暈眩時吞下得殼盾星',
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
    kind: 'boss',
    textureKey: 'boss-idle',
    nameZh: '果凍王',
    behavior: '果凍雨、震地、衝刺三階段魔王',
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
    detail: '把可吸怪拉進嘴裡吞下，+1 彈藥（上限 3）',
  },
  {
    nameZh: '星彈五系',
    howTo: '有彈藥時點按吸入鍵',
    detail:
      '吞什麼射什麼：果凍丁標準星／飄飄疾風星／氣球魨爆裂星／殼殼殼盾星／雷雷雷鏈星，另有鑽鑽鼴重鑽星與提燈水母流光星',
  },
  {
    nameZh: '強化星',
    howTo: '同種怪連吞兩隻',
    detail: '該槽升級金邊強化星，傷害 1.6 倍',
  },
  {
    nameZh: '混合星彈',
    howTo: '依序吞兩隻不同怪',
    detail: '配方成立即合成混合星（共六式）：疾光／巨爆／追電／雷爆／碎鑽／凝光，威力獨特',
  },
  {
    nameZh: '星暴',
    howTo: '彈匣全滿長按吸入鍵',
    detail: '清場全部小怪並重創魔王，清空彈匣',
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
