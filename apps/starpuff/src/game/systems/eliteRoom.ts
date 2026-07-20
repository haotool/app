import type Phaser from 'phaser';
import type { EliteSpec } from '../logic/levels';
import { clampEliteX } from '../logic/stageModel';
import { playSfx } from '../audio/sfx';
import type { EnemySystem } from './enemies';
import type { FxSystem } from './fx';
import { spawnHealPickup } from './pickups';
import type { PlayerHandle } from './player';

// 中魔王精英房（GAME_DESIGN §48）：武裝/軟鎖門/血條/箝制/掉落/逾時全流程；
// GameScene 只留建構委派與逐幀 update 呼叫。

const ELITE_ARM_DISTANCE_PX = 480;
const ELITE_DOOR_TIMEOUT_MS = 60_000;
const ELITE_DOOR_W = 26;
const ELITE_DOOR_OFFSET_PX = 300;
// 房界內縮（§48）：右界留精英半身＋門柱寬，箝制點不與門柱重疊。
const ELITE_ROOM_INSET_PX = 48;
// 回復食物（§48 精英掉落）：拾取回復 2 HP（上限依當前 hpCap）。
const HEAL_FOOD_HP = 2;

// hooks 以閉包延遲解析：player/enemies/fx 於 GameScene create 後續建立。
export interface EliteRoomHooks {
  player(): PlayerHandle;
  enemies(): EnemySystem;
  fx(): FxSystem;
  playerHp(): number;
  gateOpen(): boolean;
}

export interface EliteRoomHandle {
  update(): void;
  // e2e 觀測點（§48）：精英房狀態與軟鎖門位置。
  state(): { armed: boolean; done: boolean; doorX: number | null };
  // e2e 鉤子（§48）：以正式傷害管線秒殺場上精英。
  slay(): void;
}

export function createEliteRoom(
  scene: Phaser.Scene,
  spec: EliteSpec | null,
  groundTop: number,
  hooks: EliteRoomHooks,
): EliteRoomHandle {
  let armed = false;
  let done = false;
  let eliteRef: Phaser.Physics.Arcade.Sprite | null = null;
  let door: Phaser.GameObjects.Rectangle | null = null;
  let doorCollider: Phaser.Physics.Arcade.Collider | null = null;
  let timer: Phaser.Time.TimerEvent | null = null;
  let bar: Phaser.GameObjects.Graphics | null = null;
  let hint: Phaser.GameObjects.Text | null = null;

  function arm(): void {
    if (!spec) return;
    armed = true;
    eliteRef = hooks.enemies().spawnElite(spec.kind, spec.x, groundTop - 40, {
      hp: spec.hp,
      scale: spec.scale,
      tint: spec.tint,
      speedMul: spec.speedMul,
    });
    if (!eliteRef) {
      done = true;
      return;
    }
    playSfx('boss-roar');
    hooks.fx().shake(6);
    // 軟鎖門：果凍色半透明門柱擋前進；可退不可進，擊敗或逾時開門。
    const doorX = spec.x + ELITE_DOOR_OFFSET_PX;
    door = scene.add
      .rectangle(doorX, groundTop / 2, ELITE_DOOR_W, groundTop, 0xff9ec4, 0.45)
      .setStrokeStyle(3, 0xffffff, 0.8)
      .setDepth(70);
    scene.physics.add.existing(door, true);
    doorCollider = scene.physics.add.collider(hooks.player().sprite, door);
    scene.tweens.add({
      targets: door,
      alpha: { from: 0.45, to: 0.7 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    bar = scene.add.graphics().setDepth(71);
    // 卡住感消解（§105 F-05）：門柱旁明示破關條件與 60s 保險——等待也是合法出路，
    // 新手不再誤判軟鎖為卡關；世界座標隨房間入鏡即見。
    hint = scene.add
      .text(doorX - ELITE_DOOR_W - 6, 118, '擊敗精英開門\n60 秒後自動開啟', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3a3a4a',
        strokeThickness: 4,
        align: 'right',
      })
      .setOrigin(1, 0.5)
      .setDepth(71)
      .setAlpha(0);
    scene.tweens.add({ targets: hint, alpha: 0.95, duration: 450, delay: 250 });
    // 逾時保險（§48 反卡關）：60s 未擊敗自動開門，精英留場可略過。
    timer = scene.time.delayedCall(ELITE_DOOR_TIMEOUT_MS, () => openDoor());
  }

  function updateBar(): void {
    if (!bar) return;
    bar.clear();
    if (!eliteRef || !eliteRef.active || !spec) return;
    const ratio = Math.max(0, (eliteRef.getData('hp') as number) / spec.hp);
    const w = 56;
    const x = eliteRef.x - w / 2;
    const y = eliteRef.y - 52;
    bar.fillStyle(0x3a3a4a, 0.6);
    bar.fillRect(x - 1.5, y - 1.5, w + 3, 8);
    bar.fillStyle(0xd94b4b, 1);
    bar.fillRect(x, y, w * ratio, 5);
  }

  // 開門：淡出門柱與提示並解除碰撞；擊敗與逾時共用單一出口。
  function openDoor(): void {
    timer?.remove();
    timer = null;
    doorCollider?.destroy();
    doorCollider = null;
    const closingHint = hint;
    hint = null;
    if (closingHint) {
      scene.tweens.killTweensOf(closingHint);
      scene.tweens.add({
        targets: closingHint,
        alpha: 0,
        duration: 350,
        onComplete: () => closingHint.destroy(),
      });
    }
    const closing = door;
    door = null;
    if (closing) {
      scene.tweens.killTweensOf(closing);
      hooks.fx().burstSmall(closing.x, groundTop - 60, 0xff9ec4);
      scene.tweens.add({
        targets: closing,
        alpha: 0,
        scaleY: 0.1,
        duration: 350,
        ease: 'Quad.easeIn',
        onComplete: () => closing.destroy(),
      });
    }
  }

  // 精英擊敗（§48）：開門 + 掉落稀有味小怪與回復食物。
  function resolveDefeat(): void {
    if (done) return;
    done = true;
    eliteRef = null;
    bar?.destroy();
    bar = null;
    openDoor();
    if (!spec) return;
    playSfx('jingle');
    hooks.fx().starBurst(spec.x, groundTop - 80);
    // 稀有味掉落：正式 spawn 管線，吞下即得稀有星味。
    hooks.enemies().spawn(spec.rewardFlavor, spec.x - 60, groundTop - 120);
    // 回復食物：共用愛心拾取管線（§48/§62 單一實作），觸碰回復 2 HP。
    spawnHealPickup(
      scene,
      spec.x + 60,
      groundTop - 100,
      { player: () => hooks.player(), playerHp: () => hooks.playerHp() },
      { healHp: HEAL_FOOD_HP },
    );
  }

  return {
    // 接近武裝——生成精英與軟鎖門；開門（fillQuota/配額達成）後不再武裝：
    // 關卡已進尾端 release 節奏。
    update() {
      if (!spec || done) return;
      if (!armed) {
        if (hooks.gateOpen()) return;
        if (hooks.player().sprite.x < spec.x - ELITE_ARM_DISTANCE_PX) return;
        arm();
        return;
      }
      updateBar();
      // 房界箝制（§48 審查修復）：精英不出房追殺——越界回夾反向，60s 開門保險恆有效。
      if (eliteRef?.active) {
        const body = eliteRef.body as Phaser.Physics.Arcade.Body;
        const clamped = clampEliteX(
          eliteRef.x,
          body.velocity.x,
          spec.x - ELITE_DOOR_OFFSET_PX,
          spec.x + ELITE_DOOR_OFFSET_PX - ELITE_ROOM_INSET_PX,
        );
        if (clamped.x !== eliteRef.x) {
          eliteRef.setX(clamped.x);
          body.setVelocityX(clamped.velocityX);
        }
      }
      // 擊敗偵測：精英為不可吸個體，active 熄滅即為擊殺。
      if (eliteRef && !eliteRef.active) resolveDefeat();
    },
    state() {
      return { armed, done, doorX: door?.x ?? null };
    },
    slay() {
      if (eliteRef?.active) hooks.enemies().damage(eliteRef, 999);
    },
  };
}
