import type Phaser from 'phaser';
import { GRAVITY_Y, VIEW } from '../core/config';
import type { BossKind, EnemyKind } from '../core/types';
import { BOSS } from '../logic/bossFsm';
import { NOCTRA } from '../logic/noctraFsm';
import { PRISMIX } from '../logic/prismixFsm';
import { SYRONA } from '../logic/syronaFsm';
import { VOIDRA } from '../logic/voidraFsm';
import type { EggEvent } from '../logic/eggs';
import type { LevelSpec } from '../logic/levels';
import { MERCY_HEAL } from '../logic/mercyHeal';
import type { TideSpec } from '../logic/tide';
import { createBoss, type BossHandle } from './boss';
import { createNoctra } from './noctra';
import { createPrismix } from './prismix';
import { createSyrona } from './syrona';
import { createVoidra } from './voidra';
import type { EnemySystem } from './enemies';
import type { FxSystem } from './fx';
import type { MeteorSystem } from './meteor';
import { spawnHealPickup } from './pickups';
import type { PlayerHandle } from './player';
import type { TideHandle } from './tide';
import { playSfx } from '../audio/sfx';

// 魔王品種工廠與補給小怪（GAME_DESIGN §54）：BossKind 唯一分派點（呈現層 handle＋
// 體傷常數一次取齊）；GameScene 只留建構委派與 onMinionDrop 接線。

const SPAWN_EDGE_X = 48;
// 與 waves.ts 生成高度一致：飄飄鳥須在跳躍＋拍翅可達高度（橫式地面頂 y=400）。
const SPAWN_AIR_Y = 240;
const SPAWN_DROP_Y = 330;

// hooks 以閉包延遲解析：player/enemies/fx/tide/meteor 於 GameScene create 後續建立。
export interface BossFactoryHooks {
  exMode: boolean;
  arenaLeft(): number;
  worldWidth(): number;
  enemies(): EnemySystem;
  fx(): FxSystem;
  player(): PlayerHandle;
  playerHp(): number;
  tide(): TideHandle | null;
  // 場控潮汐（§74 Syrona）：換裝與沸騰沿 GameScene 單一潮汐管線。
  replaceTide(spec: TideSpec): void;
  meteor(): MeteorSystem | null;
  feedEggs(event: EggEvent): void;
}

export interface BossKit {
  handle: BossHandle;
  bodyDamage: number;
  // 魔王每損 10 HP 補生可吸小怪（onMinionDrop 接線）。
  spawnBossMinion(): void;
}

export function createBossKit(
  scene: Phaser.Scene,
  level: LevelSpec,
  groundTop: number,
  hooks: BossFactoryHooks,
): BossKit {
  let minionDropCount = 0;

  // 魔王每損 10 HP 補生可吸小怪（供彈藥），arena 左右邊緣交替入場；品種輪替讀關卡 enemyMix。
  // 場上上限（§82 審查根修）：爆發傷害連觸多次掉落時夾限累積（waves 上限 +2 供給裕度），
  // 防補給怪堆積形成接觸傷害牆；彈藥保證由飢荒立即補生承擔（§26）。
  function spawnBossMinion(): void {
    if (hooks.enemies().aliveCount() >= level.maxOnScreen + 2) return;
    const kinds = level.enemyMix.map((entry) => entry.kind);
    const kind = kinds[minionDropCount % kinds.length] ?? 'jelly';
    const x =
      minionDropCount % 2 === 0
        ? hooks.arenaLeft() + SPAWN_EDGE_X
        : hooks.worldWidth() - SPAWN_EDGE_X;
    minionDropCount += 1;
    hooks
      .enemies()
      .spawn(kind, x, kind === 'floaty' || kind === 'gusty' ? SPAWN_AIR_Y : SPAWN_DROP_Y);
  }

  // 魔王召喚小怪（§54 P2 floaty／§68 P2 mirri／§74 P2 bubbla）：依場上現量夾限至 cap，
  // 走正式 spawn 管線；召喚路徑同套潮汐生成調整（交叉不變式 13/17，審查修復）。
  function summonMinion(kind: EnemyKind, cap: number): void {
    let alive = 0;
    for (const child of hooks.enemies().getGroup().getChildren()) {
      if (child.active && hooks.enemies().kindOf(child) === kind) alive += 1;
    }
    for (let i = 0; i < cap - alive; i += 1) {
      const x = i % 2 === 0 ? hooks.arenaLeft() + SPAWN_EDGE_X : hooks.worldWidth() - SPAWN_EDGE_X;
      const defaultY = kind === 'floaty' ? SPAWN_AIR_Y : SPAWN_DROP_Y;
      const tide = hooks.tide();
      const adjusted = tide
        ? { kind: tide.filterSpawnKind(kind), y: tide.adjustSpawnY(defaultY) }
        : { kind, y: defaultY };
      hooks.enemies().spawn(adjusted.kind, x, adjusted.y);
    }
  }

  // 魔王品種工廠（§54）：新增品種未接線將於編譯期 never 守衛失敗。
  function buildBoss(kind: BossKind): { handle: BossHandle; bodyDamage: number } {
    switch (kind) {
      case 'jellord':
        return {
          handle: createBoss(scene, {
            ex: hooks.exMode,
            arenaLeft: () => hooks.arenaLeft(),
            // EX 擊破分裂（§58）：於魔王位置生成小果凍，走正式 spawn 管線。
            onSplit: (x, y, count) => {
              for (let i = 0; i < count; i += 1) {
                hooks.enemies().spawn('jelly', x + (i - (count - 1) / 2) * 46, y - 20);
              }
            },
          }),
          bodyDamage: BOSS.bodyDamage,
        };
      case 'noctra':
        return {
          handle: createNoctra(
            scene,
            {
              summonFloaty: (cap) => summonMinion('floaty', cap),
              // 蝕月斗篷顯形（§5）：吸入第二用途，氣流擾動使輪廓顯形。
              isPlayerInhaling: () => hooks.player().isInhaling(),
            },
            { ex: hooks.exMode, arenaLeft: () => hooks.arenaLeft() },
          ),
          bodyDamage: NOCTRA.bodyDamage,
        };
      case 'prismix':
        return {
          handle: createPrismix(
            scene,
            {
              summonMirri: (cap) => summonMinion('mirri', cap),
              // 雙子連破（§68/§70）：FSM 單一真值，此處餵彩蛋＋全屏稜光演出。
              onTwinFinish: () => {
                hooks.feedEggs({ kind: 'twin-finish' });
                scene.cameras.main.flash(360, 220, 200, 255);
                hooks
                  .fx()
                  .starBurst(hooks.arenaLeft() + scene.scale.width / 2, VIEW.height / 2 - 40);
              },
            },
            { ex: hooks.exMode, arenaLeft: () => hooks.arenaLeft() },
          ),
          bodyDamage: PRISMIX.bodyDamage,
        };
      case 'syrona':
        return {
          handle: createSyrona(
            scene,
            {
              summonBubbla: (cap) => summonMinion('bubbla', cap),
              // 窯風三連（§75）：呈現層單一真值，此處餵彩蛋＋窯火謝幕演出。
              onVentEgg: () => {
                hooks.feedEggs({ kind: 'vent-hit-count' });
                scene.cameras.main.flash(320, 255, 214, 140);
                hooks
                  .fx()
                  .starBurst(hooks.arenaLeft() + scene.scale.width / 2, VIEW.height / 2 - 40);
              },
              // 場控潮汐（§74）：沿 GameScene 單一潮汐管線（浸水/生成過濾自然生效）。
              startTide: (spec) => hooks.replaceTide(spec),
              boilTide: (spec) => hooks.tide()?.setSpec(spec),
            },
            { ex: hooks.exMode, arenaLeft: () => hooks.arenaLeft() },
          ),
          bodyDamage: SYRONA.bodyDamage,
        };
      case 'voidra':
        return {
          handle: createVoidra(
            scene,
            {
              // 星核共鳴（§83）：FSM 單一真值，此處餵彩蛋＋星雨謝幕演出。
              onShardEgg: () => {
                hooks.feedEggs({ kind: 'survive-collect' });
                scene.cameras.main.flash(360, 255, 230, 160);
                hooks
                  .fx()
                  .starBurst(hooks.arenaLeft() + scene.scale.width / 2, VIEW.height / 2 - 40);
              },
              // P2 定點轟炸（§82）：沿 GameScene 單一 meteor 管線開關與調參；
              // 收轟炸（轉段/擊破/段重試）連飛行中隕星一併回收（審查收斂）。
              setBombardment: (spec) => {
                const meteor = hooks.meteor();
                if (spec) {
                  meteor?.setSpec(spec);
                  meteor?.setActive(true);
                } else {
                  meteor?.setActive(false);
                  meteor?.clearAirborne();
                }
              },
              // P3 低重力（§81）：全域重力直寫；null 回關卡預設（create 亦會重設）。
              setGravityScale: (scale) => {
                scene.physics.world.gravity.y = GRAVITY_Y * (scale ?? level.gravityScale ?? 1);
              },
              // P2 段內固定愛心（§6.3 保底）：走既有 heal pickup 管線、緩降至地面帶。
              dropSurvivalHeart: () => {
                const x = hooks.arenaLeft() + scene.scale.width * 0.3;
                playSfx('reveal');
                hooks.fx().burstSmall(x, 150, 0xff9ec4);
                spawnHealPickup(
                  scene,
                  x,
                  150,
                  { player: () => hooks.player(), playerHp: () => hooks.playerHp() },
                  { healHp: MERCY_HEAL.healHp, driftToY: groundTop - 22 },
                );
              },
            },
            { ex: hooks.exMode, arenaLeft: () => hooks.arenaLeft() },
          ),
          bodyDamage: VOIDRA.bodyDamage,
        };
      default: {
        const unhandled: never = kind;
        throw new Error(`未知魔王品種：${String(unhandled)}`);
      }
    }
  }

  const built = buildBoss(level.boss ?? 'jellord');
  return { handle: built.handle, bodyDamage: built.bodyDamage, spawnBossMinion };
}
