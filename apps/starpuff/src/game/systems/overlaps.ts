import type Phaser from 'phaser';
import { ENEMY, INHALE } from '../core/config';
import {
  inhaleGraceUntil,
  inhalePullSpeed,
  inhaleRangePx,
  isContactHarmless,
  isInInhalePullRange,
  isInInhaleRange,
} from '../logic/combat';
import { SHELL_CHARGE, SHELL_REFLECT, TRANSFORM_FORMS } from '../logic/transform';
import type { BossDamageSource, BossHandle } from './boss';
import type { EnemySystem } from './enemies';
import type { FxSystem } from './fx';
import type { MeteorSystem } from './meteor';
import type { PlayerHandle } from './player';
import type { StageHandle } from './stage';
import type { StarCombat } from './starCombat';
import { playSfx } from '../audio/sfx';

// 戰鬥 overlap/collider 接線（GAME_DESIGN §29/§58/§68/§79）：星彈/觸碰/危險物/
// 彈幕/隕星/平台元素的碰撞結算集中於此；GameScene create 單點委派。
// 接線順序凍結：同幀多重結算次序與抽取前完全一致，不得重排。

const asSprite = (obj: unknown): Phaser.Physics.Arcade.Sprite =>
  obj as Phaser.Physics.Arcade.Sprite;

export interface CombatOverlapHooks {
  player(): PlayerHandle;
  enemies(): EnemySystem;
  boss(): BossHandle;
  fx(): FxSystem;
  meteor(): MeteorSystem | null;
  stage(): StageHandle;
  combat(): StarCombat;
  // 多本體工具（§68）與受擊單一入口由 GameScene 持有。
  bossBodies(): Phaser.Physics.Arcade.Sprite[];
  nearestBossBody(x: number, y: number): Phaser.Physics.Arcade.Sprite;
  bossTouchDamage(): number;
  damagePlayer(damage: number, sourceX: number): void;
  damageBossAt(amount: number, x: number, y: number, source?: BossDamageSource): void;
  // 焦糖化（§5 Syrona W2）：帶 caramel 旗標的糖漿波沾身時套用減速（GameScene 單一真值）。
  applyCaramel(): void;
  // 勝敗轉場窗（finished || transitioning）：期間傷害結算靜默。
  isSettled(): boolean;
  isBossDown(): boolean;
  now(): number;
}

// 吸入拉近結算（§30/§77/#811）：zone overlap 僅標記候選，錐形收斂、吞下與拉力集中於此。
// 自 GameScene 抽出（1200 行閘）；殼殼暈眩窗半徑/引力強化由 logic/combat.ts 單點供給。
const SWALLOW_RANGE_PX = 46;
const PULL_BASE_SPEED = 160;
const PULL_GAIN = 2.2;
const REPEL_SPEED = 260;
const REPEL_LIFT = -180;

export function applyInhalePull(
  scene: Phaser.Scene,
  player: PlayerHandle,
  enemies: EnemySystem,
  mouth: { x: number; y: number },
): void {
  for (const child of enemies.getGroup().getChildren()) {
    const enemy = asSprite(child);
    if (!enemy.getData('inhalePull')) continue;
    enemy.setData('inhalePull', false);
    const kind = enemies.kindOf(enemy);
    if (!kind || !player.isInhaling()) continue;
    const { x, y } = player.sprite;
    const facing = player.getFacing();
    // 錐形收斂＋殼殼近身豁免（#811）：貼腳停位不再是吸不到死角。
    if (
      !isInInhalePullRange(
        kind,
        x,
        y,
        facing,
        enemy.x,
        enemy.y,
        inhaleRangePx(kind, INHALE.rangePx),
      )
    ) {
      continue;
    }
    if (!enemies.isInhalable(enemy)) {
      // 旋轉衝刺中的殼殼為無敵段、半入地 drilly（§47）不受吸力彈開；其餘照舊彈開。
      if (enemy.getData('state') !== 'spin' && !enemies.isPhasedOut(enemy)) {
        enemy.setVelocity(REPEL_SPEED * facing, REPEL_LIFT);
      }
      continue;
    }
    const dist = Math.hypot(enemy.x - mouth.x, enemy.y - mouth.y);
    if (dist <= SWALLOW_RANGE_PX) {
      enemies.removeInhaled(enemy);
      player.swallow(kind);
      continue;
    }
    // 拉力漸增：越接近嘴邊吸力越強（#811 殼殼暈眩窗引力 ×1.5）。
    // 吸入接觸豁免（§77）：拉力逐幀刷新豁免窗，被吸入中的怪貼身零傷害。
    enemy.setData('inhaleGraceUntil', inhaleGraceUntil(scene.time.now));
    scene.physics.moveTo(
      enemy,
      mouth.x,
      mouth.y,
      inhalePullSpeed(kind, INHALE.rangePx, dist, PULL_BASE_SPEED, PULL_GAIN),
    );
  }
}

export function wireCombatOverlaps(scene: Phaser.Scene, hooks: CombatOverlapHooks): void {
  const stars = hooks.player().getStars();

  scene.physics.add.overlap(stars, hooks.enemies().getGroup(), (star, enemy) => {
    const target = enemy as Phaser.GameObjects.GameObject;
    const s = asSprite(star);
    if (!s.active || !hooks.enemies().kindOf(target)) return;
    // 磁場星彈免傷（§59 magno field）：星彈吸附於磁殼失效，近戰/下砸路徑不受影響。
    if (hooks.enemies().isStarImmune(target)) {
      hooks.fx().burstSmall(s.x, s.y, 0x8ab0e8);
      playSfx('metal', 0.7);
      hooks.player().onStarHit(s, 'absorb');
      return;
    }
    // 鏡面反射（§59 mirri mirror）：星彈改生成朝玩家的反射彈（反射彈有傷害）。
    if (hooks.enemies().isReflective(target)) {
      const mirri = asSprite(enemy);
      const playerSprite = hooks.player().sprite;
      hooks.enemies().reflectStar(mirri.x, mirri.y, playerSprite.x, playerSprite.y);
      hooks.fx().burstSmall(s.x, s.y, 0xf0f4ff);
      hooks.player().onStarHit(s, 'absorb');
      return;
    }
    const spec = hooks.combat().specOf(s);
    const outcome = hooks.enemies().damage(target, hooks.combat().damageOf(s));
    if (outcome === 'ignored') return;
    if (spec.aoeRadiusPx > 0) hooks.combat().explodeStar(s.x, s.y, spec, target);
    // 雷鏈星（§40）：命中後跳電至半徑內最近敵，主目標排除。
    if (spec.chainCount > 0) hooks.combat().chainLightning(s.x, s.y, spec, target);
    // 孢子星（§53）：命中未死目標套緩速＋輕持續傷。
    if (spec.slowMs > 0 && outcome === 'hurt') {
      hooks.enemies().applySlow(target, spec.slowMs, spec.dotDamage);
    }
    // 凝光星（§46）：命中處生成凍結光域。
    const mix = hooks.combat().mixOf(s);
    if (mix && mix.freezeRadiusPx > 0) hooks.combat().freezeField(s.x, s.y, mix);
    // 未死目標（chompy 扣血）吃掉星彈；擊殺則依穿透續飛。
    // 迴旋星（§53）：命中不吸收——依穿透結算，保留回程判定。
    hooks.player().onStarHit(s, outcome === 'killed' || spec.boomerang ? 'pierce' : 'absorb');
  });

  // group vs sprite 的回調參數順序不保證，取非魔王側為星彈。
  // 入場動畫與死亡演出期間（非 active）星彈直接穿過，不消耗。
  // 多本體（§68）：逐本體接線，受擊側由 damageBossAt 依命中位置歸屬。
  for (const hitBody of hooks.bossBodies()) {
    scene.physics.add.overlap(stars, hitBody, (a, b) => {
      const star = asSprite((a as unknown) === (hitBody as unknown) ? b : a);
      if (!star.active || !hooks.boss().isActive()) return;
      if (!(hitBody.body as Phaser.Physics.Arcade.Body).enable) return;
      const spec = hooks.combat().specOf(star);
      if (spec.aoeRadiusPx > 0) hooks.combat().explodeStar(star.x, star.y, spec, null);
      // 雷鏈星命中魔王同樣跳電波及補給小怪（§40 群戰原型）。
      if (spec.chainCount > 0) hooks.combat().chainLightning(star.x, star.y, spec, null);
      const mix = hooks.combat().mixOf(star);
      if (mix && mix.freezeRadiusPx > 0) hooks.combat().freezeField(star.x, star.y, mix);
      hooks.player().onStarHit(star, 'absorb');
      hooks.damageBossAt(hooks.combat().damageOf(star), star.x, star.y);
    });
  }

  // 碎晶盾（§68 P3）：可擊破的星彈屏障——星彈被吸收、盾即碎裂。
  const shields = hooks.boss().getShields?.();
  if (shields) {
    scene.physics.add.overlap(stars, shields, (a, b) => {
      const isShield = (shields.getChildren() as unknown[]).includes(a);
      const shard = asSprite(isShield ? a : b);
      const star = asSprite(isShield ? b : a);
      if (!star.active || !shard.active) return;
      shard.disableBody(true, true);
      hooks.fx().burstSmall(shard.x, shard.y, 0xe8dcff);
      playSfx('break', 0.7);
      hooks.player().onStarHit(star, 'absorb');
    });
  }

  // 新怪危險物：puffy 爆刺彈與 chompy 咬合 hitbox（傷害 1，命中即失效）。
  // zappy 放電環（§30）同走此 hazards 管線結算，不另設 overlap。
  scene.physics.add.overlap(hooks.player().sprite, hooks.enemies().getHazards(), (_p, hz) => {
    const hazard = asSprite(hz);
    if (!hazard.active || hooks.isSettled()) return;
    hazard.disableBody(true, true);
    hooks.damagePlayer(ENEMY.touchDamage, hazard.x);
  });

  scene.physics.add.overlap(hooks.player().sprite, hooks.enemies().getGroup(), (_p, enemy) => {
    const kind = hooks.enemies().kindOf(enemy as Phaser.GameObjects.GameObject);
    if (!kind || hooks.isSettled()) return;
    // 半入地無害態（§47 drilly 潛地/前搖）：不結算觸碰傷害。
    if (hooks.enemies().isPhasedOut(enemy as Phaser.GameObjects.GameObject)) return;
    const target = asSprite(enemy);
    // 雷化帶電體（§57）：接觸對小怪放電（damage CD 節流），玩家觸碰傷害照常結算。
    // 滾殼衝撞（§110）：衝撞期接觸改判向小怪結算衝撞傷，同走本通道。
    const charging = hooks.player().isShellCharging();
    const contactDamage = charging
      ? SHELL_CHARGE.damage
      : (hooks.combat().playerFormSpec()?.contactDamage ?? 0);
    if (contactDamage > 0) {
      const zapped = hooks.enemies().damage(enemy as Phaser.GameObjects.GameObject, contactDamage);
      if (zapped !== 'ignored') {
        const tint = charging ? TRANSFORM_FORMS.shell.tint : TRANSFORM_FORMS.volt.tint;
        hooks.fx().burstSmall(target.x, target.y, tint);
      }
      if (zapped === 'killed') return;
    }
    // 吸入錐形內的可吸怪（§30：shelly 僅暈眩窗）交由吞下流程，不結算觸碰傷害。
    const { x, y } = hooks.player().sprite;
    if (
      hooks.player().isInhaling() &&
      hooks.enemies().isInhalable(enemy as Phaser.GameObjects.GameObject) &&
      isInInhaleRange(x, y, hooks.player().getFacing(), target.x, target.y, INHALE.rangePx)
    ) {
      return;
    }
    // 吸入接觸豁免（§77）：被吸入中（拉力豁免窗內）的怪貼身不傷——涵蓋轉向/
    // 鬆開瞬間與出錐殘餘飛行；窗過期即恢復傷害性，未被吸的其他怪照常結算。
    if (isContactHarmless(hooks.now(), (target.getData('inhaleGraceUntil') as number) ?? 0)) {
      return;
    }
    hooks.damagePlayer(ENEMY.touchDamage, target.x);
  });

  scene.physics.add.overlap(
    hooks.player().getInhaleZone(),
    hooks.enemies().getGroup(),
    (_z, enemy) => {
      asSprite(enemy).setData('inhalePull', true);
    },
  );

  // 觸碰與頭頂 hit window（§58/§68）：多本體逐一接線，停用本體不結算；
  // 入場運鏡期（非 active）傷害雙向靜默——降落中的魔王不得對走位玩家先手。
  for (const touchBody of hooks.bossBodies()) {
    scene.physics.add.overlap(hooks.player().sprite, touchBody, () => {
      if (hooks.isSettled() || hooks.isBossDown()) return;
      if (!hooks.boss().isActive()) return;
      if (!(touchBody.body as Phaser.Physics.Arcade.Body).enable) return;
      const playerBody = hooks.player().sprite.body as Phaser.Physics.Arcade.Body;
      // 魔王頭頂 hit window（§58）：下砸命中上半身＝頭頂——嘗試觸發暈眩並回彈，免體傷。
      if (hooks.player().isSlamming() && playerBody.bottom <= touchBody.y) {
        const stunned = hooks.boss().trySlamStun();
        hooks.player().onSlamBounce();
        hooks.fx().burstSmall(hooks.player().sprite.x, playerBody.bottom, 0xffd966);
        if (stunned) hooks.fx().shake(8);
        return;
      }
      hooks.damagePlayer(hooks.bossTouchDamage(), touchBody.x);
    });
  }

  scene.physics.add.overlap(hooks.player().sprite, hooks.boss().getProjectiles(), (_p, ball) => {
    const projectile = asSprite(ball);
    if (!projectile.active || hooks.isSettled()) return;
    if (projectile.getData('reflected') === true) return;
    // 鏡界反射折返彈（§5 Prismix W2）：吸入中接觸即回收為彈藥（免費彈藥獎勵理解）。
    if (projectile.getData('inhalable') === true && hooks.player().isInhaling()) {
      projectile.disableBody(true, true);
      hooks.player().grantStar('jelly');
      playSfx('swallow');
      return;
    }
    // 殼化反彈（§57/§58）：彈幕不傷身，反向射回最近存活本體（§68 多本體）。
    if (hooks.combat().playerFormSpec()?.reflectProjectiles) {
      projectile.setData('reflected', true);
      projectile.setTint(TRANSFORM_FORMS.shell.tint);
      (projectile.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      const boss = hooks.nearestBossBody(projectile.x, projectile.y);
      scene.physics.moveTo(projectile, boss.x, boss.y, SHELL_REFLECT.speed);
      playSfx('metal');
      return;
    }
    projectile.disableBody(true, true);
    hooks.damagePlayer(hooks.bossTouchDamage(), projectile.x);
  });

  // 反彈彈幕回傷（§57/§58）：僅帶反彈標記的彈體對魔王結算（§68 多本體逐一接線）。
  for (const reflectBody of hooks.bossBodies()) {
    scene.physics.add.overlap(reflectBody, hooks.boss().getProjectiles(), (a, b) => {
      const projectile = asSprite((a as unknown) === (reflectBody as unknown) ? b : a);
      if (!projectile.active || projectile.getData('reflected') !== true) return;
      if (!hooks.boss().isActive() || !(reflectBody.body as Phaser.Physics.Arcade.Body).enable) {
        return;
      }
      projectile.disableBody(true, true);
      hooks.fx().burstSmall(projectile.x, projectile.y, TRANSFORM_FORMS.shell.tint);
      hooks.damageBossAt(SHELL_REFLECT.damage, projectile.x, projectile.y, 'reflect');
    });
  }

  scene.physics.add.overlap(hooks.player().sprite, hooks.boss().getShockwaves(), (_p, wave) => {
    const shockwave = asSprite(wave);
    if (!shockwave.active || hooks.isSettled()) return;
    // 焦糖化（§5 Syrona W2）：糖漿波沾身先套減速，傷害照常結算。
    if (shockwave.getData('caramel') === true) hooks.applyCaramel();
    hooks.damagePlayer(hooks.bossTouchDamage(), shockwave.x);
  });

  // 流星雨（§79）：隕星可被星彈擊碎（碎裂演出、星彈吸收）；隕星與餘燼命中玩家
  // 走 damagePlayer 單一入口（i-frame/護盾泡自然生效），隕星命中即碎。
  const meteor = hooks.meteor();
  if (meteor) {
    const meteorGroup = meteor.getMeteors();
    scene.physics.add.overlap(stars, meteorGroup, (a, b) => {
      const isRock = (meteorGroup.getChildren() as unknown[]).includes(a);
      const rock = asSprite(isRock ? a : b);
      const star = asSprite(isRock ? b : a);
      if (!star.active || !rock.active) return;
      hooks.meteor()?.shatter(rock);
      hooks.player().onStarHit(star, 'absorb');
    });
    scene.physics.add.overlap(hooks.player().sprite, meteorGroup, (_p, rock) => {
      const sprite = asSprite(rock);
      if (!sprite.active || hooks.isSettled()) return;
      hooks.meteor()?.shatter(sprite);
      hooks.damagePlayer(ENEMY.touchDamage, sprite.x);
    });
    scene.physics.add.overlap(hooks.player().sprite, meteor.getEmbers(), (_p, hz) => {
      const ember = asSprite(hz);
      if (!ember.active || hooks.isSettled()) return;
      ember.disableBody(true, true);
      hooks.damagePlayer(ENEMY.touchDamage, ember.x);
    });
  }

  // v4 平台元素（§29）：單向自上著地、移動平台載運、磚體實心；彈簧與破磚交由 stage 結算。
  scene.physics.add.collider(
    hooks.player().sprite,
    hooks.stage().getOneWay(),
    undefined,
    hooks.stage().canLandOneWay,
  );
  scene.physics.add.collider(hooks.player().sprite, hooks.stage().getMoving());
  scene.physics.add.collider(hooks.player().sprite, hooks.stage().getBreakables());
  scene.physics.add.overlap(
    hooks.player().sprite,
    hooks.stage().getSprings(),
    hooks.stage().onSpringOverlap,
  );
  scene.physics.add.overlap(stars, hooks.stage().getBreakables(), (a, b) => {
    const brick = (hooks.stage().getBreakables() as unknown[]).includes(a) ? a : b;
    const star = asSprite(brick === a ? b : a);
    if (!star.active) return;
    if (hooks.stage().breakBrick(brick as Phaser.GameObjects.GameObject)) {
      hooks.player().onStarHit(star, 'absorb');
    }
  });
}
