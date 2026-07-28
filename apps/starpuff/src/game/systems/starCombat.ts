import type Phaser from 'phaser';
import {
  SLAM,
  STARSTORM,
  STAR_FLAVORS,
  getMix,
  type MixId,
  type StarFlavor,
  type StarFlavorSpec,
  type StarMixSpec,
} from '../core/config';
import { knockbackVelocity, pickInRadius } from '../logic/combat';
import { buffDamageMul, type BuffState } from '../logic/buffs';
import { SHELL_SHIELD, pickChainTargets } from '../logic/skills';
import {
  GALE_FLIGHT,
  GRAVITY_WELL,
  MAGMA_POP,
  RAINBOW_BEAM,
  TIDE_PULL,
  TRANSFORM_FORMS,
  VOLT_BEAM,
  VOLT_DISCHARGE,
} from '../logic/transform';
import type { BossDamageSource, BossHandle } from './boss';
import type { EnemySystem } from './enemies';
import type { FxSystem } from './fx';
import { flashSprite } from './fxLayers';
import type { PlayerHandle } from './player';
import { playSfx } from '../audio/sfx';

// 星彈規格與技能世界結算（GAME_DESIGN §23/§40/§46/§57）：player 只發事件，
// 場上效果集中於此；GameScene 只留事件路由與 overlap 接線。

// 雷鏈跳電演出（§40）：折線閃電段淡出時長。
const BOLT_FADE_MS = 200;

// 平面距離（與 Phaser.Math.Distance.Between 同語意）：本模組不 value-import phaser，
// 維持 node 環境可單測。
const distanceBetween = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.hypot(x2 - x1, y2 - y1);

export type PlayerFormSpec = (typeof TRANSFORM_FORMS)['volt'];

// hooks 以閉包延遲解析：player/enemies/fx/boss 於 GameScene create 依序建立。
export interface StarCombatHooks {
  enemies(): EnemySystem;
  fx(): FxSystem;
  boss(): BossHandle;
  player(): PlayerHandle;
  buff(): BuffState;
  // 多本體工具（§68）：存活本體清單與受擊單一出口由 GameScene 持有。
  bossBodies(): Phaser.Physics.Arcade.Sprite[];
  damageBossAt(amount: number, x: number, y: number, source?: BossDamageSource): void;
}

export interface StarCombat {
  // 彈道有效規格單一出口（§46）：混合彈讀配方表，其餘讀屬性表。
  mixOf(star: Phaser.Physics.Arcade.Sprite): StarMixSpec | null;
  specOf(star: Phaser.Physics.Arcade.Sprite): StarFlavorSpec;
  damageOf(star: Phaser.Physics.Arcade.Sprite): number;
  // 玩家當前形態規格（§57）：未變身為 null。
  playerFormSpec(): PlayerFormSpec | null;
  slamRadiusPx(): number;
  explodeStar(
    x: number,
    y: number,
    spec: StarFlavorSpec,
    exclude: Phaser.GameObjects.GameObject | null,
    burn?: boolean,
  ): void;
  chainLightning(
    x: number,
    y: number,
    spec: StarFlavorSpec,
    exclude: Phaser.GameObjects.GameObject | null,
  ): void;
  freezeField(x: number, y: number, mix: StarMixSpec): void;
  resolveStarstorm(): void;
  resolveSlamImpact(x: number, y: number): void;
  resolveShieldCounter(x: number, y: number, facing: 1 | -1): void;
  resolveVoltBeam(x: number, y: number, facing: 1 | -1): void;
  resolveVoltDischarge(x: number, y: number): void;
  resolveGaleLanding(x: number, y: number): void;
  // 形態技路由單一入口（§119）：GameScene 只轉發事件 kind，分派集中於此。
  resolveTransformStrike(kind: TransformStrikeKind, x: number, y: number, facing: 1 | -1): void;
}

export type TransformStrikeKind =
  | 'volt-beam'
  | 'volt-discharge'
  | 'gale-landing'
  | 'magma-pop'
  | 'tide-pull'
  | 'rainbow-beam'
  | 'gravity-well';

export function createStarCombat(scene: Phaser.Scene, hooks: StarCombatHooks): StarCombat {
  function flavorOf(star: Phaser.Physics.Arcade.Sprite): StarFlavor {
    return (star.getData('flavor') as StarFlavor | undefined) ?? 'jelly';
  }

  // 混合星規格（§46）：發射端寫入 mix id；非混合彈回 null。
  function mixOf(star: Phaser.Physics.Arcade.Sprite): StarMixSpec | null {
    const id = star.getData('mix') as MixId | null | undefined;
    return id ? getMix(id) : null;
  }

  function specOf(star: Phaser.Physics.Arcade.Sprite): StarFlavorSpec {
    return mixOf(star) ?? STAR_FLAVORS[flavorOf(star)];
  }

  // 星彈傷害（§23/§69）：發射端已依槽位（強化 ×1.6 / 金星 20）寫入；星力果倍率結算端疊乘。
  function damageOf(star: Phaser.Physics.Arcade.Sprite): number {
    const base = (star.getData('damage') as number | undefined) ?? specOf(star).damage;
    return base * buffDamageMul(hooks.buff());
  }

  function playerFormSpec(): PlayerFormSpec | null {
    const form = hooks.player().getTransformState().form;
    return form ? TRANSFORM_FORMS[form] : null;
  }

  // 下衝擊有效半徑（§57）：殼化下砸範圍加倍。
  function slamRadiusPx(): number {
    return SLAM.radiusPx * (playerFormSpec()?.slamRadiusMul ?? 1);
  }

  // 爆裂星 AoE（§20/§53）：命中處圓形距離判定波及其他小怪，主目標排除避免重複結算；
  // 毒爆雲（slowMs > 0）對波及未死者加套緩速持續傷。
  function explodeStar(
    x: number,
    y: number,
    spec: StarFlavorSpec,
    exclude: Phaser.GameObjects.GameObject | null,
    burn = false,
  ): void {
    hooks.fx().burstSmall(x, y, spec.tint);
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (child === exclude || !child.active) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (distanceBetween(x, y, enemy.x, enemy.y) <= spec.aoeRadiusPx) {
        const outcome = hooks.enemies().damage(child, spec.aoeDamage, burn);
        if (spec.slowMs > 0 && outcome === 'hurt') {
          hooks.enemies().applySlow(child, spec.slowMs, spec.dotDamage);
        }
      }
    }
  }

  // 雷鏈跳電（§40）：命中點半徑內取最近 chainCount 隻依序跳電，折線閃電演出。
  function chainLightning(
    x: number,
    y: number,
    spec: StarFlavorSpec,
    exclude: Phaser.GameObjects.GameObject | null,
  ): void {
    const candidates: { x: number; y: number; ref: Phaser.GameObjects.GameObject }[] = [];
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active || child === exclude) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      candidates.push({ x: enemy.x, y: enemy.y, ref: child });
    }
    const targets = pickChainTargets(x, y, candidates, spec.chainCount, spec.chainRadiusPx);
    if (targets.length === 0) return;
    playSfx('zap');
    let fromX = x;
    let fromY = y;
    for (const target of targets) {
      drawBolt(fromX, fromY, target.x, target.y);
      hooks.fx().burstSmall(target.x, target.y, spec.tint);
      hooks.enemies().damage(target.ref, spec.chainDamage);
      fromX = target.x;
      fromY = target.y;
    }
  }

  // 折線閃電：兩點間三段隨機垂直抖動折線，快速淡出自毀。
  function drawBolt(x1: number, y1: number, x2: number, y2: number): void {
    const bolt = scene.add.graphics().setDepth(93);
    bolt.lineStyle(3, 0xffe28a, 1);
    bolt.beginPath();
    bolt.moveTo(x1, y1);
    const nx = -(y2 - y1);
    const ny = x2 - x1;
    const len = Math.hypot(nx, ny) || 1;
    for (const t of [0.25, 0.5, 0.75]) {
      const jitter = (Math.random() - 0.5) * 22;
      bolt.lineTo(
        x1 + (x2 - x1) * t + (nx / len) * jitter,
        y1 + (y2 - y1) * t + (ny / len) * jitter,
      );
    }
    bolt.lineTo(x2, y2);
    bolt.strokePath();
    scene.tweens.add({
      targets: bolt,
      alpha: 0,
      duration: BOLT_FADE_MS,
      ease: 'Quad.easeIn',
      onComplete: () => bolt.destroy(),
    });
  }

  // 凝光星凍結場（§46）：命中處光域擴散，域內小怪凍結停擺（主目標一併凍結）；
  // 選敵下沉 combat.pickInRadius，此處只管視覺 tween 與凍結套用。
  function freezeField(x: number, y: number, mix: StarMixSpec): void {
    const field = scene.add
      .circle(x, y, mix.freezeRadiusPx, 0xdff2ff, 0.22)
      .setStrokeStyle(3, 0xbfe8ff, 0.9)
      .setDepth(59)
      .setScale(0.3);
    scene.tweens.add({
      targets: field,
      scale: 1,
      duration: 220,
      ease: 'Quad.easeOut',
    });
    scene.tweens.add({
      targets: field,
      alpha: 0,
      delay: mix.freezeMs - 300,
      duration: 300,
      onComplete: () => field.destroy(),
    });
    const candidates: { x: number; y: number; ref: Phaser.GameObjects.GameObject }[] = [];
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      candidates.push({ x: enemy.x, y: enemy.y, ref: child });
    }
    for (const target of pickInRadius(x, y, candidates, mix.freezeRadiusPx + 20)) {
      hooks.enemies().freeze(target.ref, mix.freezeMs);
    }
  }

  // 星暴（§23）：白閃 + 震屏 + 視野內星雨連爆；清場全小怪、魔王固定 12 傷。
  function resolveStarstorm(): void {
    scene.cameras.main.flash(280, 255, 255, 255);
    hooks.fx().shake(12);
    const view = scene.cameras.main.worldView;
    for (let i = 0; i < 6; i += 1) {
      scene.time.delayedCall(i * 90, () =>
        hooks
          .fx()
          .starBurst(
            view.x + Math.random() * view.width,
            view.y + Math.random() * view.height * 0.6,
          ),
      );
    }
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (child.active) hooks.enemies().kill(child);
    }
    if (hooks.boss().isActive()) {
      // 多本體（§68）：星暴固定傷結算至玩家最近的存活本體；星彈歸因（§113），
      // 缺 source 會在滿盾＋虹吸窗下被護盾層吸收為 0 傷。
      const sprite = hooks.player().sprite;
      hooks.damageBossAt(STARSTORM.bossDamage, sprite.x, sprite.y, 'star');
    }
  }

  // 下衝擊落地（§23）：60px 圓域傷害 2 + 擊退；未死者被震開。
  function resolveSlamImpact(x: number, y: number): void {
    hooks.fx().shake(6);
    const radius = slamRadiusPx();
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (distanceBetween(x, y, enemy.x, enemy.y) > radius) continue;
      const outcome = hooks.enemies().damage(child, SLAM.damage);
      if (outcome === 'hurt') {
        const kb = knockbackVelocity(enemy.x, x, SLAM.knockbackSpeed, SLAM.knockbackLift);
        enemy.setVelocity(kb.x, kb.y);
      }
    }
  }

  // 殼盾反擊星爆（§40）：盾面前定點星爆，波及面前 90px 小怪。
  function resolveShieldCounter(x: number, y: number, facing: 1 | -1): void {
    const originX = x + facing * 30;
    hooks.fx().starBurst(originX, y);
    hooks.fx().shake(5);
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (distanceBetween(originX, y, enemy.x, enemy.y) <= SHELL_SHIELD.counterRadiusPx) {
        hooks.enemies().damage(child, SHELL_SHIELD.counterDamage);
      }
    }
  }

  // 雷化鏈電束（§57/§68）：短程面向側取最近目標（小怪或魔王本體）主傷，再沿雷鏈跳電
  // 波及——跳電候選含小怪、其餘存活魔王本體與碎晶盾（分裂型天然剋制，審查修復）。
  function resolveVoltBeam(x: number, y: number, facing: 1 | -1): void {
    interface BeamTarget {
      x: number;
      y: number;
      ref: Phaser.GameObjects.GameObject | null;
      shield?: Phaser.Physics.Arcade.Sprite;
    }
    const candidates: BeamTarget[] = [];
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      candidates.push({ x: enemy.x, y: enemy.y, ref: child });
    }
    if (hooks.boss().isActive()) {
      // 多本體（§68）：全部存活本體入候選，鏈電束就近取目標。
      for (const body of hooks.bossBodies()) {
        if (!(body.body as Phaser.Physics.Arcade.Body).enable) continue;
        candidates.push({ x: body.x, y: body.y, ref: null });
      }
      for (const obj of hooks.boss().getShields?.()?.getMatching('active', true) ?? []) {
        const shard = obj as Phaser.Physics.Arcade.Sprite;
        candidates.push({ x: shard.x, y: shard.y, ref: null, shield: shard });
      }
    }
    const inFront = candidates.filter((c) => Math.sign(c.x - x) === facing || c.x === x);
    const target = pickChainTargets(x, y, inFront, 1, VOLT_BEAM.rangePx)[0];
    if (!target) return;
    // 跳電單一結算出口：主傷與波及共用（盾碎裂/小怪/魔王本體三路）。
    const strike = (hit: BeamTarget, damage: number): void => {
      hooks.fx().burstSmall(hit.x, hit.y, TRANSFORM_FORMS.volt.tint);
      if (hit.shield) {
        hit.shield.disableBody(true, true);
        playSfx('break', 0.7);
        return;
      }
      if (hit.ref) {
        hooks.enemies().damage(hit.ref, damage);
        return;
      }
      hooks.damageBossAt(damage, hit.x, hit.y, 'volt');
    };
    playSfx('zap');
    drawBolt(x, y, target.x, target.y);
    // 星力果（§69）：變身射擊同享傷害倍率。
    strike(target, VOLT_BEAM.damage * buffDamageMul(hooks.buff()));
    // 跳電波及：以主目標為原點取最近候選（排除主目標自身）。
    const rest = candidates.filter((c) => c !== target);
    let fromX = target.x;
    let fromY = target.y;
    for (const hop of pickChainTargets(
      target.x,
      target.y,
      rest,
      VOLT_BEAM.chainCount,
      VOLT_BEAM.rangePx,
    )) {
      drawBolt(fromX, fromY, hop.x, hop.y);
      strike(hop, VOLT_BEAM.chainDamage);
      fromX = hop.x;
      fromY = hop.y;
    }
  }

  // 雷化受擊放電反擊（§110）：以玩家為圓心放電波及小怪（次數裁決在 player 端）。
  function resolveVoltDischarge(x: number, y: number): void {
    hooks.fx().shake(4);
    hooks.fx().burstSmall(x, y, TRANSFORM_FORMS.volt.tint);
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (distanceBetween(x, y, enemy.x, enemy.y) > VOLT_DISCHARGE.radiusPx) continue;
      hooks.enemies().damage(child, VOLT_DISCHARGE.damage);
    }
  }

  // 風化落地衝擊（§57）：小範圍傷害＋輕擊退（半徑/傷害低於下衝擊，零彈藥消耗）。
  function resolveGaleLanding(x: number, y: number): void {
    hooks.fx().shake(3);
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (distanceBetween(x, y, enemy.x, enemy.y) > GALE_FLIGHT.landingRadiusPx) {
        continue;
      }
      const outcome = hooks.enemies().damage(child, GALE_FLIGHT.landingDamage);
      if (outcome === 'hurt') {
        const kb = knockbackVelocity(enemy.x, x, SLAM.knockbackSpeed * 0.7, SLAM.knockbackLift);
        enemy.setVelocity(kb.x, kb.y);
      }
    }
  }

  // 焰化熔岩爆（§119）：落地燒灼小爆——範圍/傷害高於風化落地衝擊，burn 結算熔解優勢。
  function resolveMagmaPop(x: number, y: number): void {
    hooks.fx().shake(5);
    hooks.fx().burstSmall(x, y, TRANSFORM_FORMS.ember.tint);
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (distanceBetween(x, y, enemy.x, enemy.y) > MAGMA_POP.radiusPx) continue;
      const outcome = hooks.enemies().damage(child, MAGMA_POP.damage, true);
      if (outcome === 'hurt') {
        const kb = knockbackVelocity(enemy.x, x, SLAM.knockbackSpeed * 0.7, SLAM.knockbackLift);
        enemy.setVelocity(kb.x, kb.y);
      }
    }
  }

  // 潮化水引（§119）：面向側域內小怪拉向玩家——貼近吸入循環（吞取節奏加速）。
  // 供給味清單只拉不傷（PR #886 收斂）：HP1 供給怪先傷即殺、拉近永不執行；判準
  // 用 TIDE_PULL.pullOnlyKinds 專屬清單而非 isInhalable（後者對絕大多數敵人恆真，
  // 會使潮引近乎全面零傷）。其餘目標維持輕傷＋未死拉近（攻語彙保留）。
  function resolveTidePull(x: number, y: number, facing: 1 | -1): void {
    hooks.fx().burstSmall(x, y, TRANSFORM_FORMS.tide.tint);
    // 水引起手演出（§124 W5a）：起手潮爆＋面向側水流掃出；素材缺載沿碎光保底。
    flashSprite(scene, 'fx-star-tide-explosion', x, y, 72, { durationMs: 260, depth: 88 });
    flashSprite(scene, 'fx-star-tide-flight', x + facing * (TIDE_PULL.rangePx / 2), y, 88, {
      durationMs: 300,
      depth: 87,
      fromScale: 0.25,
    });
    const player = hooks.player().sprite;
    const pullOnlyKinds: readonly string[] = TIDE_PULL.pullOnlyKinds;
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (Math.sign(enemy.x - x) !== facing && enemy.x !== x) continue;
      if (distanceBetween(x, y, enemy.x, enemy.y) > TIDE_PULL.rangePx) continue;
      const kind = hooks.enemies().kindOf(child);
      // 被拉目標水痕命中閃（§124 W5a）。
      flashSprite(scene, 'fx-star-tide-hit', enemy.x, enemy.y, 40, { durationMs: 180, depth: 89 });
      if (kind !== null && pullOnlyKinds.includes(kind)) {
        // 零傷命中確認（PR #886 UIUX）：只拉不傷仍需碎光回饋，防玩家誤判技能未生效。
        hooks.fx().burstSmall(enemy.x, enemy.y, TRANSFORM_FORMS.tide.tint);
      } else {
        const outcome = hooks.enemies().damage(child, TIDE_PULL.damage);
        if (outcome === 'ignored' || outcome === 'killed') continue;
      }
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      enemy.setVelocity((dx / dist) * TIDE_PULL.pullSpeed, (dy / dist) * TIDE_PULL.pullSpeed);
    }
  }

  // 稜化彩虹光束（§119）：面向側走廊貫穿判定——小怪與魔王本體全結算，光帶漸隱演出。
  function resolveRainbowBeam(x: number, y: number, facing: 1 | -1): void {
    const endX = x + facing * RAINBOW_BEAM.rangePx;
    // 光束端點演出（§124 W5a）：起點稜光蓄放＋終端稜光爆；素材缺載沿光帶保底。
    flashSprite(scene, 'fx-star-prism-charge', x, y, 64, { durationMs: 240, depth: 93 });
    flashSprite(scene, 'fx-star-prism-explosion', endX, y, 96, { durationMs: 320, depth: 93 });
    const beam = scene.add.graphics().setDepth(93);
    // 彩虹三色帶（形狀訊號，不依賴單色）。
    const bands: readonly [number, number][] = [
      [0xff9ec4, -8],
      [0xfff1c4, 0],
      [0x9fd8f0, 8],
    ];
    for (const [tint, offsetY] of bands) {
      beam.lineStyle(6, tint, 0.85);
      beam.lineBetween(x, y + offsetY, endX, y + offsetY);
    }
    scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => beam.destroy(),
    });
    playSfx('zap', 1.3);
    const inCorridor = (tx: number, ty: number): boolean =>
      Math.abs(ty - y) <= RAINBOW_BEAM.corridorHalfPx &&
      (Math.sign(tx - x) === facing || tx === x) &&
      Math.abs(tx - x) <= RAINBOW_BEAM.rangePx;
    const damage = RAINBOW_BEAM.damage * buffDamageMul(hooks.buff());
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (inCorridor(enemy.x, enemy.y)) hooks.enemies().damage(child, damage);
    }
    if (hooks.boss().isActive()) {
      for (const body of hooks.bossBodies()) {
        if (!(body.body as Phaser.Physics.Arcade.Body).enable) continue;
        if (inCorridor(body.x, body.y)) hooks.damageBossAt(damage, body.x, body.y, 'star');
      }
    }
  }

  // 引力化引力井（§119）：面向側定點初爆輕傷＋滯留週期牽引（壽命有界必回收）。
  function resolveGravityWell(x: number, y: number, facing: 1 | -1): void {
    const wellX = x + facing * GRAVITY_WELL.offsetPx;
    // 引力井初爆（§124 W5a）：井心引力爆點；素材缺載沿圓域描邊保底。
    flashSprite(scene, 'fx-star-gravity-explosion', wellX, y, GRAVITY_WELL.radiusPx * 1.5, {
      durationMs: 300,
      depth: 60,
    });
    const well = scene.add
      .circle(wellX, y, GRAVITY_WELL.radiusPx, TRANSFORM_FORMS.gravity.tint, 0.12)
      .setStrokeStyle(3, TRANSFORM_FORMS.gravity.tint, 0.85)
      .setDepth(59)
      .setScale(0.3);
    scene.tweens.add({ targets: well, scale: 1, duration: 200, ease: 'Quad.easeOut' });
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (!child.active) continue;
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (distanceBetween(wellX, y, enemy.x, enemy.y) <= GRAVITY_WELL.radiusPx) {
        hooks.enemies().damage(child, GRAVITY_WELL.damage);
      }
    }
    let ticksLeft = GRAVITY_WELL.ticks;
    const timer = scene.time.addEvent({
      delay: GRAVITY_WELL.tickMs,
      repeat: GRAVITY_WELL.ticks - 1,
      callback: () => {
        ticksLeft -= 1;
        for (const child of hooks.enemies().getGroup().getChildren()) {
          if (!child.active) continue;
          const enemy = child as Phaser.Physics.Arcade.Sprite;
          if (distanceBetween(wellX, y, enemy.x, enemy.y) > GRAVITY_WELL.radiusPx) continue;
          const dx = wellX - enemy.x;
          const dy = y - enemy.y;
          const dist = Math.hypot(dx, dy) || 1;
          enemy.setVelocity(
            (dx / dist) * GRAVITY_WELL.pullSpeed,
            (dy / dist) * GRAVITY_WELL.pullSpeed,
          );
        }
        if (ticksLeft <= 0) {
          timer.remove();
          // 井收束爆點（§124 W5a）：滯留期滿的內縮回饋。
          flashSprite(scene, 'fx-star-gravity-hit', wellX, y, 56, {
            durationMs: 220,
            depth: 60,
            fromScale: 1.6,
          });
          scene.tweens.add({
            targets: well,
            alpha: 0,
            scale: 0.4,
            duration: 200,
            onComplete: () => well.destroy(),
          });
        }
      },
    });
  }

  // 形態技路由（§119）：kind 窮舉分派，GameScene 零 if/else 常駐。
  function resolveTransformStrike(
    kind: TransformStrikeKind,
    x: number,
    y: number,
    facing: 1 | -1,
  ): void {
    switch (kind) {
      case 'volt-beam':
        resolveVoltBeam(x, y, facing);
        break;
      case 'volt-discharge':
        resolveVoltDischarge(x, y);
        break;
      case 'gale-landing':
        resolveGaleLanding(x, y);
        break;
      case 'magma-pop':
        resolveMagmaPop(x, y);
        break;
      case 'tide-pull':
        resolveTidePull(x, y, facing);
        break;
      case 'rainbow-beam':
        resolveRainbowBeam(x, y, facing);
        break;
      case 'gravity-well':
        resolveGravityWell(x, y, facing);
        break;
      default: {
        const exhaustive: never = kind;
        void exhaustive;
      }
    }
  }

  return {
    mixOf,
    specOf,
    damageOf,
    playerFormSpec,
    slamRadiusPx,
    explodeStar,
    chainLightning,
    freezeField,
    resolveStarstorm,
    resolveSlamImpact,
    resolveShieldCounter,
    resolveVoltBeam,
    resolveVoltDischarge,
    resolveGaleLanding,
    resolveTransformStrike,
  };
}
