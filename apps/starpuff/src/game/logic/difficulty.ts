import { GRAVITY_Y, PLAYER } from '../core/config';
import type { EnemyKind } from '../core/types';
import { BOSS } from './bossFsm';
import type { LevelSpec } from './levels';
import { NOCTRA } from './noctraFsm';
import { PRISMIX } from './prismixFsm';
import { SYRONA } from './syronaFsm';
import { VOIDRA } from './voidraFsm';

// 難度量化 SSOT（#818，主計畫 §3.1 三軸模型＋機制 brief §10 驗收掛鉤總表）。
// 純函式模組（不 import phaser）：vitest 對象；scripts/level-audit.mjs 經
// Node 24 type stripping 直接 import，門檻與公式單點定義禁止在 CLI 複製。

// ===== 驗收門檻（機制 brief §10，PM 親撰 SSOT）=====
export const AUDIT_THRESHOLDS = {
  // #812 星暴誤放：全 20 關卡關恢復 p95 ≤10s。
  starburstRecoveryP95Ms: 10_000,
  // #810/#813 telegraph 反應窗 ≥600ms（視覺反應 ~250ms＋位移時間）。
  telegraphMinMs: 600,
  // #810 地面尖刺專項：前搖 ≥900ms（500ms 反應＋位移裕度），500ms bot 迴避 ≥80%、350ms ≥85%。
  spikeTelegraphMinMs: 900,
  spikeDodgeMinRate500: 0.8,
  spikeDodgeMinRate350: 0.85,
  // #811 殼殼：正確時機吞食成功率 ≥60%；縮殼旋轉（衝刺）期必須 0%。
  swallowStunMinRate: 0.6,
  swallowSpinMaxRate: 0,
  // #814 EX 分級 bot：低階通過率 <20%、高階 ≥60%。
  exLowPassMaxRate: 0.2,
  exHighPassMinRate: 0.6,
  // #816 變身優勢：用/不用變身 TTK 改善 ≥15% 且非必需（§57 anti-softlock 不變式）。
  transformTtkGainMinPct: 0.15,
  // #813 去背板：魔王招式序列條件熵下限（bits），固定循環＝0 不可過門。
  moveEntropyMinBits: 0.5,
} as const;

// ===== 分級 bot（機制 brief §10：低階反應 500ms＋基礎策略、高階 250ms＋完整策略）=====
export interface BotTierSpec {
  // 感知延遲：決策一律讀 reactionMs 前的世界快照（人類反應注入）。
  reactionMs: number;
  // 策略開關：telegraph/FSM 讀招迴避、缺彈覓食、保距風箏走位。
  dodge: boolean;
  forage: boolean;
  kite: boolean;
}

export type BotTier = 'low' | 'mid' | 'high';

export const BOT_TIERS: Record<BotTier, BotTierSpec> = {
  low: { reactionMs: 500, dodge: false, forage: true, kite: false },
  mid: { reactionMs: 350, dodge: true, forage: true, kite: false },
  high: { reactionMs: 250, dodge: true, forage: true, kite: true },
} as const;

// ===== 跳躍運動學（#809 跳越可行性解析基礎）=====
// 等加速度模型：單跳頂點 v²/2g；拍翅將垂直速度重置為 floatLift，可續 maxFlaps 次。
export function jumpApexPx(gravityScale = 1): number {
  return PLAYER.jumpVelocity ** 2 / (2 * GRAVITY_Y * gravityScale);
}

export function flapApexPx(gravityScale = 1): number {
  return PLAYER.floatLift ** 2 / (2 * GRAVITY_Y * gravityScale);
}

// 最大跳躍淨高：地跳＋滿拍翅（每次拍翅於頂點觸發時增益最大）。
export function maxJumpClearancePx(gravityScale = 1): number {
  return jumpApexPx(gravityScale) + PLAYER.maxFlaps * flapApexPx(gravityScale);
}

// ===== 魔王稽核事實表 =====
// 血量/招式面由各 FSM 模組 import（零漂移）；本體幾何為 systems/*.ts 呈現層常數的
// 鏡像快照（phaser 模組不可 import）——CLI 標準量測會以 __sp.bossBodies() 實測座標
// 對照 anchorY 做漂移警報，鏡像失真時報告即曝光。
export type BossId = 'jellord' | 'noctra' | 'prismix' | 'syrona' | 'voidra';

export interface BossAuditFacts {
  boss: BossId;
  levelId: number;
  maxHp: number;
  // 幾何鏡像來源：systems/boss.ts、noctra.ts、prismix.ts、syrona.ts、voidra.ts。
  bodyW: number;
  bodyH: number;
  // 地面型＝站姿錨（GROUND_TOP=400 起算）；懸浮型＝典型懸浮中心 y（null＝全程機動）。
  grounded: boolean;
  hoverY: number | null;
  attackKinds: number;
  minTelegraphMs: number;
  multiBody: boolean;
  // 競技場疊加機制數（潮汐/流星/低重力/雙子分裂/生存段）。
  arenaMechanics: number;
}

const GROUND_TOP = 400;

export const BOSS_AUDIT_FACTS: readonly BossAuditFacts[] = [
  {
    boss: 'jellord',
    levelId: 4,
    maxHp: BOSS.maxHp,
    bodyW: 150,
    bodyH: 130,
    grounded: true,
    hoverY: null,
    // rain／slam／dash（P2 起）＋P3 追蹤雨變體。
    attackKinds: 3,
    // 無獨立 telegraph 常數：idle 間隙即讀招窗。
    minTelegraphMs: BOSS.idleMs,
    multiBody: false,
    arenaMechanics: 0,
  },
  {
    boss: 'noctra',
    levelId: 7,
    maxHp: NOCTRA.maxHp,
    bodyW: 150,
    bodyH: 110,
    grounded: false,
    hoverY: 246,
    // bomb／dive／summon／barrage／sweep／eclipse／cloak。
    attackKinds: 7,
    minTelegraphMs: NOCTRA.idleMs,
    multiBody: false,
    arenaMechanics: 0,
  },
  {
    boss: 'prismix',
    levelId: 12,
    maxHp: PRISMIX.maxHp,
    bodyW: 170,
    bodyH: 150,
    grounded: true,
    hoverY: null,
    // pillar／beam／pincer／rain＋P2 交錯光束。
    attackKinds: 5,
    minTelegraphMs: Math.min(
      PRISMIX.pillarTelegraphMs,
      PRISMIX.beamTelegraphMs,
      PRISMIX.pincerTelegraphMs,
      PRISMIX.rainTelegraphMs,
    ),
    // P2 雙子分裂（multiBody 即此機制，arena 不重複計）。
    multiBody: true,
    arenaMechanics: 0,
  },
  {
    boss: 'syrona',
    levelId: 16,
    maxHp: SYRONA.maxHp,
    bodyW: 170,
    bodyH: 150,
    grounded: true,
    hoverY: null,
    attackKinds: 4,
    minTelegraphMs: Math.min(
      SYRONA.fountainTelegraphMs,
      SYRONA.lobTelegraphMs,
      SYRONA.dripTelegraphMs,
      SYRONA.waveTelegraphMs,
    ),
    multiBody: false,
    // 糖漿潮汐場控。
    arenaMechanics: 1,
  },
  {
    boss: 'voidra',
    levelId: 20,
    maxHp: VOIDRA.maxHp,
    bodyW: 140,
    bodyH: 140,
    grounded: false,
    hoverY: null,
    // pull／ring／claw／barrage／crush。
    attackKinds: 5,
    minTelegraphMs: Math.min(VOIDRA.clawTelegraphMs, VOIDRA.barrageTelegraphMs),
    multiBody: false,
    // 低重力＋P2 生存段。
    arenaMechanics: 2,
  },
] as const;

// ===== 變身優勢情境模板（#816 W2，機制 brief §4/§10）=====
// 每王一個「優勢解但永不必需」情境；bot hook（level-audit --transform）據此以正式
// swallow 管線集齊同系星並按 SP 變身，量測用/不用變身 TTK 差（門檻引 AUDIT_THRESHOLDS）。
// T4 先落 Jellord/Noctra 兩王（§58 既有攻略線資料化）；其餘三王隨 T5 魔王主題化補齊。
export interface TransformAdvantageSpec {
  boss: BossId;
  levelId: number;
  form: 'volt' | 'gale' | 'shell';
  // bot 供給味（必須映射到 form，difficulty.test 以 eligibleForm 守門零漂移）。
  supplyFlavor: 'zappy' | 'floaty' | 'shelly';
  scenarioZh: string;
}

export const TRANSFORM_ADVANTAGE: readonly TransformAdvantageSpec[] = [
  {
    boss: 'jellord',
    levelId: 4,
    form: 'shell',
    supplyFlavor: 'shelly',
    scenarioZh: '殼化反彈線：站定反彈果凍雨回傷（§58 reflect 3 傷/顆）＋受身入殼硬接踩踏',
  },
  {
    boss: 'noctra',
    levelId: 7,
    form: 'volt',
    supplyFlavor: 'zappy',
    scenarioZh: '雷化斷召線：鏈電命中蓄勢中的 Noctra 立即中斷召喚（§58 interruptSummon）',
  },
] as const;

// ===== 跳越可行性矩陣（#809）=====
export interface JumpFeasibilityRow {
  boss: BossId;
  levelId: number;
  grounded: boolean;
  // 跳越所需淨高：地面王＝本體高（玩家底緣需越過本體頂緣）；懸浮王不適用。
  clearanceNeededPx: number | null;
  singleJumpPx: number;
  maxClearancePx: number;
  canJumpOverSingle: boolean;
  canJumpOverWithFlaps: boolean;
  // 懸浮王底緣與地面的間隙（可否直接走過）；玩家高 48（hurtbox 0.8）。
  walkUnderGapPx: number | null;
  canWalkUnder: boolean | null;
}

const PLAYER_HEIGHT_PX = 48;

export function jumpFeasibilityMatrix(gravityScaleByBoss?: Partial<Record<BossId, number>>) {
  return BOSS_AUDIT_FACTS.map((facts): JumpFeasibilityRow => {
    const g = gravityScaleByBoss?.[facts.boss] ?? 1;
    const single = jumpApexPx(g);
    const max = maxJumpClearancePx(g);
    const needed = facts.grounded ? facts.bodyH : null;
    const gap =
      !facts.grounded && facts.hoverY !== null
        ? GROUND_TOP - (facts.hoverY + facts.bodyH / 2)
        : null;
    return {
      boss: facts.boss,
      levelId: facts.levelId,
      grounded: facts.grounded,
      clearanceNeededPx: needed,
      singleJumpPx: Math.round(single),
      maxClearancePx: Math.round(max),
      canJumpOverSingle: needed !== null ? single >= needed : true,
      canJumpOverWithFlaps: needed !== null ? max >= needed : true,
      walkUnderGapPx: gap === null ? null : Math.round(gap),
      canWalkUnder: gap === null ? null : gap >= PLAYER_HEIGHT_PX * 0.8,
    };
  });
}

// ===== 怪物威脅分類（D 軸「不可吸/遠程威脅佔比」）=====
// contact＝恆不可吸接觸威脅；windowed＝僅特定窗可吸；ranged＝具遠程/俯衝攻擊；safe＝其餘。
export const ENEMY_THREAT: Record<EnemyKind, 'safe' | 'windowed' | 'contact' | 'ranged'> = {
  jelly: 'safe',
  floaty: 'safe',
  puffy: 'safe',
  spiky: 'contact',
  chompy: 'contact',
  shelly: 'windowed',
  drilly: 'windowed',
  bubbla: 'windowed',
  twinkla: 'windowed',
  zappy: 'ranged',
  glowy: 'ranged',
  spora: 'ranged',
  gusty: 'ranged',
  boomy: 'ranged',
  magno: 'ranged',
  mirri: 'ranged',
  splatta: 'ranged',
  cometa: 'ranged',
};

const THREAT_WEIGHT = { safe: 0, windowed: 0.4, ranged: 0.7, contact: 1 } as const;

// ===== 錨定校準 =====
// 主計畫 §3.1 各軸錨定值（L1=1.0 等）為人工校準點；raw 分數經錨點分段線性映射為
// 1–10 軸分——錨點行精確重現，其餘關卡由量化公式插值（人工評分退役）。
export type AnchorPoint = readonly [rawValue: number, axisScore: number];

export function calibrate(raw: number, anchors: readonly AnchorPoint[]): number {
  const sorted = [...anchors].sort((a, b) => a[0] - b[0]);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return 1;
  let lo = first;
  let hi = last;
  if (raw > first[0]) {
    for (let i = 1; i < sorted.length; i += 1) {
      const cur = sorted[i];
      const prev = sorted[i - 1];
      if (!cur || !prev) continue;
      if (raw <= cur[0] || i === sorted.length - 1) {
        lo = prev;
        hi = cur;
        break;
      }
    }
  } else {
    hi = sorted[1] ?? last;
  }
  const span = hi[0] - lo[0];
  const t = span === 0 ? 0 : (raw - lo[0]) / span;
  const score = lo[1] + t * (hi[1] - lo[1]);
  return Math.round(Math.min(10, Math.max(1, score)) * 10) / 10;
}

// ===== 首見怪表（M 軸「首見 +1、重見 +0.5」）=====
export function firstSeenKinds(levels: readonly LevelSpec[]): Map<number, Set<EnemyKind>> {
  const seen = new Set<EnemyKind>();
  const map = new Map<number, Set<EnemyKind>>();
  for (const level of levels) {
    const fresh = new Set<EnemyKind>();
    for (const entry of level.enemyMix) {
      if (!seen.has(entry.kind)) {
        seen.add(entry.kind);
        fresh.add(entry.kind);
      }
    }
    map.set(level.id, fresh);
  }
  return map;
}

// ===== 走動關靜態三軸 raw =====
export interface WalkAxisRaw {
  dRaw: number;
  mRaw: number;
  pRaw: number;
}

export function walkAxisRaw(level: LevelSpec, firstSeen: Set<EnemyKind>): WalkAxisRaw {
  // D＝spawn 密度 × 同屏上限 × 威脅佔比 × 精英數（主計畫 §3.1 定義的乘法結構）。
  const spawnPerMin = 60_000 / level.spawnIntervalMs;
  const totalWeight = level.enemyMix.reduce((sum, entry) => sum + entry.weight, 0);
  const threatShare =
    totalWeight === 0
      ? 0
      : level.enemyMix.reduce(
          (sum, entry) => sum + entry.weight * THREAT_WEIGHT[ENEMY_THREAT[entry.kind]],
          0,
        ) / totalWeight;
  const eliteFactor = 1 + 0.2 * level.elites.length;
  const dRaw = spawnPerMin * level.maxOnScreen * (1 + threatShare) * eliteFactor;

  // M＝stage 機制數＋首見怪 +1／重見 +0.5。
  const elementKinds = new Set(level.elements.map((el) => el.kind));
  elementKinds.delete('oneway');
  let stageCount = elementKinds.size;
  if (level.tide) stageCount += 1;
  if (level.meteor) stageCount += 1;
  if ((level.gravityScale ?? 1) < 1) stageCount += 1;
  const behaviorScore = level.enemyMix.reduce(
    (sum, entry) => sum + (firstSeen.has(entry.kind) ? 1 : 0.5),
    0,
  );
  const mRaw = stageCount + behaviorScore;

  // P＝平台精度＋位移技術要求（元素技巧權重）＋環境機制精度負擔。
  const count = (kind: string) => level.elements.filter((el) => el.kind === kind).length;
  const pRaw =
    level.platforms.length * 0.08 +
    count('moving') * 0.7 +
    count('spring') * 0.3 +
    count('updraft') * 0.5 +
    count('warp') * 0.9 +
    (level.tide ? 1.6 : 0) +
    (level.meteor ? 1.2 : 0) +
    ((level.gravityScale ?? 1) < 1 ? 1.0 : 0);
  return { dRaw, mRaw, pRaw };
}

// ===== 魔王關靜態三軸 raw（彈幕壓力／階段機制數／迴避精度）=====
// 權重取向：D 以血池（TTK 壓力）為主、招式面為輔；M 計階段結構與場控疊加；
// P 以最短 telegraph 反應窗為主。錨定校準（L4/L20）吸收單位，5 王總分需嚴格遞增。
export function bossAxisRaw(facts: BossAuditFacts): WalkAxisRaw {
  const dRaw = facts.maxHp * 0.06 + facts.attackKinds * 0.5;
  const mRaw = 3 + facts.attackKinds * 0.4 + facts.arenaMechanics + (facts.multiBody ? 0.5 : 0);
  const pRaw =
    700 / facts.minTelegraphMs +
    facts.attackKinds * 0.3 +
    facts.arenaMechanics * 0.8 +
    (facts.multiBody ? 0.3 : 0);
  return { dRaw, mRaw, pRaw };
}

// ===== 錨點表（主計畫 §3.1 錨定範例＋魔王 v12 回填行）=====
// raw 端由上式對錨定關卡實算而得；此處以函式延遲求值避免手抄漂移。
export interface AxisScores {
  d: number;
  m: number;
  p: number;
  total: number;
}

export function weightedTotal(d: number, m: number, p: number): number {
  return Math.round((0.4 * d + 0.3 * m + 0.3 * p) * 10) / 10;
}

export interface MeasuredModifiers {
  // 每次嘗試死亡數（走動關）或段重試數（魔王關）折入 P 軸的加成，封頂 +1.5。
  deaths?: number;
  segmentRetries?: number;
  fullRetries?: number;
}

export function measuredPDelta(measured: MeasuredModifiers): number {
  const raw =
    (measured.deaths ?? 0) * 0.5 +
    (measured.segmentRetries ?? 0) * 0.3 +
    (measured.fullRetries ?? 0) * 0.5;
  return Math.min(1.5, Math.round(raw * 10) / 10);
}

export interface AnchorTable {
  d: readonly AnchorPoint[];
  m: readonly AnchorPoint[];
  p: readonly AnchorPoint[];
}

// 走動關錨點：D 取 L1=1.0/L3=3.5/L6=5.0/L19=8.6；M 取 L1=1.0/L5=4.0/L19=8.6；
// P 取 L1=1.0/L2=3.0/L18=7.9（主計畫 §3.1 錨定範例）。
export function walkAnchorTable(levels: readonly LevelSpec[]): AnchorTable {
  const firstSeen = firstSeenKinds(levels);
  const rawOf = (id: number): WalkAxisRaw => {
    const level = levels.find((l) => l.id === id);
    if (!level) throw new Error(`錨定關卡不存在：L${id}`);
    return walkAxisRaw(level, firstSeen.get(id) ?? new Set());
  };
  return {
    d: [
      [rawOf(1).dRaw, 1.0],
      [rawOf(3).dRaw, 3.5],
      [rawOf(6).dRaw, 5.0],
      [rawOf(19).dRaw, 8.6],
    ],
    m: [
      [rawOf(1).mRaw, 1.0],
      [rawOf(5).mRaw, 4.0],
      [rawOf(19).mRaw, 8.6],
    ],
    p: [
      [rawOf(1).pRaw, 1.0],
      [rawOf(2).pRaw, 3.0],
      [rawOf(18).pRaw, 7.9],
    ],
  };
}

// 魔王關錨點：L4（D3.5/M3.5/P3.8）與 L20（彈幕8.8/階段9.4/迴避9.6）——
// 主計畫 §3.1.1 與 v12 完結回填行。
export function bossAnchorTable(): AnchorTable {
  const jellord = BOSS_AUDIT_FACTS.find((f) => f.boss === 'jellord');
  const voidra = BOSS_AUDIT_FACTS.find((f) => f.boss === 'voidra');
  if (!jellord || !voidra) throw new Error('魔王稽核事實表缺錨定王');
  const lo = bossAxisRaw(jellord);
  const hi = bossAxisRaw(voidra);
  return {
    d: [
      [lo.dRaw, 3.5],
      [hi.dRaw, 8.8],
    ],
    m: [
      [lo.mRaw, 3.5],
      [hi.mRaw, 9.4],
    ],
    p: [
      [lo.pRaw, 3.8],
      [hi.pRaw, 9.6],
    ],
  };
}

// ===== 三軸總計算入口 =====
export function computeLevelAxes(
  level: LevelSpec,
  levels: readonly LevelSpec[],
  measured: MeasuredModifiers = {},
): AxisScores & { pStatic: number; kind: 'walk' | 'boss' } {
  let d: number;
  let m: number;
  let pStatic: number;
  if (level.boss) {
    const facts = BOSS_AUDIT_FACTS.find((f) => f.boss === level.boss);
    if (!facts) throw new Error(`未定義魔王稽核事實：${level.boss}`);
    const raw = bossAxisRaw(facts);
    const anchors = bossAnchorTable();
    d = calibrate(raw.dRaw, anchors.d);
    m = calibrate(raw.mRaw, anchors.m);
    pStatic = calibrate(raw.pRaw, anchors.p);
  } else {
    const firstSeen = firstSeenKinds(levels);
    const raw = walkAxisRaw(level, firstSeen.get(level.id) ?? new Set());
    const anchors = walkAnchorTable(levels);
    d = calibrate(raw.dRaw, anchors.d);
    m = calibrate(raw.mRaw, anchors.m);
    pStatic = calibrate(raw.pRaw, anchors.p);
  }
  const p = Math.round(Math.min(10, pStatic + measuredPDelta(measured)) * 10) / 10;
  return {
    d,
    m,
    p,
    pStatic,
    total: weightedTotal(d, m, p),
    kind: level.boss ? 'boss' : 'walk',
  };
}

// ===== 量測統計輔助 =====
export function percentile(values: readonly number[], ratio: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(ratio * sorted.length) - 1);
  return sorted[Math.max(0, index)] ?? 0;
}

// 招式序列熵（#813 去固定驗收：20 循環重放不可 100% 背板）。
// 條件熵 H(next|prev)：轉移完全確定（固定循環可背板）＝0 bits，越高越不可背板。
export function sequenceEntropyBits(states: readonly string[]): number {
  if (states.length < 2) return 0;
  const nextCounts = new Map<string, Map<string, number>>();
  for (let i = 1; i < states.length; i += 1) {
    const prev = states[i - 1] ?? '';
    const next = states[i] ?? '';
    const bucket = nextCounts.get(prev) ?? new Map<string, number>();
    bucket.set(next, (bucket.get(next) ?? 0) + 1);
    nextCounts.set(prev, bucket);
  }
  const total = states.length - 1;
  let entropy = 0;
  for (const bucket of nextCounts.values()) {
    const bucketTotal = [...bucket.values()].reduce((sum, count) => sum + count, 0);
    let inner = 0;
    for (const count of bucket.values()) {
      const prob = count / bucketTotal;
      inner -= prob * Math.log2(prob);
    }
    entropy += (bucketTotal / total) * inner;
  }
  return Math.round(entropy * 100) / 100;
}
