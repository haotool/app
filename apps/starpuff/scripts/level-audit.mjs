// 難度量化統一 CLI（#818）：單指令輸出任一關（走動/魔王/EX）難度報告——
// TTK、死亡率、死亡熱點、彈藥斷檔、卡關風險、三軸分（logic/difficulty.ts SSOT）。
// 分級 bot（低/中/高）與四專項探針（#809 jump/#810 telegraph/#811 swallow/#812 starburst）。
//
// 用法：node scripts/level-audit.mjs <levelId> [--ex] [--bot low|mid|high] [--runs N]
//       [--cap 秒] [--probe jump|telegraph|swallow|starburst] [--all] [--port P] [--label 名]
//       [--transform]（#816：魔王關依 TRANSFORM_ADVANTAGE 集星變身，TTK 用/不用對照）
// 前置：dev server（pnpm dev，埠 SP_DEV_PORT）；輸出至 .claude/product-intel/level-audits/。
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadLogic } from './lib/ts-bridge.mjs';
import { installAuditDriver } from './lib/audit-driver.mjs';
import {
  runJumpProbe,
  runStarburstProbe,
  runSwallowProbe,
  runTelegraphProbe,
} from './lib/audit-probes.mjs';
import {
  enterArena,
  gotoLevel,
  openSession,
  readMetrics,
  readScene,
  retryFromResult,
  sleep,
  stopDriver,
} from './lib/audit-session.mjs';

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] !== undefined ? argv[index + 1] : fallback;
};
const levelArg = argv.find((a) => /^\d+$/.test(a));
const runAll = flag('all');
const exMode = flag('ex');
const probeName = opt('probe', null);
const port = opt('port', process.env.SP_DEV_PORT ?? '3021');
const runs = Number(opt('runs', '1'));
const OUT_DIR = new URL('../../../.claude/product-intel/level-audits/', import.meta.url).pathname;

const { difficulty, levels } = await loadLogic();
const { LEVELS } = levels;
const {
  AUDIT_THRESHOLDS,
  BOSS_AUDIT_FACTS,
  BOT_TIERS,
  ENEMY_THREAT,
  TRANSFORM_ADVANTAGE,
  computeLevelAxes,
  jumpFeasibilityMatrix,
  percentile,
  sequenceEntropyBits,
} = difficulty;
const { canInhale } = await import('../src/game/logic/combat.ts');
const { SHELLY_FSM } = await import('../src/game/logic/enemyFsm.ts');

const baseSha = (() => {
  try {
    return execSync('git merge-base HEAD origin/main', { encoding: 'utf8' }).slice(0, 9);
  } catch {
    return 'unknown';
  }
})();

const levelOf = (id) => {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`L${id} 不存在`);
  return level;
};

// 可吸/接觸威脅集自 logic SSOT 推導後注入瀏覽器（禁止腳本內硬編第二份）。
const ALL_KINDS = Object.keys(ENEMY_THREAT);
const INHALABLE_KINDS = ALL_KINDS.filter((kind) => canInhale(kind, false));
const CONTACT_KINDS = ALL_KINDS.filter((kind) => ENEMY_THREAT[kind] === 'contact');

// 滿潮避難導航錨（潮汐關平台中心 x；levels.ts 平台資料推導）。
const floodPlatformXs = (level) => level.platforms.map((p) => p.x);

const fmtSec = (ms) => (ms >= 0 && ms !== null ? Math.round(ms / 100) / 10 : null);

// ===== 標準量測（單關 × N 次）=====
// transformSpec（#816 W2）：非 null 時 bot 依優勢情境集星變身，供 TTK 用/不用對照。
async function runStandardAudit(
  page,
  level,
  { tier, ex, capSec, runCount, errors, transformSpec = null },
) {
  const isBoss = level.boss !== null;
  const tierSpec = BOT_TIERS[tier];
  const runsOut = [];
  for (let run = 0; run < runCount; run += 1) {
    await gotoLevel(page, level.id, ex);
    if (isBoss && !(await enterArena(page))) {
      runsOut.push({ result: 'arena-timeout' });
      continue;
    }
    await page.evaluate(installAuditDriver, {
      kind: isBoss ? 'boss' : 'walk',
      levelId: level.id,
      reactionMs: tierSpec.reactionMs,
      dodge: tierSpec.dodge,
      kite: tierSpec.kite,
      flap: tierSpec.flap === true,
      mirrorGuard: tierSpec.mirrorGuard === true,
      bossForage: tierSpec.bossForage === true,
      maxOnScreen: level.maxOnScreen,
      floodPlatformXs: level.tide ? floodPlatformXs(level) : [],
      inhalableKinds: INHALABLE_KINDS,
      contactKinds: CONTACT_KINDS,
      grantSupply: isBoss,
      transformFlavor: transformSpec?.supplyFlavor ?? null,
    });
    const startedAt = Date.now();
    let result = 'timeout';
    let fullRetries = 0;
    let metrics = null;
    while (Date.now() - startedAt < capSec * 1000) {
      await sleep(1000);
      const scene = await readScene(page);
      const m = await readMetrics(page);
      if (m) metrics = m;
      // 勝利動線：Game → Result →（自動）Map；L20 全破走 Credits。
      if (scene === 'Result' || scene === 'Map' || scene === 'Credits') {
        if (isBoss) {
          // 勝負以回合指標判定（bossKilled＋Result 場景）：持久 save 的 exCleared
          // 首勝後恆為 true，多次執行會污染後續回合的通關率。
          const won = scene !== 'Result' ? true : (metrics?.bossKilled ?? false);
          if (won) {
            result = 'cleared';
            break;
          }
          fullRetries += 1;
          await retryFromResult(page);
          await enterArena(page);
          continue;
        }
        result = 'cleared';
        break;
      }
    }
    await stopDriver(page);
    const m = metrics ?? {};
    const stateSeq = (m.stateLog ?? []).map((entry) => entry.s.split(':')[1] ?? entry.s);
    runsOut.push({
      result,
      elapsedSec: fmtSec(m.elapsedMs ?? 0),
      deaths: m.deaths ?? 0,
      deathSpots: m.deathSpots ?? [],
      damageEvents: (m.damageEvents ?? []).length,
      kills: m.kills ?? 0,
      gateOpenAtSec: m.gateOpenAtMs > 0 ? fmtSec(m.gateOpenAtMs) : null,
      ammoZeroSec: fmtSec(m.ammoZeroMs ?? 0),
      longestAmmoZeroSec: fmtSec(m.longestAmmoZeroMs ?? 0),
      longestStarvingSec: fmtSec(m.longestStarvingMs ?? 0),
      longestFullStallSec: fmtSec(m.longestFullStallMs ?? 0),
      longestQuotaStallSec: fmtSec(m.longestQuotaStallMs ?? 0),
      longestReachVacuumSec: fmtSec(m.longestReachVacuumMs ?? 0),
      bossMaxHp: m.bossMaxHp ?? null,
      ttkSec: isBoss && m.ttkMs > 0 ? fmtSec(m.ttkMs) : null,
      attempts: m.attempts ?? null,
      fullRetries: isBoss ? fullRetries : null,
      moveEntropyBits: isBoss ? sequenceEntropyBits(stateSeq) : null,
      shots: m.shots ?? 0,
      transforms: m.transforms ?? 0,
      samples: m.samples ?? [],
      // 死因取證（W1.5）：受擊事件（精確 t/x/y/hp）×招式轉移序列——供逐 phase
      // 死亡分佈與死因歸類（迴避失敗/輸出不足/機制未解）裁決分析。
      stateLog: isBoss ? (m.stateLog ?? []) : [],
      damageLog: m.damageEvents ?? [],
    });
  }
  const cleared = runsOut.filter((r) => r.result === 'cleared');
  const deaths = runsOut.reduce((sum, r) => sum + (r.deaths ?? 0), 0);
  const segRetries = runsOut.reduce((sum, r) => sum + Math.max(0, (r.attempts ?? 1) - 1), 0);
  const fullRetries = runsOut.reduce((sum, r) => sum + (r.fullRetries ?? 0), 0);
  const axes = computeLevelAxes(level, LEVELS, {
    deaths: runCount > 0 ? deaths / runCount : 0,
    segmentRetries: runCount > 0 ? segRetries / runCount : 0,
    fullRetries: runCount > 0 ? fullRetries / runCount : 0,
  });
  // 卡關風險分級（規則式）：timeout/長飢荒/長停轉＝高；長斷檔或重試多＝中。
  const worstStarve = Math.max(...runsOut.map((r) => r.longestStarvingSec ?? 0), 0);
  const worstStall = Math.max(...runsOut.map((r) => r.longestFullStallSec ?? 0), 0);
  const worstAmmo = Math.max(...runsOut.map((r) => r.longestAmmoZeroSec ?? 0), 0);
  let stallRisk = 'low';
  if (cleared.length === 0 || worstStarve > 10 || worstStall > 8) stallRisk = 'high';
  else if (worstAmmo > 15 || fullRetries >= 2 || deaths / Math.max(1, runCount) >= 3)
    stallRisk = 'mid';
  const ttks = cleared.map((r) => r.ttkSec).filter((v) => typeof v === 'number');
  return {
    levelId: level.id,
    nameZh: level.nameZh,
    kind: exMode || ex ? 'ex' : level.boss ? 'boss' : 'walk',
    boss: level.boss,
    ex,
    bot: tier,
    reactionMs: tierSpec.reactionMs,
    runs: runCount,
    capSec,
    // 變身優勢對照（#816 W2）：門檻 TTK 改善 ≥ transformTtkGainMinPct 由 PM 以
    // 兩份報告（有/無 --transform）對照裁定；此處輸出情境與實際變身次數。
    transform: transformSpec
      ? {
          form: transformSpec.form,
          supplyFlavor: transformSpec.supplyFlavor,
          scenarioZh: transformSpec.scenarioZh,
          ttkGainMinPct: AUDIT_THRESHOLDS.transformTtkGainMinPct,
          transformsPerRun:
            runCount > 0
              ? Math.round(
                  (runsOut.reduce((sum, r) => sum + (r.transforms ?? 0), 0) / runCount) * 100,
                ) / 100
              : null,
        }
      : null,
    clearRate: runCount > 0 ? Math.round((cleared.length / runCount) * 100) / 100 : null,
    ttkSecAvg:
      ttks.length > 0
        ? Math.round((ttks.reduce((a, b) => a + b, 0) / ttks.length) * 10) / 10
        : null,
    clearSecAvg:
      cleared.length > 0
        ? Math.round((cleared.reduce((a, r) => a + (r.elapsedSec ?? 0), 0) / cleared.length) * 10) /
          10
        : null,
    deathsPerRun: runCount > 0 ? Math.round((deaths / runCount) * 100) / 100 : null,
    deathHotspots: runsOut
      .flatMap((r) => r.deathSpots)
      .slice(0, 40)
      .map((s) => ({ x: s.x, y: s.y, tSec: fmtSec(s.t) })),
    stallRisk,
    axes,
    consoleErrors: errors.length,
    runsDetail: runsOut,
  };
}

// ===== 報告輸出 =====
function writeReport(name, json, markdown) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(`${OUT_DIR}${name}.json`, JSON.stringify(json, null, 2));
  if (markdown) writeFileSync(`${OUT_DIR}${name}.md`, markdown);
  console.log(`report → ${OUT_DIR}${name}.json${markdown ? ' / .md' : ''}`);
}

function standardMd(r) {
  const axisLine = `D ${r.axes.d}｜M ${r.axes.m}｜P ${r.axes.p}（靜態 ${r.axes.pStatic}）｜總分 ${r.axes.total}`;
  const hotspots =
    r.deathHotspots.length > 0
      ? r.deathHotspots.map((h) => `(${h.x}, ${h.y}) @${h.tSec}s`).join('、')
      : '無';
  return [
    `# L${r.levelId} ${r.nameZh} 難度報告（${r.kind}）`,
    '',
    `- 基準：base ${baseSha}｜bot ${r.bot}（反應 ${r.reactionMs}ms）｜runs ${r.runs}｜cap ${r.capSec}s`,
    `- 通關率：${r.clearRate === null ? '—' : r.clearRate * 100 + '%'}｜平均通關 ${r.clearSecAvg ?? '—'}s${r.ttkSecAvg !== null ? `｜TTK ${r.ttkSecAvg}s` : ''}`,
    `- 死亡率：${r.deathsPerRun ?? '—'} 死/次｜死亡熱點：${hotspots}`,
    `- 卡關風險：${r.stallRisk}`,
    `- 三軸分：${axisLine}`,
    ...(r.transform
      ? [
          `- 變身優勢：${r.transform.form}（${r.transform.supplyFlavor}）｜每次變身 ${r.transform.transformsPerRun ?? '—'} 回｜${r.transform.scenarioZh}｜門檻 TTK 改善 ≥${Math.round(r.transform.ttkGainMinPct * 100)}%（與無 --transform 報告對照）`,
        ]
      : []),
    '',
    '## 每次執行',
    '',
    '| run | 結果 | 用時 s | 死亡 | 斷檔峰 s | 飢荒峰 s | 停轉峰 s | 配額凍結峰 s | TTK s | 段重試 |',
    '| --- | ---- | ------ | ---- | -------- | -------- | -------- | ------------ | ----- | ------ |',
    ...r.runsDetail.map(
      (run, i) =>
        `| ${i + 1} | ${run.result} | ${run.elapsedSec ?? '—'} | ${run.deaths ?? '—'} | ${run.longestAmmoZeroSec ?? '—'} | ${run.longestStarvingSec ?? '—'} | ${run.longestFullStallSec ?? '—'} | ${run.longestQuotaStallSec ?? '—'} | ${run.ttkSec ?? '—'} | ${run.attempts !== null ? Math.max(0, run.attempts - 1) : '—'} |`,
    ),
    '',
  ].join('\n');
}

// ===== 探針包裝（門檻裁定引 SSOT）=====
async function runProbe(page, name, level, overrides = {}) {
  if (name === 'jump') {
    const matrix = jumpFeasibilityMatrix(
      Object.fromEntries(
        BOSS_AUDIT_FACTS.map((f) => [f.boss, levelOf(f.levelId).gravityScale ?? 1]),
      ),
    );
    const targets = level?.boss ? [level.id] : BOSS_AUDIT_FACTS.map((f) => f.levelId);
    const empirical = [];
    for (const id of targets) {
      console.log(`jump probe → L${id}`);
      empirical.push(await runJumpProbe(page, { levelId: id, trials: Number(opt('trials', '8')) }));
    }
    return {
      probe: 'jump',
      analyticMatrix: matrix,
      empirical,
      verdict: empirical.map((e) => {
        const row = matrix.find((m) => m.levelId === e.levelId);
        const escapable = e.escapeRate === null ? null : e.escapeRate >= 0.75;
        return {
          levelId: e.levelId,
          boss: row?.boss,
          canJumpOverWithFlaps: row?.canJumpOverWithFlaps ?? null,
          corneredEscapeRate: e.escapeRate,
          equivalentEscapeOk: row?.canJumpOverWithFlaps === false ? escapable : true,
        };
      }),
    };
  }
  if (name === 'telegraph') {
    const result = await runTelegraphProbe(page, {
      levelId: level?.id ?? 12,
      cyclesPerTier: Number(opt('cycles', '8')),
    });
    // #810 分級迴避率裁定（門檻引 difficulty.ts SSOT）：500ms ≥80%、350ms ≥85%。
    const dodgeOf = (ms) => (result.byTier ?? []).find((b) => b.reactionMs === ms)?.dodgeRate;
    const meetsDodge = (rate, min) => (typeof rate === 'number' ? rate >= min : null);
    return {
      probe: 'telegraph',
      ...result,
      moveEntropyBits: sequenceEntropyBits(result.stateSeq ?? []),
      thresholdMs: AUDIT_THRESHOLDS.telegraphMinMs,
      meetsThreshold:
        result.telegraphMsAvg !== null
          ? result.telegraphMsAvg >= AUDIT_THRESHOLDS.telegraphMinMs
          : null,
      spikeThresholdMs: AUDIT_THRESHOLDS.spikeTelegraphMinMs,
      meetsSpikeTelegraph:
        result.telegraphMsAvg !== null
          ? result.telegraphMsAvg >= AUDIT_THRESHOLDS.spikeTelegraphMinMs
          : null,
      dodge500Meets: meetsDodge(dodgeOf(500), AUDIT_THRESHOLDS.spikeDodgeMinRate500),
      dodge350Meets: meetsDodge(dodgeOf(350), AUDIT_THRESHOLDS.spikeDodgeMinRate350),
    };
  }
  if (name === 'swallow') {
    const result = await runSwallowProbe(page, {
      runs: overrides.runs ?? Number(opt('runs', '100')),
      spinRuns: overrides.spinRuns ?? Number(opt('spin-runs', '30')),
      // 吸入窗上限跟隨 FSM SSOT：暈眩窗調參不得被儀器舊硬編上限截斷。
      stunWindowMs: SHELLY_FSM.stunMs,
    });
    return {
      probe: 'swallow',
      ...result,
      thresholds: {
        stunMinRate: AUDIT_THRESHOLDS.swallowStunMinRate,
        spinMaxRate: AUDIT_THRESHOLDS.swallowSpinMaxRate,
      },
      stunMeets:
        result.stunSuccessRate !== null
          ? result.stunSuccessRate >= AUDIT_THRESHOLDS.swallowStunMinRate
          : null,
      spinMeets:
        result.spinSuccessRate !== null
          ? result.spinSuccessRate <= AUDIT_THRESHOLDS.swallowSpinMaxRate
          : null,
    };
  }
  if (name === 'starburst') {
    const targets = level ? [level] : LEVELS.filter((l) => l.boss === null);
    const perLevel = [];
    for (const target of targets) {
      console.log(`starburst probe → L${target.id}`);
      const tierSpec = BOT_TIERS[opt('bot', 'mid')] ?? BOT_TIERS.mid;
      const ensureDriver = () =>
        page.evaluate(installAuditDriver, {
          kind: 'walk',
          levelId: target.id,
          reactionMs: tierSpec.reactionMs,
          dodge: tierSpec.dodge,
          kite: tierSpec.kite,
          maxOnScreen: target.maxOnScreen,
          floodPlatformXs: target.tide ? floodPlatformXs(target) : [],
          inhalableKinds: INHALABLE_KINDS,
          contactKinds: CONTACT_KINDS,
          grantSupply: false,
        });
      await gotoLevel(page, target.id, false);
      await ensureDriver();
      const result = await runStarburstProbe(page, {
        levelId: target.id,
        trials: Number(opt('trials', '6')),
        ensureDriver,
      });
      await stopDriver(page);
      perLevel.push({
        ...result,
        p50Ms: percentile(result.recoveryMsSamples, 0.5),
        p95Ms: percentile(result.recoveryMsSamples, 0.95),
      });
    }
    const allSamples = perLevel.flatMap((p) => p.recoveryMsSamples);
    const timeouts = perLevel.reduce((sum, p) => sum + p.timeoutCount, 0);
    return {
      probe: 'starburst',
      perLevel,
      globalP50Ms: percentile(allSamples, 0.5),
      globalP95Ms: percentile(allSamples, 0.95),
      timeouts,
      thresholdMs: AUDIT_THRESHOLDS.starburstRecoveryP95Ms,
      meetsThreshold:
        allSamples.length > 0 && timeouts === 0
          ? percentile(allSamples, 0.95) <= AUDIT_THRESHOLDS.starburstRecoveryP95Ms
          : allSamples.length > 0
            ? false
            : null,
    };
  }
  throw new Error(`未知探針：${name}`);
}

// ===== 全關基線 =====
function baselineMd(rows, probes) {
  const lines = [
    `# StarPuff L1–L20 全關難度基線（base SHA=${baseSha}）`,
    '',
    `- 產生工具：\`scripts/level-audit.mjs --all\`｜走動 bot mid（350ms）／魔王 bot high（250ms）`,
    `- 三軸分由 \`logic/difficulty.ts\` 錨定校準公式自動計算（主計畫 §3.1 錨行精確重現，其餘為工具插值——人工評分退役）`,
    '',
    '## 每關量測總表',
    '',
    '| 關 | 型態 | 通關率 | 通關/TTK s | 死/次 | 斷檔峰 s | 飢荒峰 s | 卡關風險 | D | M | P | 總分 |',
    '| -- | ---- | ------ | ---------- | ----- | -------- | -------- | -------- | - | - | - | ---- |',
    ...rows.map((r) => {
      const worstAmmo = Math.max(...r.runsDetail.map((x) => x.longestAmmoZeroSec ?? 0), 0);
      const worstStarve = Math.max(...r.runsDetail.map((x) => x.longestStarvingSec ?? 0), 0);
      return `| L${r.levelId} | ${r.kind} | ${r.clearRate === null ? '—' : r.clearRate * 100 + '%'} | ${r.ttkSecAvg ?? r.clearSecAvg ?? '—'} | ${r.deathsPerRun ?? '—'} | ${worstAmmo} | ${worstStarve} | ${r.stallRisk} | ${r.axes.d} | ${r.axes.m} | ${r.axes.p} | ${r.axes.total} |`;
    }),
    '',
    '## 死亡熱點（座標，前 8 筆/關）',
    '',
    ...rows
      .filter((r) => r.deathHotspots.length > 0)
      .map(
        (r) =>
          `- L${r.levelId}：${r.deathHotspots
            .slice(0, 8)
            .map((h) => `(${h.x}, ${h.y})`)
            .join('、')}`,
      ),
    '',
  ];
  if (probes.jump) {
    lines.push('## #809 跳越可行性', '');
    lines.push('| 王 | 需淨高 px | 單跳 px | 滿拍翅 px | 可跳越 | 貼牆逃脫率 | 等效逃脫 |');
    lines.push('| -- | --------- | ------- | --------- | ------ | ---------- | -------- |');
    for (const v of probes.jump.verdict) {
      const row = probes.jump.analyticMatrix.find((m) => m.levelId === v.levelId);
      const emp = probes.jump.empirical.find((e) => e.levelId === v.levelId);
      lines.push(
        `| ${v.boss}（L${v.levelId}） | ${row?.clearanceNeededPx ?? '懸浮'} | ${row?.singleJumpPx} | ${row?.maxClearancePx} | ${row?.canJumpOverWithFlaps ? '✓（拍翅）' : '✗'} | ${emp?.escapeRate === null || emp?.escapeRate === undefined ? '未受困' : Math.round(emp.escapeRate * 100) + '%'} | ${v.equivalentEscapeOk === null ? '—' : v.equivalentEscapeOk ? '✓' : '✗'} |`,
      );
    }
    lines.push('');
  }
  if (probes.telegraph) {
    const t = probes.telegraph;
    lines.push(
      '## #810 L12 地面尖刺 telegraph',
      '',
      `- 實測 telegraph（入態→尖刺實體化）：平均 ${t.telegraphMsAvg}ms（min ${t.telegraphMsMin}ms，${t.cycles} 週期）｜門檻 ≥${t.thresholdMs}ms → ${t.meetsThreshold ? '達標' : '未達標'}`,
      `- 尖刺持續：平均 ${t.activeMsAvg}ms｜招式轉移條件熵 ${t.moveEntropyBits} bits`,
      ...t.byTier.map(
        (b) =>
          `- 反應 ${b.reactionMs}ms 注入 bot：迴避率 ${b.dodgeRate === null ? '—' : Math.round(b.dodgeRate * 100) + '%'}（${b.cycles} 週期）`,
      ),
      '',
    );
  }
  if (probes.swallow) {
    const s = probes.swallow;
    lines.push(
      '## #811 殼殼吞食成功率',
      '',
      `- 正確時機（暈眩窗）：${Math.round((s.stunSuccessRate ?? 0) * 100)}%（${s.stunAttempts} 次）｜門檻 ≥${Math.round(AUDIT_THRESHOLDS.swallowStunMinRate * 100)}% → ${s.stunMeets ? '達標' : '未達標'}`,
      `- 衝刺（縮殼旋轉）期：${Math.round((s.spinSuccessRate ?? 0) * 100)}%（${s.spinAttempts} 次）｜門檻 ≤${Math.round(AUDIT_THRESHOLDS.swallowSpinMaxRate * 100)}% → ${s.spinMeets ? '達標' : '未達標'}`,
      `- 暈眩窗實測：平均 ${s.avgWindowMs ?? '—'}ms｜成功吸入耗時：平均 ${s.avgReactToSwallowMs ?? '—'}ms`,
      '',
    );
  }
  if (probes.starburst) {
    const sb = probes.starburst;
    lines.push(
      '## #812 星暴誤放恢復',
      '',
      `- 全走動關恢復：p50 ${fmtSec(sb.globalP50Ms)}s｜p95 ${fmtSec(sb.globalP95Ms)}s｜45s 未恢復 ${sb.timeouts} 次｜門檻 p95 ≤${fmtSec(AUDIT_THRESHOLDS.starburstRecoveryP95Ms)}s → ${sb.meetsThreshold === null ? '—' : sb.meetsThreshold ? '達標' : '未達標'}`,
      '',
      '| 關 | 樣本 | p50 s | p95 s | 未恢復 |',
      '| -- | ---- | ----- | ----- | ------ |',
      ...sb.perLevel.map(
        (p) =>
          `| L${p.levelId} | ${p.recoveredCount} | ${fmtSec(p.p50Ms)} | ${fmtSec(p.p95Ms)} | ${p.timeoutCount} |`,
      ),
      '',
    );
  }
  return lines.join('\n');
}

async function main() {
  console.log(`level-audit｜base ${baseSha}｜port ${port}｜out ${OUT_DIR}`);
  const session = await openSession(port);
  const { page, browser, errors } = session;
  try {
    if (runAll) {
      const rows = [];
      for (const level of LEVELS) {
        const isBoss = level.boss !== null;
        const tier = opt('bot', isBoss ? 'high' : 'mid');
        const capSec = Number(opt('cap', isBoss ? '600' : '300'));
        console.log(`standard audit → L${level.id}（${isBoss ? 'boss' : 'walk'}，bot ${tier}）`);
        rows.push(
          await runStandardAudit(page, level, {
            tier,
            ex: false,
            capSec,
            runCount: runs,
            errors,
          }),
        );
      }
      const probes = {};
      probes.jump = await runProbe(page, 'jump', null);
      probes.telegraph = await runProbe(page, 'telegraph', null);
      probes.swallow = await runProbe(page, 'swallow', null, { runs: 40, spinRuns: 15 });
      probes.starburst = await runProbe(page, 'starburst', null);
      const name = `baseline-${baseSha}`;
      writeReport(name, { baseSha, rows, probes }, baselineMd(rows, probes));
      return;
    }
    if (!levelArg) throw new Error('用法：node scripts/level-audit.mjs <levelId> [flags]｜--all');
    const level = levelOf(Number(levelArg));
    if (probeName) {
      const result = await runProbe(page, probeName, level);
      const label = opt('label', `probe-${probeName}-l${String(level.id).padStart(2, '0')}`);
      writeReport(label, { baseSha, ...result }, null);
      console.log(JSON.stringify({ ...result, detail: undefined, stateSeq: undefined }, null, 2));
      return;
    }
    const isBoss = level.boss !== null;
    if (exMode && !isBoss) throw new Error(`L${level.id} 非魔王關，無 EX 變體`);
    const tier = opt('bot', isBoss ? 'high' : 'mid');
    // 變身優勢對照（#816 W2）：--transform 依 TRANSFORM_ADVANTAGE 查該王情境。
    // W1.5 完整策略：transformUse tier（高階）預設啟用該王變身優勢（未定義王靜默略過）。
    let transformSpec = null;
    if (flag('transform')) {
      if (!isBoss) throw new Error(`L${level.id} 非魔王關，無變身優勢情境`);
      transformSpec = TRANSFORM_ADVANTAGE.find((s) => s.levelId === level.id) ?? null;
      if (!transformSpec) throw new Error(`L${level.id} 尚未定義 TRANSFORM_ADVANTAGE（T5 補齊）`);
    } else if (isBoss && BOT_TIERS[tier]?.transformUse === true) {
      transformSpec = TRANSFORM_ADVANTAGE.find((s) => s.levelId === level.id) ?? null;
    }
    const capSec = Number(opt('cap', exMode ? '900' : isBoss ? '600' : '300'));
    const report = await runStandardAudit(page, level, {
      tier,
      ex: exMode,
      capSec,
      runCount: runs,
      errors,
      transformSpec,
    });
    const label = opt(
      'label',
      `l${String(level.id).padStart(2, '0')}${exMode ? '-ex' : ''}${transformSpec ? '-tf' : ''}-${tier}`,
    );
    writeReport(label, { baseSha, ...report }, standardMd(report));
    const { runsDetail, ...summary } = report;
    void runsDetail;
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await browser.close();
    // console error 檢查置於 finally：--all/--probe 提前 return 也必經，確保非零退出。
    if (errors.length > 0) {
      console.error(`console errors ×${errors.length}：\n${errors.slice(0, 5).join('\n')}`);
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
