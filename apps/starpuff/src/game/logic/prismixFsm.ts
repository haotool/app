import type { BossPhase } from '../core/types';
import { EX_MODS } from './bossFsm';
import { distanceBandOf, pickMove, type WeightedMove } from './moveTable';

// 稜晶雙子 Prismix FSM 純邏輯（GAME_DESIGN §68/§112，不 import phaser），vitest 對象。
// 分裂型三段：P1 單體 → P2 鏡像雙子（獨立血條各半，單份指令左右鏡像執行）→
// P3 裂核合體；掙扎窗內相繼擊破兩具＝雙子連破（跳過 P3，觸發 twin-finish 彩蛋）。
// phase truth 全數收斂於此，禁止散落 scene（沿 bossFsm/noctraFsm 表驅動慣例）。

export const PRISMIX = {
  // 魔王 HP 階梯（主計畫 §3.2）：Jellord 60 → Noctra 52 → Prismix 80。
  maxHp: 80,
  bodyDamage: 1,
  // P1→P2 分裂閾值：總血 ≤66%（EX 提前至 75%）。
  splitHpRatio: 0.66,
  // 殘核掙扎窗：單具擊破後另一具僵直可傷；窗內補殺＝雙子連破。
  struggleMs: 1000,
  // 狂暴節奏：P2/P3 沿 Noctra 根修後的可讀帶。
  enrageSpeedMultiplier: 1.15,
  // 補給節奏（§26 飢荒保證律）：每損 10 HP 掉補給小怪。
  minionSpawnHpStep: 10,
  // P2 召喚 mirri 上限（場上同時存活數，超額由呈現層夾限）。
  summonCap: 2,
  pillarCount: 3,
  radialCount: 8,
  rainCount: 3,
  // P3 環繞碎晶盾（可擊破，EX 6）。
  shardOrbitCount: 4,
  idleMs: 1500,
  pillarDurationMs: 1500,
  beamDurationMs: 1800,
  pincerDurationMs: 1700,
  crossbeamDurationMs: 1600,
  summonDurationMs: 900,
  barrageDurationMs: 1500,
  rainDurationMs: 1500,
  // telegraph 時長（呈現層讀取；不隨速率縮放，沿 Noctra 慣例）。
  // #810：地面尖刺前搖 600→950ms——500ms 反應玩家迴避率 0%→達標（掃參定值，
  // 下限 SSOT＝difficulty.AUDIT_THRESHOLDS.spikeTelegraphMinMs）。
  pillarTelegraphMs: 950,
  beamTelegraphMs: 500,
  // #809：雙生夾擊為衝撞型前搖，對齊 ≥600ms 可讀性紅線（550→600）。
  pincerTelegraphMs: 600,
  rainTelegraphMs: 600,
  // 鏡界反射（§5 #813 W2）：單具開鏡 0.8s（銀白鏡光 telegraph），射它的星彈折返；
  // 開鏡窗固定不隨狂暴速率縮放（可讀性紅線），反制＝窗內打另一具。
  mirrorDurationMs: 800,
  // 鏡像殘影施放拍（§5 W2）：殘影本體規格見 logic/mirrorShadow.ts SSOT。
  shadowCastMs: 900,
} as const;

// Prismix EX 專屬差分（§68/§114）：分裂提前、掙扎窗收短、碎晶盾加密；
// 雙子動作去同步（相位錯半拍）為呈現層差分，HP/節奏沿 EX_MODS 共用係數。
// P4 裂核殘響（#814 T6）：P3 歸零不死，稜晶重構入第二血條（rebirthHpRatio）；
// 新招稜光行牆（sweep）——全高光牆橫掃，跳＋拍翅時機跳越（技巧破關非 RNG）。
export const EX_PRISMIX = {
  splitHpRatio: 0.75,
  struggleMs: 700,
  shardOrbitCount: 6,
  desyncMs: 260,
  // 第二血條：round(maxHp × ratio)＝EX 120 → 60（總有效 HP 180 ≈ 一般 80 ×2.25）。
  rebirthHpRatio: 0.5,
  // 行牆規格（logic SSOT 供 vitest 錨定可跳性：牆高 < maxJumpClearancePx 留裕度）。
  sweepWallHeightPx: 120,
  sweepWallSpeedPx: 180,
  // 行牆蓄能 telegraph：固定不隨狂暴縮放（可讀性紅線 ≥600ms）。
  sweepTelegraphMs: 700,
  sweepDurationMs: 2400,
} as const;

export type PrismixAction =
  | 'idle'
  | 'pillar'
  | 'beam'
  | 'pincer'
  | 'crossbeam'
  | 'summon'
  | 'struggle'
  | 'barrage'
  | 'rain'
  | 'mirror'
  | 'shadow'
  | 'sweep';

export type PrismixSide = 'a' | 'b';

// tick 輸出給呈現層的指令：telegraph 與演出由 systems/prismix.ts 承擔；
// merge 為時間驅動轉換（掙扎窗期滿合體入 P3），隨指令帶出裂核血量與碎晶盾數。
export type PrismixCommand =
  | { kind: 'idle' }
  | { kind: 'pillar'; count: number }
  | { kind: 'beam' }
  | { kind: 'pincer' }
  | { kind: 'crossbeam' }
  | { kind: 'summon'; cap: number }
  | { kind: 'barrage'; count: number }
  | { kind: 'rain'; count: number }
  | { kind: 'merge'; coreHp: number; shards: number }
  | { kind: 'mirror'; side: PrismixSide; durationMs: number }
  | { kind: 'shadow' }
  | { kind: 'sweep'; dir: 1 | -1 };

// takeDamage 輸出的傷害驅動事件：split（P1→P2 分裂）、struggle（單具擊破入掙扎窗）、
// twinFinish（窗內補殺雙子連破，跳過 P3）、reflect（鏡界反射：開鏡側受擊零傷折返）、
// rebirth（§114 EX 限定：裂核歸零稜晶重構入 P4，第二血條）。
export type PrismixHitEvent =
  | { kind: 'damaged'; hp: number }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'split'; hpA: number; hpB: number }
  | { kind: 'struggle'; survivor: PrismixSide; windowMs: number }
  | { kind: 'twinFinish' }
  | { kind: 'minionDrop' }
  | { kind: 'defeated' }
  | { kind: 'reflect'; side: PrismixSide }
  | { kind: 'rebirth'; hp: number };

const SPEED_FACTORS: Record<BossPhase, number> = {
  p1: 1,
  p2: PRISMIX.enrageSpeedMultiplier,
  p3: PRISMIX.enrageSpeedMultiplier,
  // P4 裂核殘響（§114 EX 限定）：終段加壓（疊 EX_MODS 後有效 ≈1.44）。
  p4: 1.25,
};

// 加權選招表（§5 #813 W2）：固定循環改權重＋條件驅動（沿 JELLORD_MOVES 慣例）。
// P1 晶柱／折射光束；P2 雙生夾擊／交錯光束／召喚＋鏡界反射（開鏡）＋鏡像殘影
//（低頻，總血 ≤50% 深段才入池——HP 帶條件欄）；P3 全域折射彈幕／晶雨；
// P4 裂核殘響（§114 EX 限定）：稜光行牆＋高壓彈幕／晶雨。
export function prismixMoveTable(phase: BossPhase): readonly WeightedMove<PrismixAction>[] {
  switch (phase) {
    case 'p1':
      return [
        { action: 'pillar', weight: 3 },
        { action: 'beam', weight: 3 },
      ];
    case 'p2':
      return [
        { action: 'pincer', weight: 3 },
        { action: 'crossbeam', weight: 3 },
        { action: 'summon', weight: 2 },
        { action: 'mirror', weight: 2 },
        { action: 'shadow', weight: 1, condition: { maxHpRatio: 0.5 } },
      ];
    case 'p3':
      return [
        { action: 'barrage', weight: 3 },
        { action: 'rain', weight: 3 },
      ];
    case 'p4':
      return [
        { action: 'sweep', weight: 3 },
        { action: 'barrage', weight: 3 },
        { action: 'rain', weight: 2 },
      ];
    default: {
      const unhandled: never = phase;
      throw new Error(`未知階段：${String(unhandled)}`);
    }
  }
}

export interface PrismixFsm {
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: BossPhase;
  readonly state: PrismixAction;
  readonly speedFactor: number;
  readonly defeated: boolean;
  // P2 雙子獨立血條（§68）：非 P2 回 null；呈現層據此發 BOSS_TWIN_HP。
  readonly twins: { a: number; b: number } | null;
  tick(deltaMs: number): PrismixCommand | null;
  // P2 必須指定受擊側；P1/P3 忽略 side。
  takeDamage(amount: number, side?: PrismixSide): PrismixHitEvent[];
  // 雷化鏈電中斷召喚（§58 慣例）：僅召喚態可中斷，成功回 true。
  interruptSummon(): boolean;
  // 距離帶餵送（§5 條件欄）：呈現層逐幀回報與玩家距離；未餵送視為 far。
  setTargetDistance(distancePx: number | null): void;
}

export interface PrismixFsmOptions {
  ex?: boolean;
  // 加權選招亂數注入（§5：同 seed 可重放；缺省 Math.random）。
  rng?: () => number;
}

export function createPrismixFsm(options: PrismixFsmOptions = {}): PrismixFsm {
  const ex = options.ex === true;
  const rng = options.rng ?? Math.random;
  const maxHp = Math.round(PRISMIX.maxHp * (ex ? EX_MODS.hpMul : 1));
  const splitRatio = ex ? EX_PRISMIX.splitHpRatio : PRISMIX.splitHpRatio;
  const struggleMs = ex ? EX_PRISMIX.struggleMs : PRISMIX.struggleMs;
  const shards = ex ? EX_PRISMIX.shardOrbitCount : PRISMIX.shardOrbitCount;
  // P4 第二血條（§114 EX 限定）：裂核歸零重構的獨立血池。
  const rebirthMax = ex ? Math.round(maxHp * EX_PRISMIX.rebirthHpRatio) : 0;

  let phase: BossPhase = 'p1';
  let state: PrismixAction = 'idle';
  // 近兩次出招（§5 連續同招上限 2）。
  let recentAttacks: PrismixAction[] = [];
  let distancePx: number | null = null;
  // 鏡界反射開鏡側：僅 state === 'mirror' 期間有效。
  let mirrorSide: PrismixSide = 'a';
  let timerMs: number = PRISMIX.idleMs;
  let damageSinceDrop = 0;
  let defeated = false;
  // P1/P3 單血池；P2 期以 hpA/hpB 為真值（hp 僅供合計）。
  let hp: number = maxHp;
  let hpA = 0;
  let hpB = 0;
  let survivor: PrismixSide = 'a';
  // 稜光行牆方向：僅 state === 'sweep' 指令當拍有效（rng 抽側，同 seed 可重放）。
  let sweepDir: 1 | -1 = 1;

  const totalHp = (): number => (phase === 'p2' ? hpA + hpB : hp);
  const speedFactor = (): number => SPEED_FACTORS[phase] * (ex ? EX_MODS.speedMul : 1);

  const durationMs = (action: PrismixAction): number => {
    switch (action) {
      case 'idle':
        return PRISMIX.idleMs / speedFactor();
      case 'pillar':
        return PRISMIX.pillarDurationMs / speedFactor();
      case 'beam':
        return PRISMIX.beamDurationMs / speedFactor();
      case 'pincer':
        return PRISMIX.pincerDurationMs / speedFactor();
      case 'crossbeam':
        return PRISMIX.crossbeamDurationMs / speedFactor();
      case 'summon':
        return PRISMIX.summonDurationMs / speedFactor();
      case 'barrage':
        return PRISMIX.barrageDurationMs / speedFactor();
      case 'rain':
        return PRISMIX.rainDurationMs / speedFactor();
      // 掙扎窗為固定時長（不隨速率縮放：窗長即彩蛋判定窗）。
      case 'struggle':
        return struggleMs;
      // 開鏡窗固定 0.8s（可讀性紅線）：不隨狂暴速率縮放。
      case 'mirror':
        return PRISMIX.mirrorDurationMs;
      case 'shadow':
        return PRISMIX.shadowCastMs / speedFactor();
      // 行牆施放拍固定（牆體行進由呈現層以固定速度承擔，可讀性紅線）。
      case 'sweep':
        return EX_PRISMIX.sweepDurationMs;
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  const commandOf = (action: PrismixAction): PrismixCommand => {
    switch (action) {
      case 'idle':
      case 'struggle':
        return { kind: 'idle' };
      case 'pillar':
        return { kind: 'pillar', count: PRISMIX.pillarCount };
      case 'beam':
        return { kind: 'beam' };
      case 'pincer':
        return { kind: 'pincer' };
      case 'crossbeam':
        return { kind: 'crossbeam' };
      case 'summon':
        return { kind: 'summon', cap: PRISMIX.summonCap };
      case 'barrage':
        return { kind: 'barrage', count: PRISMIX.radialCount };
      case 'rain':
        return { kind: 'rain', count: PRISMIX.rainCount };
      case 'mirror':
        return { kind: 'mirror', side: mirrorSide, durationMs: PRISMIX.mirrorDurationMs };
      case 'shadow':
        return { kind: 'shadow' };
      case 'sweep':
        return { kind: 'sweep', dir: sweepDir };
      default: {
        const unhandled: never = action;
        throw new Error(`未知招式：${String(unhandled)}`);
      }
    }
  };

  // 供彈保證律（§26）：跨階段累計每 10 傷掉補給。
  const accrueDrops = (amount: number, events: PrismixHitEvent[]): void => {
    damageSinceDrop += amount;
    while (damageSinceDrop >= PRISMIX.minionSpawnHpStep) {
      damageSinceDrop -= PRISMIX.minionSpawnHpStep;
      events.push({ kind: 'minionDrop' });
    }
  };

  // 裂核殘響（§114 EX 限定）：歸零不死，稜晶重構入 P4 第二血條；僅可重生一次
  //（phase 已為 p4 即不再觸發）。
  const enterRebirth = (events: PrismixHitEvent[]): void => {
    phase = 'p4';
    hp = rebirthMax;
    hpA = 0;
    hpB = 0;
    state = 'idle';
    recentAttacks = [];
    timerMs = durationMs('idle');
    events.push({ kind: 'phase', phase: 'p4' }, { kind: 'rebirth', hp });
  };

  return {
    get hp() {
      return totalHp();
    },
    get maxHp() {
      // P4 第二血條（§114）：重生後以 rebirth 池為滿刻度（HUD 血條重灌換色）。
      return phase === 'p4' ? rebirthMax : maxHp;
    },
    get phase() {
      return phase;
    },
    get state() {
      return state;
    },
    get speedFactor() {
      return speedFactor();
    },
    get defeated() {
      return defeated;
    },
    get twins() {
      return phase === 'p2' ? { a: hpA, b: hpB } : null;
    },
    tick(deltaMs: number): PrismixCommand | null {
      if (defeated) return null;
      timerMs -= deltaMs;
      if (timerMs > 0) return null;
      // 掙扎窗期滿：存活具吸收殘核合體入 P3（時間驅動轉換，隨指令帶出裂核血量）。
      if (state === 'struggle') {
        phase = 'p3';
        hp = survivor === 'a' ? hpA : hpB;
        hpA = 0;
        hpB = 0;
        state = 'idle';
        recentAttacks = [];
        timerMs = durationMs('idle');
        return { kind: 'merge', coreHp: hp, shards };
      }
      if (state === 'idle') {
        // 加權選招（§5）：權重＋條件（HP 帶/距離帶）＋連續同招上限 2。
        state = pickMove(
          prismixMoveTable(phase),
          { hpRatio: totalHp() / maxHp, distanceBand: distanceBandOf(distancePx) },
          recentAttacks,
          rng,
        );
        recentAttacks = [...recentAttacks.slice(-1), state];
        // 鏡界反射開鏡側：雙具存活時 rng 抽側（同 seed 可重放），單側殘存防呆歸存活具。
        if (state === 'mirror') {
          if (hpA <= 0) mirrorSide = 'b';
          else if (hpB <= 0) mirrorSide = 'a';
          else mirrorSide = rng() < 0.5 ? 'a' : 'b';
        }
        // 稜光行牆起掃側（§114）：rng 抽側，同 seed 可重放。
        if (state === 'sweep') sweepDir = rng() < 0.5 ? 1 : -1;
      } else {
        state = 'idle';
      }
      // 保留溢出時間，維持節奏不漂移（同 bossFsm）。
      timerMs += durationMs(state);
      return commandOf(state);
    },
    takeDamage(amount: number, side: PrismixSide = 'a'): PrismixHitEvent[] {
      if (defeated || amount <= 0) return [];
      const events: PrismixHitEvent[] = [];
      if (phase === 'p2') {
        // 鏡界反射（§5 W2）：開鏡側受擊零傷、折返事件由呈現層生成折返彈；
        // 反制＝窗內打另一具（另一側照常結算）。
        if (state === 'mirror' && side === mirrorSide) {
          return [{ kind: 'reflect', side }];
        }
        // 掙扎窗內僅存活具可傷；平時對已死側傷害忽略（呈現層防呆）。
        const target: PrismixSide = state === 'struggle' ? survivor : side;
        if (target === 'a' && hpA <= 0) return [];
        if (target === 'b' && hpB <= 0) return [];
        if (target === 'a') hpA = Math.max(0, hpA - amount);
        else hpB = Math.max(0, hpB - amount);
        events.push({ kind: 'damaged', hp: totalHp() });
        accrueDrops(amount, events);
        if (state === 'struggle' && (survivor === 'a' ? hpA : hpB) <= 0) {
          // 雙子連破（§68 彩蛋）：掙扎窗內相繼擊破兩具，總血歸零直接擊破跳過 P3。
          // EX（§114）：彩蛋保留但改跳過 P3 直入 P4 裂核殘響（跳段不跳王）。
          if (ex) {
            events.push({ kind: 'twinFinish' });
            enterRebirth(events);
            return events;
          }
          defeated = true;
          events.push({ kind: 'twinFinish' }, { kind: 'defeated' });
          return events;
        }
        if (state !== 'struggle' && (hpA <= 0 || hpB <= 0)) {
          survivor = hpA <= 0 ? 'b' : 'a';
          state = 'struggle';
          timerMs = struggleMs;
          events.push({ kind: 'struggle', survivor, windowMs: struggleMs });
        }
        return events;
      }
      hp = Math.max(0, hp - amount);
      events.push({ kind: 'damaged', hp });
      if (hp <= 0) {
        // EX P3 歸零（§114）：裂核殘響重生一次；P4 再歸零才真擊破。
        if (ex && phase === 'p3') {
          enterRebirth(events);
          return events;
        }
        defeated = true;
        events.push({ kind: 'defeated' });
        return events;
      }
      accrueDrops(amount, events);
      // P1→P2 分裂（§68）：總血跌破閾值即均分為雙獨立血條（餘數歸 A）。
      if (phase === 'p1' && hp <= maxHp * splitRatio) {
        phase = 'p2';
        hpA = Math.ceil(hp / 2);
        hpB = hp - hpA;
        hp = 0;
        state = 'idle';
        recentAttacks = [];
        timerMs = durationMs('idle');
        events.push({ kind: 'phase', phase: 'p2' }, { kind: 'split', hpA, hpB });
      }
      return events;
    },
    interruptSummon(): boolean {
      if (defeated || state !== 'summon') return false;
      state = 'idle';
      timerMs = durationMs('idle');
      return true;
    },
    setTargetDistance(next: number | null): void {
      distancePx = next;
    },
  };
}
