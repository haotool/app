import type Phaser from 'phaser';
import { VIEW } from '../core/config';
import type { EnemyKind } from '../core/types';
import { BUFF_SPECS, type BuffId, type BuffState } from '../logic/buffs';
import type { LevelSpec } from '../logic/levels';
import { playSfx } from '../audio/sfx';
import { burstSmall } from './fx';
import { spawnHealPickup } from './pickups';
import type { PlayerHandle } from './player';

// 魔王關前室體系（GAME_DESIGN §69）：400px 補給廊道 prefab——tier-2 愛心＋可吸補給怪 ×3
// ＋增益二選一台座＋入 arena 單向門；arena 高風險位增益投放與 buff HUD 倒數環亦收斂於此。
// 禁止門口全滿血（P-65）：前室恢復上限 tier-2（+2 HP）。

const GROUND_TOP = VIEW.height - 80;
const DOOR_W = 26;
// 進 arena 判定緣：越過前室右緣一小段即鎖門（重試自前室起）。
const ENTER_MARGIN_PX = 34;
const HEART_X = 120;
// 補給怪落於廊道前段（入口反應帶之外、台座拾取帶 224+ 之前）：朝玩家走來即吸食
// 補彈節奏，台座帶保持乾淨——甫拾護盾不被補給怪觸碰瞬間打破。
const SUPPLY_XS = [140, 180, 215] as const;
const PEDESTAL_XS = [250, 330] as const;
// 拾取帶（§43 幾何判定慣例）：縱向放寬至 ±36——台座 icon 與站立頭頂帶交疊裕度 ≥18px，
// 杜絕低幀率下 bob 相位造成的間歇漏拾。
const PICKUP_HALF_W = 26;
const PICKUP_HALF_H = 36;
// arena 高風險位投放（§69）：10s 未拾自動淡逝；EX 刷新減半（v10＝EX 不投放）。
const ARENA_BUFF_EXPIRE_MS = 10_000;
const BUFF_TEXTURES: Record<BuffId, string> = {
  shield: 'buff-shield',
  power: 'buff-power',
  swift: 'buff-swift',
};

// 增益圖示紋理（禁 emoji/文字鍵帽）：護盾泡＝雙圈泡殼、星力果＝五角星、疾風靴＝雙風痕。
function ensureBuffTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(BUFF_TEXTURES.shield)) {
    const g = scene.add.graphics();
    g.lineStyle(3, 0xffffff, 1);
    g.strokeCircle(14, 14, 11);
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeCircle(14, 14, 6.5);
    g.generateTexture(BUFF_TEXTURES.shield, 28, 28);
    g.destroy();
  }
  if (!scene.textures.exists(BUFF_TEXTURES.power)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    const cx = 14;
    const cy = 14;
    const outer = 12;
    const inner = 5;
    g.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (Math.PI * i) / 5;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.generateTexture(BUFF_TEXTURES.power, 28, 28);
    g.destroy();
  }
  if (!scene.textures.exists(BUFF_TEXTURES.swift)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(4, 6, 15, 14, 4, 22);
    g.fillStyle(0xffffff, 0.7);
    g.fillTriangle(13, 6, 24, 14, 13, 22);
    g.generateTexture(BUFF_TEXTURES.swift, 28, 28);
    g.destroy();
  }
}

export interface BossRoomHooks {
  player(): PlayerHandle;
  playerHp(): number;
  spawnSupply(kind: EnemyKind, x: number, y: number): void;
  onPickBuff(id: BuffId): void;
  // 進 arena 單向門鎖閉當幀觸發一次：GameScene 據此停跟隨、對齊相機並啟動魔王入場。
  onEnterArena(): void;
}

export interface BossRoomHandle {
  update(): void;
  entered(): boolean;
  // arena 高風險位增益投放（§69 P2/P3）：世界座標；10s 未拾自動淡逝。
  dropArenaBuff(id: BuffId, x: number, y: number): void;
  // buff HUD 倒數環（§69 規則 1：單一 icon＋倒數環，不加新面板）；GameScene 逐幀委派。
  updateBuffHud(state: BuffState): void;
  destroy(): void;
}

interface FloatingBuff {
  id: BuffId;
  icon: Phaser.GameObjects.Image;
  halo: Phaser.GameObjects.Arc;
  prevPlayerX: number | null;
  expireAt: number | null;
  // 台座拾取＝二選一：拾取任一即消滅整組。
  group: FloatingBuff[];
}

export function createBossRoom(
  scene: Phaser.Scene,
  level: LevelSpec,
  hooks: BossRoomHooks,
): BossRoomHandle {
  ensureBuffTextures(scene);
  const anteroomPx = level.anteroomPx ?? 0;
  const objects: Phaser.GameObjects.GameObject[] = [];
  const floats: FloatingBuff[] = [];
  let entered = false;
  let destroyed = false;

  // 廊道地貌：淡色地帶區隔＋門柱預示框（未鎖閉前半透明提示單向性）。
  const corridorTint = scene.add
    .rectangle(anteroomPx / 2, VIEW.height / 2, anteroomPx, VIEW.height, 0x4a3a78, 0.1)
    .setDepth(-6);
  objects.push(corridorTint);

  // tier-2 愛心（§69 固定配置）：+2 HP，走共用愛心拾取管線。
  spawnHealPickup(
    scene,
    HEART_X,
    GROUND_TOP - 46,
    { player: () => hooks.player(), playerHp: () => hooks.playerHp() },
    { healHp: 2 },
  );

  // 可吸補給怪 ×3（進場即可滿匣）：取補給混編前三種，走正式 spawn 管線。
  const kinds: EnemyKind[] = level.enemyMix.map((entry) => entry.kind);
  SUPPLY_XS.forEach((x, index) => {
    hooks.spawnSupply(kinds[index % kinds.length] ?? 'jelly', x, GROUND_TOP - 60);
  });

  function spawnFloatingBuff(
    id: BuffId,
    x: number,
    y: number,
    group: FloatingBuff[],
    expireAt: number | null,
  ): void {
    const spec = BUFF_SPECS[id];
    const halo = scene.add.circle(x, y, 20, spec.tint, 0.22).setDepth(71);
    const icon = scene.add
      .image(x, y, BUFF_TEXTURES[id])
      .setTint(spec.tint)
      .setDepth(72)
      .setDisplaySize(28, 28);
    scene.tweens.add({
      targets: [icon, halo],
      y: y - 10,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    objects.push(icon, halo);
    const entry: FloatingBuff = { id, icon, halo, prevPlayerX: null, expireAt, group };
    group.push(entry);
    floats.push(entry);
  }

  // 增益二選一台座（§69）：取一消一的風險回報抉擇；icon 貼台頂（站立頭頂帶內）。
  const pedestalPair: FloatingBuff[] = [];
  (level.anteroomBuffs ?? []).forEach((id, index) => {
    const x = PEDESTAL_XS[index] ?? 250 + index * 80;
    const pillar = scene.add
      .rectangle(x, GROUND_TOP - 20, 34, 40, 0xd8d0f0, 0.9)
      .setStrokeStyle(3, 0xffffff, 0.85)
      .setDepth(70);
    objects.push(pillar);
    spawnFloatingBuff(id, x, GROUND_TOP - 46, pedestalPair, null);
  });

  function removeFloat(entry: FloatingBuff): void {
    entry.icon.destroy();
    entry.halo.destroy();
    const index = floats.indexOf(entry);
    if (index >= 0) floats.splice(index, 1);
  }

  function collect(entry: FloatingBuff): void {
    playSfx('jingle');
    burstSmall(scene, entry.icon.x, entry.icon.y, BUFF_SPECS[entry.id].tint);
    hooks.onPickBuff(entry.id);
    // 取一消一：同組台座全數收攤；arena 投放為單體組。
    for (const sibling of [...entry.group]) removeFloat(sibling);
    entry.group.length = 0;
  }

  // 拾取判定沿 §43 幾何掃掠慣例：AABB 交疊或前後幀水平掃掠跨越，高速走過必中。
  function sweepFloat(entry: FloatingBuff, body: Phaser.Physics.Arcade.Body): boolean {
    const left = entry.icon.x - PICKUP_HALF_W;
    const right = entry.icon.x + PICKUP_HALF_W;
    const top = entry.icon.y - PICKUP_HALF_H;
    const bottom = entry.icon.y + PICKUP_HALF_H;
    const currX = body.center.x;
    const prevX = entry.prevPlayerX ?? currX;
    entry.prevPlayerX = currX;
    if (!(body.bottom > top && body.top < bottom)) return false;
    const aabb = body.right > left && body.left < right;
    const swept = Math.min(prevX, currX) <= right && Math.max(prevX, currX) >= left;
    return aabb || swept;
  }

  // 單向門（§69）：入 arena 後鎖閉，重試自前室起；擊破制無門鎖（§10.2-10 僅指 arena 出口）。
  function lockDoor(): void {
    entered = true;
    const door = scene.add
      .rectangle(anteroomPx - DOOR_W / 2, GROUND_TOP / 2, DOOR_W, GROUND_TOP, 0xc5a8e8, 0.5)
      .setStrokeStyle(3, 0xffffff, 0.85)
      .setDepth(70);
    scene.physics.add.existing(door, true);
    scene.physics.add.collider(hooks.player().sprite, door);
    scene.tweens.add({
      targets: door,
      alpha: { from: 0.5, to: 0.72 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    objects.push(door);
    playSfx('break');
    burstSmall(scene, anteroomPx, GROUND_TOP - 80, 0xc5a8e8);
    hooks.onEnterArena();
  }

  // buff HUD（§69）：左上彈藥列下方單一 icon＋倒數環。
  const hudIcon = scene.add
    .image(24, 94, BUFF_TEXTURES.shield)
    .setScrollFactor(0)
    .setDepth(101)
    .setVisible(false);
  const hudRing = scene.add.graphics().setScrollFactor(0).setDepth(101);
  objects.push(hudIcon, hudRing);

  // 深度 QA 觀測點：拾取判定分量（DEV/test 限定）。
  if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    (
      window as unknown as { __spBossRoom?: { floats(): number[][]; probe(): number[] } }
    ).__spBossRoom = {
      floats: () => floats.map((entry) => [Math.round(entry.icon.x), Math.round(entry.icon.y)]),
      probe: () => {
        const body = hooks.player().sprite.body as Phaser.Physics.Arcade.Body;
        return [
          Math.round(body.left),
          Math.round(body.right),
          Math.round(body.top),
          Math.round(body.bottom),
        ];
      },
    };
  }

  return {
    update() {
      if (destroyed) return;
      const body = hooks.player().sprite.body as Phaser.Physics.Arcade.Body;
      if (!entered && hooks.player().sprite.x >= anteroomPx + ENTER_MARGIN_PX) lockDoor();
      for (const entry of [...floats]) {
        if (entry.expireAt !== null && scene.time.now >= entry.expireAt) {
          removeFloat(entry);
          continue;
        }
        if (sweepFloat(entry, body)) {
          collect(entry);
          break;
        }
      }
    },
    entered() {
      return entered;
    },
    dropArenaBuff(id: BuffId, x: number, y: number) {
      if (destroyed) return;
      playSfx('reveal');
      burstSmall(scene, x, y, BUFF_SPECS[id].tint);
      spawnFloatingBuff(id, x, y, [], scene.time.now + ARENA_BUFF_EXPIRE_MS);
    },
    updateBuffHud(state: BuffState) {
      if (destroyed) return;
      hudRing.clear();
      if (state.id === null) {
        hudIcon.setVisible(false);
        return;
      }
      const spec = BUFF_SPECS[state.id];
      hudIcon.setVisible(true).setTexture(BUFF_TEXTURES[state.id]).setTint(spec.tint);
      const ratio = Math.max(0, Math.min(1, state.remainingMs / spec.durationMs));
      hudRing.lineStyle(3, spec.tint, 0.95);
      hudRing.beginPath();
      hudRing.arc(24, 94, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      hudRing.strokePath();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      objects.forEach((obj) => obj.destroy());
      objects.length = 0;
      floats.length = 0;
    },
  };
}
