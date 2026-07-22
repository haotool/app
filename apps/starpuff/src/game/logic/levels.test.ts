import { describe, expect, it } from 'vitest';
import { createDefaultSave, recordExClear } from '../core/save';
import { canInhale } from './combat';
import {
  BOSS_LEVEL_IDS,
  LEVELS,
  RESCUE_AHEAD_MAX_PX,
  RESCUE_AHEAD_MIN_PX,
  RESCUE_REPOSITION_MS,
  STARVATION_RESCUE_MS,
  advanceLevelSpawn,
  carryKillsOnDeath,
  checkpointRespawnX,
  createLevelRun,
  exConquestDone,
  getLevel,
  isInSafeTail,
  nextLevelId,
  pickEnemyKind,
  pickRescueKind,
  pickSpawnKind,
  rescueSpawnX,
  type LevelRunState,
  type LevelSpec,
  type StageElementSpec,
  recordKill,
} from './levels';
import { WARP } from './warp';
import { BRICK_SIZE, maxDecorInWindow } from './stageModel';

describe('LEVELS 資料（GAME_DESIGN §15/§50/§60/§66/§67/§68/§72/§84）', () => {
  it('二十關依序為 1-20 且參數符合 §15/§21/§50/§60/§66-§68/§72/§74/§84 表', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);
    expect(LEVELS.map((l) => l.worldWidth)).toEqual([
      2700, 3100, 3500, 854, 3300, 3600, 854, 3400, 3700, 3400, 3700, 854, 3300, 3600, 3800, 854,
      3400, 3700, 4000, 854,
    ]);
    expect(LEVELS.map((l) => l.killQuota)).toEqual([
      6, 9, 10, 0, 10, 12, 0, 11, 12, 12, 13, 0, 11, 12, 14, 0, 11, 13, 15, 0,
    ]);
    expect(LEVELS.map((l) => l.spawnIntervalMs)).toEqual([
      2600, 1800, 1300, 3500, 1500, 1200, 4500, 1400, 1150, 1150, 1100, 3000, 1400, 1250, 1100,
      3000, 1350, 1200, 1000, 2800,
    ]);
    expect(LEVELS.map((l) => l.maxOnScreen)).toEqual([
      3, 4, 5, 2, 5, 5, 1, 5, 5, 5, 5, 2, 5, 5, 5, 2, 5, 5, 6, 2,
    ]);
    expect(LEVELS.map((l) => l.safeZoneTailPx)).toEqual([
      480, 480, 480, 0, 480, 480, 0, 480, 480, 480, 480, 0, 480, 480, 480, 0, 480, 480, 480, 0,
    ]);
  });

  it('星核制霸判定（§86）：BOSS_LEVEL_IDS 由 LEVELS 派生；5 王 exCleared 全 true 才成立', () => {
    expect(BOSS_LEVEL_IDS).toEqual([4, 7, 12, 16, 20]);
    let save = createDefaultSave();
    expect(exConquestDone(save)).toBe(false);
    for (const id of [4, 7, 12, 16] as const) save = recordExClear(save, id);
    // 差一王不成立。
    expect(exConquestDone(save)).toBe(false);
    save = recordExClear(save, 20);
    expect(exConquestDone(save)).toBe(true);
  });

  it('五魔王品種標記（§54/§68/§74/§82）：L4/L7/L12/L16/L20；教學與提示對表', () => {
    expect(LEVELS.map((l) => l.boss)).toEqual([
      null,
      null,
      null,
      'jellord',
      null,
      null,
      'noctra',
      null,
      null,
      null,
      null,
      'prismix',
      null,
      null,
      null,
      'syrona',
      null,
      null,
      null,
      'voidra',
    ]);
    expect(LEVELS.map((l) => l.tutorial)).toEqual([
      true,
      ...Array.from({ length: LEVELS.length - 1 }, () => false),
    ]);
    expect(getLevel(8).hint).toContain('星化');
    expect(getLevel(10).hint).toContain('折躍');
    expect(getLevel(13).hint).toContain('熱泉');
    expect(getLevel(14).hint).toContain('潮');
    expect(getLevel(17).hint).toContain('低重力');
    expect(getLevel(18).hint).toContain('流星');
    expect(getLevel(19).hint).toContain('終試');
  });

  it('L16 魔王關體系（§69 沿用）：前室 400px、護盾/疾風二選一、P2 星力果、幾何留空', () => {
    const level = getLevel(16);
    expect(level.anteroomPx).toBe(400);
    expect(level.anteroomBuffs).toEqual(['shield', 'swift']);
    expect(level.arenaBuff).toBe('power');
    // 浮台/噴口由呈現層依動態視寬佈建（§28 禁硬編），資料表留空。
    expect(level.platforms).toEqual([]);
    expect(level.elements).toEqual([]);
    expect(level.elites).toEqual([]);
  });

  it('L20 魔王關體系（§82）：前室星力/疾風二選一、P3 護盾泡（生存段不投放）、幾何留空', () => {
    const level = getLevel(20);
    expect(level.anteroomPx).toBe(400);
    expect(level.anteroomBuffs).toEqual(['power', 'swift']);
    expect(level.arenaBuff).toBe('shield');
    // Voidra P2 為生存段（§82 唯一輸出窗設計）：arena 增益延至 P3 投放。
    expect(level.arenaBuffPhase).toBe('p3');
    expect(level.platforms).toEqual([]);
    expect(level.elements).toEqual([]);
    expect(level.elites).toEqual([]);
    // 其餘魔王關維持缺省 P2 投放。
    for (const id of [12, 16] as const) {
      expect(getLevel(id).arenaBuffPhase).toBeUndefined();
    }
  });

  it('低重力係數（§81/§10.2-6）：僅 L17/L18/L19 配置且值域 [0.5, 1.0]', () => {
    for (const level of LEVELS) {
      if (level.id === 17 || level.id === 18) {
        expect(level.gravityScale).toBe(0.55);
      } else if (level.id === 19) {
        expect(level.gravityScale).toBe(0.85);
      } else {
        expect(level.gravityScale).toBeUndefined();
      }
      if (level.gravityScale !== undefined) {
        expect(level.gravityScale).toBeGreaterThanOrEqual(0.5);
        expect(level.gravityScale).toBeLessThanOrEqual(1.0);
      }
    }
  });

  it('流星雨配置（§79/§10.2-7）：僅 L18/L19；波間隔 ≥3s、單波 ≤ 同屏上限 3', () => {
    for (const level of LEVELS) {
      if (level.id !== 18 && level.id !== 19) {
        expect(level.meteor).toBeUndefined();
        continue;
      }
      const meteor = level.meteor;
      expect(meteor).toBeDefined();
      if (!meteor) continue;
      expect(meteor.intervalMs).toBeGreaterThanOrEqual(3000);
      expect(meteor.waveSize).toBeGreaterThanOrEqual(1);
      expect(meteor.waveSize).toBeLessThanOrEqual(3);
    }
  });

  it('L4/L7 前室 retrofit（§86／主計畫 §7.1）：全五魔王關前室體系一致', () => {
    for (const id of BOSS_LEVEL_IDS) {
      const level = getLevel(id);
      expect(level.anteroomPx, `L${id} 前室寬`).toBe(400);
      expect(level.anteroomBuffs?.length, `L${id} 二選一台座`).toBe(2);
      expect(level.arenaBuff, `L${id} arena 投放`).toBeDefined();
    }
    expect(getLevel(4).anteroomBuffs).toEqual(['shield', 'power']);
    expect(getLevel(4).arenaBuff).toBe('swift');
    expect(getLevel(7).anteroomBuffs).toEqual(['shield', 'swift']);
    expect(getLevel(7).arenaBuff).toBe('power');
  });

  it('L12 魔王關體系（§69）：前室 400px、護盾/星力二選一、P2 疾風靴、補生全可吸', () => {
    const level = getLevel(12);
    expect(level.anteroomPx).toBe(400);
    expect(level.anteroomBuffs).toEqual(['shield', 'power']);
    expect(level.arenaBuff).toBe('swift');
    expect(level.elements).toEqual([]);
    expect(level.elites).toEqual([]);
    // 前室僅魔王關可設；走動關禁配置。
    for (const other of LEVELS) {
      if (!other.boss) {
        expect(other.anteroomPx).toBeUndefined();
        expect(other.anteroomBuffs).toBeUndefined();
        expect(other.arenaBuff).toBeUndefined();
      }
    }
  });

  it('每關 enemyMix 權重總和為 1', () => {
    for (const level of LEVELS) {
      const total = level.enemyMix.reduce((sum, entry) => sum + entry.weight, 0);
      expect(total).toBeCloseTo(1, 5);
    }
  });

  it('L2 權重重配（§30/§47）：shelly 15% + glowy 10% 入編，可吸佔比 ≥50%', () => {
    const mix = Object.fromEntries(getLevel(2).enemyMix.map((e) => [e.kind, e.weight]));
    expect(mix).toEqual({ floaty: 0.3, spiky: 0.25, puffy: 0.2, shelly: 0.15, glowy: 0.1 });
    const inhalable = getLevel(2)
      .enemyMix.filter((e) => canInhale(e.kind))
      .reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L3 八種混編（§47 drilly/glowy 入編）且可吸怪佔比 ≥50%（drilly 保守不計）', () => {
    const mix = getLevel(3).enemyMix;
    expect(mix.map((e) => e.kind).sort()).toEqual(
      ['chompy', 'drilly', 'floaty', 'glowy', 'jelly', 'puffy', 'spiky', 'zappy'].sort(),
    );
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('中魔王精英（§48/§52）：走動關皆配置、boss 關無；房址落於安全帶且獎勵為稀有味', () => {
    for (const level of LEVELS) {
      if (level.boss) {
        expect(level.elites).toEqual([]);
        continue;
      }
      expect(level.elites.length).toBeGreaterThanOrEqual(1);
      for (const elite of level.elites) {
        // 多房關（L6 雙精英）放寬至 25%-75% 帶；房界不得越出世界。
        expect(elite.x).toBeGreaterThan(level.worldWidth * 0.25);
        expect(elite.x).toBeLessThan(level.worldWidth * 0.75);
        expect(elite.x + 300).toBeLessThan(level.worldWidth - level.safeZoneTailPx);
        expect(elite.hp).toBeGreaterThanOrEqual(10);
        expect(elite.speedMul).toBeGreaterThan(1);
        // 稀有味必為可吸屬性怪（glowy/spora/boomy/zappy 恆可吸、drilly 破土窗可吸）。
        expect(['drilly', 'glowy', 'spora', 'boomy', 'zappy']).toContain(elite.rewardFlavor);
      }
      // 雙精英房不重疊（§52）：房心距 ≥ 2×門距（600px）；
      // L19 雙生鏡衛（§84）為 20 關唯一同房雙精英變式——同房近距（≤100px）豁免。
      for (let i = 1; i < level.elites.length; i += 1) {
        const prev = level.elites[i - 1];
        const curr = level.elites[i];
        const gap = (curr?.x ?? 0) - (prev?.x ?? 0);
        if (level.id === 19) {
          expect(gap).toBeGreaterThan(0);
          expect(gap).toBeLessThanOrEqual(100);
        } else {
          expect(gap).toBeGreaterThanOrEqual(600);
        }
      }
    }
    // 雙生鏡衛限定 L19 且恰為 mirri ×2（掉 glowy＋zappy 補配方）。
    const twins = getLevel(19).elites;
    expect(twins.map((e) => e.kind)).toEqual(['mirri', 'mirri']);
    expect(twins.map((e) => e.rewardFlavor).sort()).toEqual(['glowy', 'zappy']);
  });

  it('boss 關補生全為可吸或條件可吸（L4/L7/L12/L16/L20）；恆可吸佔比 ≥0.6 保飢荒保證律', () => {
    for (const id of [4, 7, 12, 16, 20] as const) {
      const mix = getLevel(id).enemyMix;
      expect(mix.every((entry) => canInhale(entry.kind, true))).toBe(true);
      const always = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
      expect(always).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('L17 星屑浮橋（§84）：twinkla 主場、恆可吸佔比 ≥50%（twinkla 保守不計）', () => {
    const mix = getLevel(17).enemyMix;
    expect(mix.find((e) => e.kind === 'twinkla')?.weight).toBeGreaterThanOrEqual(0.25);
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L18 流星原野（§84）：cometa 主場、雙新怪同場、恆可吸佔比 ≥50%', () => {
    const mix = getLevel(18).enemyMix;
    expect(mix.find((e) => e.kind === 'cometa')?.weight).toBeGreaterThanOrEqual(0.2);
    expect(mix.some((e) => e.kind === 'twinkla')).toBe(true);
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L19 星核前庭（§84）：十種混編全機制回收、唯一六同屏、恆可吸佔比 ≥50%', () => {
    const level = getLevel(19);
    expect(level.enemyMix).toHaveLength(10);
    expect(level.maxOnScreen).toBe(6);
    for (const other of LEVELS) {
      if (other.id !== 19) expect(other.maxOnScreen).toBeLessThanOrEqual(5);
    }
    const inhalable = level.enemyMix
      .filter((e) => canInhale(e.kind))
      .reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L8 磁極洞窟（§60）：magno 主場、drilly 地下突襲組合、可吸佔比 ≥50%', () => {
    const mix = getLevel(8).enemyMix;
    expect(mix.find((e) => e.kind === 'magno')?.weight).toBeGreaterThanOrEqual(0.2);
    expect(mix.some((e) => e.kind === 'drilly')).toBe(true);
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L9 鏡影迴廊（§60）：mirri 主場、雙新怪同場、雙精英房距 ≥600、可吸佔比 ≥50%', () => {
    const level = getLevel(9);
    expect(level.enemyMix.find((e) => e.kind === 'mirri')?.weight).toBeGreaterThanOrEqual(0.2);
    expect(level.enemyMix.some((e) => e.kind === 'magno')).toBe(true);
    expect(level.elites).toHaveLength(2);
    expect(level.elites.map((e) => e.kind)).toEqual(['mirri', 'magno']);
    const inhalable = level.enemyMix
      .filter((e) => canInhale(e.kind))
      .reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L5 氣流關（§51/§52）：gusty 主場、含 spora、可吸佔比 ≥50%', () => {
    const mix = getLevel(5).enemyMix;
    expect(mix.find((e) => e.kind === 'gusty')?.weight).toBeGreaterThanOrEqual(0.25);
    expect(mix.some((e) => e.kind === 'spora')).toBe(true);
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L6 全怪種高密度混編（§52）：十二種全數入編、可吸佔比 ≥50%', () => {
    const mix = getLevel(6).enemyMix;
    expect(mix.map((e) => e.kind).sort()).toEqual(
      [
        'boomy',
        'chompy',
        'drilly',
        'floaty',
        'glowy',
        'gusty',
        'jelly',
        'puffy',
        'shelly',
        'spiky',
        'spora',
        'zappy',
      ].sort(),
    );
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L10 幽光晶湖（§66）：mirri/glowy 雙主場、含 zappy 湊電鋸配方、可吸佔比 ≥50%', () => {
    const mix = getLevel(10).enemyMix;
    expect(mix.find((e) => e.kind === 'mirri')?.weight).toBeGreaterThanOrEqual(0.2);
    expect(mix.find((e) => e.kind === 'glowy')?.weight).toBeGreaterThanOrEqual(0.2);
    expect(mix.some((e) => e.kind === 'zappy')).toBe(true);
    const inhalable = mix.filter((e) => canInhale(e.kind)).reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  it('L11 磁晶險徑（§67）：磁×躍複合混編、雙精英房距 ≥600、可吸佔比 ≥50%', () => {
    const level = getLevel(11);
    for (const kind of ['magno', 'mirri', 'drilly', 'boomy', 'spora'] as const) {
      expect(level.enemyMix.some((e) => e.kind === kind)).toBe(true);
    }
    expect(level.elites).toHaveLength(2);
    expect(level.elites.map((e) => e.kind)).toEqual(['magno', 'drilly']);
    const inhalable = level.enemyMix
      .filter((e) => canInhale(e.kind))
      .reduce((sum, e) => sum + e.weight, 0);
    expect(inhalable).toBeGreaterThanOrEqual(0.5);
  });

  // 高台（y < 272）必須被氣流柱涵蓋（anti-softlock §56）：柱域水平涵蓋且柱頂高於平台。
  const updraftServed = (level: LevelSpec, platform: { x: number; y: number; w: number }) =>
    level.elements.some(
      (element) =>
        element.kind === 'updraft' &&
        Math.abs(element.x - platform.x) <= (element.w + platform.w) / 2 &&
        element.topY < platform.y,
    );

  // v10 折躍高台（§66）：星門出口位於平台水平投影內且高於平台頂，落下即著台。
  const warpServed = (level: LevelSpec, platform: { x: number; y: number; w: number }) =>
    level.elements.some(
      (element) =>
        element.kind === 'warp' &&
        Math.abs(element.x - platform.x) <= platform.w / 2 + 20 &&
        element.y < platform.y,
    );

  // v12 低重力高台（§81）：gravityScale ≤0.7 的浮月跳感可直達 208 高台（大跳＋拍翅）。
  const lowGravityServed = (level: LevelSpec) => (level.gravityScale ?? 1) <= 0.7;

  it('平台位於世界內；雙層以內或氣流柱/星門/低重力可達（§21/§51/§66/§81）；爬升 ≤82px', () => {
    const groundTop = 400; // 主地面頂（480 - 80）
    for (const level of LEVELS) {
      let prevY = groundTop;
      for (const platform of level.platforms) {
        expect(platform.x - platform.w / 2).toBeGreaterThanOrEqual(0);
        expect(platform.x + platform.w / 2).toBeLessThanOrEqual(level.worldWidth);
        if (platform.y < 272) {
          // 超出雙層的平台必有升降服務（氣流柱/星門/低重力），不逼近世界頂。
          expect(platform.y).toBeGreaterThanOrEqual(190);
          expect(
            updraftServed(level, platform) ||
              warpServed(level, platform) ||
              lowGravityServed(level),
          ).toBe(true);
        } else {
          // 向上爬升不得超過單跳最高 98px 的安全值；向下落無限制；氣流高台不入跳鏈。
          expect(prevY - platform.y).toBeLessThanOrEqual(82);
        }
        if (platform.y >= 272) prevY = platform.y;
      }
    }
  });

  it('氣流柱與熱泉噴口（§51/§72/§84）：L5 恆常、L13/L15/L19 週期化；柱頂安全帶 ≥100px', () => {
    for (const level of LEVELS) {
      const updrafts = level.elements.filter((element) => element.kind === 'updraft');
      if (level.id !== 5 && level.id !== 13 && level.id !== 15 && level.id !== 19) {
        expect(updrafts).toEqual([]);
        continue;
      }
      expect(updrafts.length).toBeGreaterThanOrEqual(2);
      for (const zone of updrafts) {
        if (zone.kind !== 'updraft') continue;
        expect(zone.x - zone.w / 2).toBeGreaterThanOrEqual(0);
        expect(zone.x + zone.w / 2).toBeLessThanOrEqual(level.worldWidth);
        // 卡頂防護（§56）：柱頂距世界頂 ≥100px，升力止於柱頂自然拋出。
        expect(zone.topY).toBeGreaterThanOrEqual(100);
        expect(zone.topY).toBeLessThan(400);
        if (level.id === 5) {
          // L5 既有氣流柱缺省恆常（§72 零回歸不變式）。
          expect(zone.periodMs).toBeUndefined();
          expect(zone.dutyPct).toBeUndefined();
        } else {
          // 週期噴口（§72）：週期與噴發佔比合法帶；telegraph 0.5s 需短於閒置段。
          expect(zone.periodMs ?? 0).toBeGreaterThanOrEqual(1500);
          expect(zone.dutyPct ?? 0).toBeGreaterThan(0);
          expect(zone.dutyPct ?? 1).toBeLessThanOrEqual(0.6);
          // 柱頂上方 160px 拋出弧淨空（§72 防無限拋接）：柱域內結構由 blocked.up
          // 斷供防護（§56），柱頂以上不得再有天花板夾層。
          const overhang = [...level.platforms, ...level.elements].filter((p) => {
            if (!('y' in p) || !('w' in p) || typeof p.y !== 'number') return false;
            const withinX = Math.abs(p.x - zone.x) <= (zone.w + p.w) / 2;
            return withinX && p.y < zone.topY && p.y > zone.topY - 160;
          });
          expect(overhang).toEqual([]);
        }
      }
    }
  });

  it('糖漿潮汐不變式（§71）：僅 L14/L15 配置；dry-window ≥40%、平台層頂高於漲頂 24px', () => {
    for (const level of LEVELS) {
      if (level.id !== 14 && level.id !== 15) {
        expect(level.tide).toBeUndefined();
        continue;
      }
      const tide = level.tide;
      expect(tide).toBeDefined();
      if (!tide) continue;
      // dry-window（§10.2-4）：主地面每週期露出 ≥40% ＝ dutyPct ≤ 0.6。
      expect(tide.dutyPct).toBeLessThanOrEqual(0.6);
      expect(tide.periodMs).toBeGreaterThanOrEqual(6000);
      // 漲頂低於平台層：全部平台頂（中心 y-8）高於漲頂 ≥24px（漲潮期可站）。
      for (const platform of level.platforms) {
        expect(platform.y - 8).toBeLessThanOrEqual(tide.maxY - 24);
      }
      // 交叉不變式 13（潮汐×Magno）資料面：tide 關 magno 權重受限（runtime 漲潮期
      // 生成排除由 GameScene 守門），磁場不至覆蓋唯一乾位。
      const magno = level.enemyMix.find((entry) => entry.kind === 'magno');
      expect(magno?.weight ?? 0).toBeLessThanOrEqual(0.15);
    }
  });

  it('getLevel 未知 id 擲錯', () => {
    expect(() => getLevel(21 as never)).toThrow();
  });

  const elementsOf = (level: LevelSpec, kind: StageElementSpec['kind']) =>
    level.elements.filter((element) => element.kind === kind);

  // 就地站立中心（§66 星門跳入制驗算）：門正下方最高可站面頂 - 玩家半身 20。
  const standCenterAt = (level: LevelSpec, x: number, belowY: number): number => {
    let surfaceTop = 400;
    const consider = (px: number, py: number, pw: number) => {
      const top = py - 8;
      if (Math.abs(px - x) <= pw / 2 && top >= belowY) surfaceTop = Math.min(surfaceTop, top);
    };
    for (const platform of level.platforms) consider(platform.x, platform.y, platform.w);
    for (const element of level.elements) {
      if (element.kind === 'oneway' || element.kind === 'moving') {
        consider(element.x, element.y, element.w);
      }
    }
    return surfaceTop - 20;
  };

  it('星門折躍不變式（§66/§10.2-3/-15/§84）：僅 L10/L11/L19、必成對、跳入制、精英房互斥', () => {
    for (const level of LEVELS) {
      const warps = level.elements.filter((element) => element.kind === 'warp');
      if (level.id !== 10 && level.id !== 11 && level.id !== 19) {
        expect(warps).toEqual([]);
        continue;
      }
      expect(warps.length).toBeGreaterThanOrEqual(2);
      // 必成對：同 pairId 恰兩門。
      const byPair = new Map<string, number>();
      for (const gate of warps) {
        if (gate.kind !== 'warp') continue;
        byPair.set(gate.pairId, (byPair.get(gate.pairId) ?? 0) + 1);
      }
      for (const count of byPair.values()) expect(count).toBe(2);
      for (const gate of warps) {
        if (gate.kind !== 'warp') continue;
        // 世界內淨空且遠離星星門區。
        expect(gate.x).toBeGreaterThan(96);
        expect(gate.x).toBeLessThan(level.worldWidth - 96);
        expect(Math.abs(gate.x - (level.worldWidth - 120))).toBeGreaterThan(165);
        // 跳入制：門心高於就地站立中心 ≥56px（500ms 冷卻期內落地必脫離觸發半徑，
        // 杜絕站立誤觸與出門回彈循環），且 ≤138px（單跳＋觸發半徑可達）。
        const standCenter = standCenterAt(level, gate.x, gate.y);
        expect(standCenter - gate.y).toBeGreaterThanOrEqual(WARP.triggerRadiusPx + 16);
        expect(standCenter - gate.y).toBeLessThanOrEqual(98 + WARP.triggerRadiusPx);
        // 交叉不變式 15：門不落於精英房界（±300）內側，含觸發半徑緩衝。
        for (const elite of level.elites) {
          expect(Math.abs(gate.x - elite.x)).toBeGreaterThan(300 + WARP.triggerRadiusPx);
        }
        // 出口 AABB 淨空補強（v10 審查殘餘）：門點不得嵌入任何站立面實體
        //（平台/單向/移動平台 AABB 外緣 ≥8px 緩衝；出門瞬移不得卡進幾何）。
        const solids = [
          ...level.platforms,
          ...level.elements.filter((el) => el.kind === 'oneway' || el.kind === 'moving'),
        ];
        for (const solid of solids) {
          if (!('y' in solid) || !('w' in solid)) continue;
          const dx = Math.max(0, Math.abs(gate.x - solid.x) - solid.w / 2);
          const dy = Math.max(0, Math.abs(gate.y - solid.y) - 8);
          expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(8);
        }
      }
    }
  });

  it('卡點關中點重生（§67/§84）：僅 L11/L15/L19 設 checkpointX ≈ 世界中點且落於精英房界外', () => {
    for (const level of LEVELS) {
      if (level.id !== 11 && level.id !== 15 && level.id !== 19) {
        expect(level.checkpointX).toBeUndefined();
        continue;
      }
      const checkpoint = level.checkpointX ?? 0;
      expect(Math.abs(checkpoint - level.worldWidth * 0.5)).toBeLessThanOrEqual(50);
      for (const elite of level.elites) {
        expect(Math.abs(checkpoint - elite.x)).toBeGreaterThan(300);
      }
    }
  });

  it('checkpointRespawnX：越過中點才回中點，未過或無 checkpoint 回 null', () => {
    const level = getLevel(11);
    expect(checkpointRespawnX(level, 100)).toBeNull();
    expect(checkpointRespawnX(level, 1849)).toBeNull();
    expect(checkpointRespawnX(level, 1850)).toBe(1850);
    expect(checkpointRespawnX(level, 3600)).toBe(1850);
    expect(checkpointRespawnX(getLevel(10), 3000)).toBeNull();
  });

  it('v4 元素依 §29 推進：S1 單向、S2 +移動+彈簧、S3 +可破壞磚、boss 關佈局特化', () => {
    for (const id of [1, 2, 3, 5, 6, 8, 9, 10, 11] as const) {
      const count = elementsOf(getLevel(id), 'oneway').length;
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(4);
    }
    for (const id of [2, 3, 6, 8, 9, 10, 11] as const) {
      for (const kind of ['moving', 'spring'] as const) {
        const count = elementsOf(getLevel(id), kind).length;
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(2);
      }
    }
    expect(elementsOf(getLevel(1), 'moving')).toEqual([]);
    expect(elementsOf(getLevel(1), 'spring')).toEqual([]);
    expect(elementsOf(getLevel(2), 'breakable')).toEqual([]);
    const bricks = elementsOf(getLevel(3), 'breakable').length;
    expect(bricks).toBeGreaterThanOrEqual(2);
    expect(bricks).toBeLessThanOrEqual(3);
    // L4/L12 僅裝飾；L7 加雙彈簧板（§58 非風化到空路徑），不配其他元素。
    expect(getLevel(4).elements).toEqual([]);
    expect(getLevel(12).elements).toEqual([]);
    expect(elementsOf(getLevel(7), 'spring')).toHaveLength(2);
    expect(getLevel(7).elements).toHaveLength(2);
    for (const id of [4, 7, 12] as const) {
      expect(getLevel(id).decor.length).toBeGreaterThan(0);
    }
  });

  it('v4 平台型元素於世界內、層高合法且移動掃程不出界（§29）', () => {
    const groundTop = 400;
    for (const level of LEVELS) {
      for (const element of level.elements) {
        if (element.kind === 'spring' || element.kind === 'breakable') continue;
        if (element.kind === 'updraft' || element.kind === 'warp') continue;
        const half = element.w / 2;
        expect(element.x - half).toBeGreaterThanOrEqual(0);
        expect(element.x + half).toBeLessThanOrEqual(level.worldWidth);
        expect(element.y).toBeGreaterThanOrEqual(272);
        expect(element.y).toBeLessThan(groundTop);
        // 自地面單跳可達（≤82px 安全值）；更高層由既有平台週邊接應。
        if (element.kind === 'moving') {
          const sweepEnd = element.axis === 'x' ? element.x + element.range : element.y;
          const sweepEndY = element.axis === 'y' ? element.y + element.range : element.y;
          if (element.axis === 'x') {
            expect(sweepEnd - half).toBeGreaterThanOrEqual(0);
            expect(sweepEnd + half).toBeLessThanOrEqual(level.worldWidth);
          }
          expect(sweepEndY).toBeGreaterThanOrEqual(272);
          expect(sweepEndY).toBeLessThan(groundTop);
        }
      }
    }
  });

  it('可破壞磚為地面獨立磚（§29 反卡死）：單跳可越過、彼此不成牆、不擋星星門', () => {
    for (const level of LEVELS) {
      const bricks = elementsOf(level, 'breakable');
      const xs = bricks.map((brick) => brick.x).sort((a, b) => a - b);
      for (const brick of bricks) {
        if (brick.kind !== 'breakable') continue;
        // 立於地面（中心 y = 400 - 20）：磚高 40 遠低於單跳最高 98px，破壞前必可繞行。
        expect(brick.y).toBe(400 - BRICK_SIZE / 2);
        expect(['ammo', 'hp']).toContain(brick.loot);
        // 星星門區（worldWidth-120 ±45）不得被磚佔據。
        expect(Math.abs(brick.x - (level.worldWidth - 120))).toBeGreaterThan(45 + BRICK_SIZE);
      }
      for (let i = 1; i < xs.length; i += 1) {
        expect((xs[i] ?? 0) - (xs[i - 1] ?? 0)).toBeGreaterThan(BRICK_SIZE * 3);
      }
    }
  });

  it('佈景密度符合 §32：間距 400-600、任一 1200 視窗 ≤6、key 對應關卡主題', () => {
    // v8 道具主題重用（§55）：新 biome 沿用既有主題道具條。
    const decorTheme: Record<string, string> = {
      'bg-canyon': 'heights',
      'bg-gallery': 'arena',
      'bg-eclipse': 'throne',
      'bg-cavern': 'arena',
      'bg-mirror': 'arena',
      'bg-lumen': 'arena',
      'bg-magnetic': 'arena',
      'bg-prism': 'arena',
      // v11 四區（§72）：四關共用窯主題道具條（props-kiln W3 交付）。
      'bg-kiln': 'kiln',
      'bg-valley': 'kiln',
      'bg-kilnway': 'kiln',
      'bg-kilnhall': 'kiln',
      // v12 五區（§84 主計畫 §9）：星域重用 arena/throne 主題混排（星晶/星柱語彙）。
      'bg-astral': '(arena|throne)',
      'bg-meteorfield': '(arena|throne)',
      'bg-starcourt': '(arena|throne)',
      'bg-voidcore': 'throne',
    };
    for (const level of LEVELS) {
      const theme = decorTheme[level.bgKey] ?? level.bgKey.replace('bg-', '');
      for (const decor of level.decor) {
        expect(decor.key).toMatch(new RegExp(`^prop-${theme}-[1-4]$`));
        expect(decor.x).toBeGreaterThanOrEqual(0);
        expect(decor.x).toBeLessThanOrEqual(level.worldWidth);
      }
      const xs = level.decor.map((decor) => decor.x).sort((a, b) => a - b);
      // boss 關單屏僅裝飾，不套滾動關間距節奏。
      if (!level.boss) {
        for (let i = 1; i < xs.length; i += 1) {
          const gap = (xs[i] ?? 0) - (xs[i - 1] ?? 0);
          expect(gap).toBeGreaterThanOrEqual(400);
          expect(gap).toBeLessThanOrEqual(600);
        }
      }
      expect(maxDecorInWindow(xs, 1200)).toBeLessThanOrEqual(6);
    }
  });

  it('nextLevelId 依 1→…→15→null 推進', () => {
    for (let id = 1; id < LEVELS.length; id += 1) {
      expect(nextLevelId(id as never)).toBe(id + 1);
    }
    expect(nextLevelId(LEVELS.length as never)).toBeNull();
  });
});

describe('recordKill 配額推進', () => {
  it('擊殺累計至配額時開門', () => {
    let state = createLevelRun(1);
    for (let i = 0; i < 5; i++) {
      state = recordKill(state);
      expect(state.gateOpen).toBe(false);
    }
    state = recordKill(state);
    expect(state.killCount).toBe(6);
    expect(state.gateOpen).toBe(true);
  });

  it('boss 關擊殺不開門（過關由魔王擊破觸發）', () => {
    let state = createLevelRun(4);
    for (let i = 0; i < 10; i++) state = recordKill(state);
    expect(state.gateOpen).toBe(false);
  });
});

describe('教學關死亡配額結轉（§105 D5）', () => {
  const tutorial = getLevel(1);
  const normal = getLevel(2);

  it('教學關保留一半（向下取整），非教學關恆歸零', () => {
    expect(tutorial.tutorial).toBe(true);
    expect(carryKillsOnDeath(tutorial, 5)).toBe(2);
    expect(carryKillsOnDeath(tutorial, 4)).toBe(2);
    expect(carryKillsOnDeath(tutorial, 1)).toBe(0);
    expect(carryKillsOnDeath(tutorial, 0)).toBe(0);
    expect(carryKillsOnDeath(normal, 8)).toBe(0);
  });

  it('結轉夾限至配額-1：不可能帶開門態重生', () => {
    expect(carryKillsOnDeath(tutorial, 99)).toBe(tutorial.killQuota - 1);
    const seeded = createLevelRun(1, carryKillsOnDeath(tutorial, 99));
    expect(seeded.gateOpen).toBe(false);
    // 結轉後補殺一隻即達配額開門（推進邏輯不受種子影響）。
    expect(recordKill(seeded).gateOpen).toBe(true);
  });

  it('createLevelRun 種子夾非負；缺省維持 0', () => {
    expect(createLevelRun(1).killCount).toBe(0);
    expect(createLevelRun(1, -3).killCount).toBe(0);
    expect(createLevelRun(1, 2).killCount).toBe(2);
  });
});

describe('advanceLevelSpawn 節流', () => {
  const tickUntilSpawn = (state: LevelRunState, deltaMs: number, alive: number) =>
    advanceLevelSpawn(state, { deltaMs, aliveEnemies: alive });

  it('間隔未到不生成，到期生成並歸零計時', () => {
    let state = createLevelRun(1);
    let result = tickUntilSpawn(state, 2599, 0);
    expect(result.spawn).toBe(false);
    state = result.state;
    result = tickUntilSpawn(state, 1, 0);
    expect(result.spawn).toBe(true);
    expect(result.state.spawnTimerMs).toBe(0);
  });

  it('達同屏上限時暫停，空位出現即刻補生', () => {
    let state = createLevelRun(1);
    let result = tickUntilSpawn(state, 5000, 3);
    expect(result.spawn).toBe(false);
    state = result.state;
    result = tickUntilSpawn(state, 16, 2);
    expect(result.spawn).toBe(true);
  });

  it('門開後停止生成（尾端 release）', () => {
    let state = createLevelRun(1);
    for (let i = 0; i < 6; i++) state = recordKill(state);
    expect(state.gateOpen).toBe(true);
    const result = tickUntilSpawn(state, 10000, 0);
    expect(result.spawn).toBe(false);
  });
});

describe('pickEnemyKind 加權抽選', () => {
  it('rand01 落點對應權重區間', () => {
    const level = getLevel(1); // jelly 0.6 / floaty 0.4
    expect(pickEnemyKind(level, 0)).toBe('jelly');
    expect(pickEnemyKind(level, 0.59)).toBe('jelly');
    expect(pickEnemyKind(level, 0.61)).toBe('floaty');
    expect(pickEnemyKind(level, 0.999)).toBe('floaty');
  });

  it('rand01=1 邊界退回末位種類', () => {
    const level = getLevel(1);
    expect(pickEnemyKind(level, 1)).toBe('floaty');
  });
});

describe('反卡死保證律（§26）', () => {
  it('飢荒時 pickSpawnKind 覆蓋權重，任何 rand 皆抽出可吸怪', () => {
    const level = getLevel(3); // spiky 0.3 + chompy 0.2 佔半
    for (const rand of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(canInhale(pickSpawnKind(level, rand, true))).toBe(true);
    }
  });

  it('非飢荒時 pickSpawnKind 等同加權抽選', () => {
    const level = getLevel(3);
    for (const rand of [0, 0.4, 0.8]) {
      expect(pickSpawnKind(level, rand, false)).toBe(pickEnemyKind(level, rand));
    }
  });

  it('boss 期飢荒立即補生，不等生成間隔', () => {
    const state = createLevelRun(4);
    const result = advanceLevelSpawn(state, { deltaMs: 16, aliveEnemies: 0, starving: true });
    expect(result.spawn).toBe(true);
    expect(result.state.spawnTimerMs).toBe(0);
  });

  it('非 boss 關飢荒僅覆蓋品種，生成節奏不變', () => {
    const state = createLevelRun(1);
    const result = advanceLevelSpawn(state, { deltaMs: 16, aliveEnemies: 0, starving: true });
    expect(result.spawn).toBe(false);
  });
});

describe('走動關飢荒救援（§107，issue #804）', () => {
  // 重現軟僵局：同屏上限被紮根/不可吸個體佔滿（5/5）＋玩家零彈——一般節流
  // 因 aliveEnemies >= maxOnScreen 永不生成，救援律必須在閾值內強制補生可吸怪。
  it('同屏佔滿且持續飢荒 → 救援閾值內強制補生（無視同屏上限）', () => {
    const level = getLevel(3);
    let state = createLevelRun(3);
    let spawnedAtMs: number | null = null;
    for (let elapsed = 0; elapsed <= STARVATION_RESCUE_MS + 1000; elapsed += 100) {
      const result = advanceLevelSpawn(state, {
        deltaMs: 100,
        aliveEnemies: level.maxOnScreen,
        starving: true,
      });
      state = result.state;
      if (result.spawn) {
        spawnedAtMs = elapsed + 100;
        break;
      }
    }
    expect(spawnedAtMs).not.toBeNull();
    expect(spawnedAtMs ?? Infinity).toBeLessThanOrEqual(STARVATION_RESCUE_MS + 100);
  });

  it('飢荒中斷即歸零重計：間歇飢荒不觸發救援', () => {
    const level = getLevel(3);
    let state = createLevelRun(3);
    for (let i = 0; i < 40; i++) {
      // 每 3 tick 出現一次非飢荒 tick（場上短暫有可吸怪），累計永不達閾值。
      const result = advanceLevelSpawn(state, {
        deltaMs: STARVATION_RESCUE_MS / 3,
        aliveEnemies: level.maxOnScreen,
        starving: i % 3 !== 2,
      });
      state = result.state;
      expect(result.spawn).toBe(false);
    }
  });

  it('開門後不救援（尾端 release 不受影響）', () => {
    let state = createLevelRun(3);
    for (let i = 0; i < 10; i++) state = recordKill(state);
    expect(state.gateOpen).toBe(true);
    for (let i = 0; i < 30; i++) {
      const result = advanceLevelSpawn(state, {
        deltaMs: 1000,
        aliveEnemies: 5,
        starving: true,
      });
      state = result.state;
      expect(result.spawn).toBe(false);
    }
  });

  it('同屏未滿的飢荒仍走一般節流（救援閾值前不提早生成）', () => {
    let state = createLevelRun(3);
    // spawnIntervalMs 1300 < 救援閾值：間隔到期即一般生成，救援不搶跑。
    let result = advanceLevelSpawn(state, { deltaMs: 1299, aliveEnemies: 0, starving: true });
    expect(result.spawn).toBe(false);
    state = result.state;
    result = advanceLevelSpawn(state, { deltaMs: 1, aliveEnemies: 0, starving: true });
    expect(result.spawn).toBe(true);
  });

  it('魔王關維持立即補生，不落入走動關救援計時（bossFactory 契約不漂移）', () => {
    const state = createLevelRun(4);
    const result = advanceLevelSpawn(state, { deltaMs: 16, aliveEnemies: 2, starving: true });
    expect(result.spawn).toBe(true);
    expect(result.state.spawnTimerMs).toBe(0);
  });

  it('全部走動關 enemyMix 至少含一種恆可吸品種（救援律供給面保證）', () => {
    for (const level of LEVELS) {
      if (level.boss) continue;
      const inhalable = level.enemyMix.filter((entry) => canInhale(entry.kind));
      expect(inhalable.length, `L${level.id} 缺恆可吸品種`).toBeGreaterThan(0);
    }
  });
});

describe('#812 救援可及性保證（擴充 §107.1）', () => {
  it('救援觸發帶 rescue 旗標；一般節流與魔王補生不帶', () => {
    let state = createLevelRun(3);
    const rescueResult = advanceLevelSpawn(state, {
      deltaMs: STARVATION_RESCUE_MS,
      aliveEnemies: getLevel(3).maxOnScreen,
      starving: true,
    });
    expect(rescueResult.spawn).toBe(true);
    expect(rescueResult.rescue).toBe(true);
    // 一般節流：非飢荒間隔到期生成不帶旗標。
    state = createLevelRun(3);
    const normal = advanceLevelSpawn(state, { deltaMs: 1300, aliveEnemies: 0 });
    expect(normal.spawn).toBe(true);
    expect(normal.rescue).toBeUndefined();
    // 魔王關飢荒立即補生：沿既有遠側入場路徑，不帶旗標。
    const boss = advanceLevelSpawn(createLevelRun(4), {
      deltaMs: 16,
      aliveEnemies: 2,
      starving: true,
    });
    expect(boss.spawn).toBe(true);
    expect(boss.rescue).toBeUndefined();
  });

  it('pickRescueKind 低威脅優先：L2 恆抽 safe 子集（floaty/puffy）', () => {
    const level = getLevel(2);
    for (const rand of [0, 0.25, 0.5, 0.75, 0.99]) {
      const kind = pickRescueKind(level, rand, false);
      expect(['floaty', 'puffy']).toContain(kind);
    }
  });

  it('pickRescueKind 滿潮排除位移壓迫型：L14 收斂 splatta/spora；非滿潮回落含 gusty', () => {
    const level = getLevel(14);
    for (const rand of [0, 0.3, 0.6, 0.99]) {
      const kind = pickRescueKind(level, rand, true);
      expect(['splatta', 'spora']).toContain(kind);
    }
    // 非滿潮無 safe 候選：回落恆可吸全集（anti-softlock 優先），gusty 可入選。
    expect(pickRescueKind(level, 0.5, false)).toBe('gusty');
  });

  it('rescueSpawnX 前方 160–240px；越界或尾端安全區改後方等距', () => {
    const level = getLevel(2);
    expect(rescueSpawnX(500, 0, level)).toBe(500 + RESCUE_AHEAD_MIN_PX);
    expect(rescueSpawnX(500, 1, level)).toBe(500 + RESCUE_AHEAD_MAX_PX);
    // 前方落入尾端安全區（worldWidth 3100 − safeZoneTailPx 480 = 2620 起）→ 改後方。
    expect(rescueSpawnX(2500, 0, level)).toBe(2500 - RESCUE_AHEAD_MIN_PX);
    // 前方越過世界右緣 → 改後方。
    expect(rescueSpawnX(level.worldWidth - 100, 0, level)).toBe(
      level.worldWidth - 100 - RESCUE_AHEAD_MIN_PX,
    );
    expect(RESCUE_REPOSITION_MS).toBe(8000);
  });
});

describe('滿潮生成降載（§107，issue #806）', () => {
  it('floodHold 暫停一般補生：計時凍在滿格、退潮首 tick 即補', () => {
    let state = createLevelRun(14); // spawnIntervalMs 1250
    let result = advanceLevelSpawn(state, { deltaMs: 5000, aliveEnemies: 0, floodHold: true });
    expect(result.spawn).toBe(false);
    state = result.state;
    // 滿潮持續：仍不生成。
    result = advanceLevelSpawn(state, { deltaMs: 1000, aliveEnemies: 0, floodHold: true });
    expect(result.spawn).toBe(false);
    state = result.state;
    // 退潮：計時已滿，首 tick 立即補生。
    result = advanceLevelSpawn(state, { deltaMs: 16, aliveEnemies: 0, floodHold: false });
    expect(result.spawn).toBe(true);
  });

  it('飢荒救援不受滿潮閘（anti-softlock 優先）', () => {
    const level = getLevel(14);
    let state = createLevelRun(14);
    let spawned = false;
    for (let elapsed = 0; elapsed <= STARVATION_RESCUE_MS + 1000; elapsed += 100) {
      const result = advanceLevelSpawn(state, {
        deltaMs: 100,
        aliveEnemies: level.maxOnScreen,
        starving: true,
        floodHold: true,
      });
      state = result.state;
      if (result.spawn) {
        spawned = true;
        break;
      }
    }
    expect(spawned).toBe(true);
  });

  it('魔王關補給不受 floodHold（Syrona 潮汐關供彈節奏零漂移）', () => {
    let state = createLevelRun(16); // spawnIntervalMs 3000
    let result = advanceLevelSpawn(state, { deltaMs: 3000, aliveEnemies: 0, floodHold: true });
    expect(result.spawn).toBe(true);
    // boss 飢荒立即補生亦不受閘。
    state = createLevelRun(16);
    result = advanceLevelSpawn(state, {
      deltaMs: 16,
      aliveEnemies: 0,
      starving: true,
      floodHold: true,
    });
    expect(result.spawn).toBe(true);
  });
});

describe('isInSafeTail 尾端安全區', () => {
  it('世界末端 safeZoneTailPx 內為安全區', () => {
    const level = getLevel(1); // worldWidth 2700, tail 480
    expect(isInSafeTail(level, 2219)).toBe(false);
    expect(isInSafeTail(level, 2220)).toBe(true);
    expect(isInSafeTail(level, 2700)).toBe(true);
  });

  it('boss 關無安全區', () => {
    expect(isInSafeTail(getLevel(4), 400)).toBe(false);
  });
});
