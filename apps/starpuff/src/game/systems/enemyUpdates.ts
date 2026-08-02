import type Phaser from 'phaser';
import type { EnemyKind } from '../core/types';
import {
  updateBearlet,
  updateBearmarket,
  updateBullrun,
  updateCopypuff,
  updateDatamote,
  updateGravitybub,
  updateMagno,
  updateMirri,
  updateOrbiton,
  updatePrismbee,
  updateRiftling,
} from './fieldEnemies';
import {
  updateCargo,
  updateFoamy,
  updateFrosty,
  updateManta,
  updateScanna,
  updateTicketa,
} from './finaleEnemies';
import { updateCometa, updateGlowy, updateGusty, updateTwinkla, updateZappy } from './flyerEnemies';
import {
  updateBoomy,
  updateBubbla,
  updateChompy,
  updateDrilly,
  updateShelly,
  updateSplatta,
  updateSpora,
} from './groundEnemies';
import type { EnemyTarget } from './enemies';
import type { VisualScaleChannel } from './visualScale';

// 小怪 per-kind 逐幀 AI 單一分派點（GAME_DESIGN §16/§30/§47/§48）：update 本體依
// 品種家族分檔（ground/flyer/field/finale——1200 行閘），本檔持有 ctx 共用契約與
// §16 基礎品種內聯；生成/傷害/回收與 hazards 池仍由 enemies.ts 持有，經 ctx 回呼銜接。

const JELLY_HOP_INTERVAL_MS = 1300;
const JELLY_HOP_VX = 130;
const JELLY_HOP_VY = -380;
const FLOATY_SPEED = 100;
const FLOATY_OMEGA = 0.0015;
export const SPIKY_SPEED = 170;
const SPIKY_ROLL = 0.0003;
// puffy：高空恆速下飄 + 微幅左右擺（§16）。
export const PUFFY_FALL_SPEED = 55;
const PUFFY_SWAY_SPEED = 30;
const PUFFY_SWAY_OMEGA = 0.002;

// AI 對外依賴最小面：target/elapsedMs 為即時值（getter），其餘為 enemies.ts 內部管線回呼。
export interface EnemyUpdateContext {
  scene: Phaser.Scene;
  // 物理/視覺縮放解耦通道（§77）：狀態性造型走 setBase、瞬態演出走 fx/mod。
  vscale: VisualScaleChannel;
  readonly target: EnemyTarget | null;
  readonly elapsedMs: number;
  // 魔王 arena 補給個體：保留走位與吸入互動，但不啟動遠程攻擊。
  readonly safeSupply?: boolean;
  viewCenterX(): number;
  pulseRing(x: number, y: number, radius: number, strokeTint: number): void;
  spawnBite(chompy: Phaser.Physics.Arcade.Sprite): void;
  popPuffy(sprite: Phaser.Physics.Arcade.Sprite): void;
  // v8（§52）：孢子雲區域拒止與迴旋殼刃，皆走 hazards 管線。
  spawnSporeCloud(x: number, y: number): void;
  spawnBoomerang(x: number, y: number, directionX: 1 | -1): void;
  // v11（§73）：splatta 拋物糖球（落地留灼燙糖斑），走 hazards 管線。
  spawnSugarBlob(x: number, y: number, directionX: 1 | -1): void;
  // v12（§80）：cometa 俯衝彗尾段，走 hazards 管線。
  spawnCometTail(x: number, y: number): void;
  // §120：scanna 掃描光束／foamy 漂浮泡泡／manta 扇形水刃，皆走 hazards 管線。
  spawnScanBeam(x: number, y: number, directionX: 1 | -1): void;
  spawnBubble(x: number, y: number, directionX: 1 | -1): void;
  spawnWaterBlade(x: number, y: number, vx: number, vy: number): void;
  // §123：bearlet 下跌箭頭（L30 前置教學），走 hazards 管線。
  spawnCrashArrow(x: number, y: number, directionX: 1 | -1): void;
  // §126：bearmarket 地面震波（拍地雙側／甦醒全場），走 hazards 管線。
  spawnMarketWave(x: number, y: number, directionX: 1 | -1, quake: boolean): void;
  // §123：datamote 聚攏尋找最近同類（enemies.ts 持有群組，經回呼查詢）。
  nearestKind(kind: EnemyKind, fromX: number, fromY: number): { x: number; y: number } | null;
}

// per-kind 分派：enemies.ts update 迴圈於 dmgCd/凍結處理後呼叫。
export function updateEnemyKind(
  ctx: EnemyUpdateContext,
  sprite: Phaser.Physics.Arcade.Sprite,
  kind: EnemyKind,
  deltaMs: number,
): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  // 補給怪是玩家的資源路徑，不應在玩家靠近取彈時同時開啟隱形放電／迴旋刃。
  // 只對 L30 waves/BossRoom 注入的 safeSupply 生效；FSM 召喚體未帶標記，仍保留完整攻擊。
  if (ctx.safeSupply === true && (kind === 'zappy' || kind === 'boomy')) {
    const direction = ctx.target ? (ctx.target.x < sprite.x ? -1 : 1) : 0;
    body.setVelocityX(direction * (kind === 'zappy' ? 45 : 35));
    body.setVelocityY(0);
    sprite.setData('state', 'supply');
    return;
  }
  switch (kind) {
    case 'jelly': {
      if (!body.blocked.down) break;
      body.setVelocityX(0);
      // 精英倍率（§48）：跳頻與水平衝量隨 eliteMul 強化。
      const mul = (sprite.getData('eliteMul') as number) ?? 1;
      const hopMs = (sprite.getData('hopMs') as number) + deltaMs;
      if (hopMs < JELLY_HOP_INTERVAL_MS / mul) {
        sprite.setData('hopMs', hopMs);
        break;
      }
      sprite.setData('hopMs', 0);
      const targetX = ctx.target?.x ?? ctx.viewCenterX();
      const direction = targetX >= sprite.x ? 1 : -1;
      body.setVelocity(direction * JELLY_HOP_VX * mul, JELLY_HOP_VY);
      break;
    }
    case 'floaty': {
      const phase = sprite.getData('phase') as number;
      body.setVelocityX(Math.cos(ctx.elapsedMs * FLOATY_OMEGA + phase) * FLOATY_SPEED);
      break;
    }
    case 'spiky': {
      // 被外力夾停時恢復滾動。
      if (body.velocity.x === 0) body.setVelocityX(SPIKY_SPEED);
      sprite.rotation += body.velocity.x * deltaMs * SPIKY_ROLL;
      break;
    }
    case 'puffy': {
      // 落地即「啵」爆（不計擊殺配額）；被吸入由吞下流程回收不爆。
      if (body.blocked.down) {
        ctx.popPuffy(sprite);
        break;
      }
      const phase = sprite.getData('phase') as number;
      body.setVelocity(
        Math.sin(ctx.elapsedMs * PUFFY_SWAY_OMEGA + phase) * PUFFY_SWAY_SPEED,
        PUFFY_FALL_SPEED,
      );
      break;
    }
    case 'chompy': {
      body.setVelocityX(0);
      updateChompy(ctx, sprite, deltaMs);
      break;
    }
    case 'shelly': {
      updateShelly(ctx, sprite, deltaMs);
      break;
    }
    case 'drilly': {
      updateDrilly(ctx, sprite, deltaMs);
      break;
    }
    case 'glowy': {
      updateGlowy(ctx, sprite, deltaMs);
      break;
    }
    case 'spora': {
      updateSpora(ctx, sprite, deltaMs);
      break;
    }
    case 'gusty': {
      updateGusty(ctx, sprite, deltaMs);
      break;
    }
    case 'boomy': {
      updateBoomy(ctx, sprite, deltaMs);
      break;
    }
    case 'magno': {
      updateMagno(ctx, sprite, deltaMs);
      break;
    }
    case 'mirri': {
      updateMirri(ctx, sprite, deltaMs);
      break;
    }
    case 'bubbla': {
      updateBubbla(ctx, sprite, deltaMs);
      break;
    }
    case 'splatta': {
      updateSplatta(ctx, sprite, deltaMs);
      break;
    }
    case 'twinkla': {
      updateTwinkla(ctx, sprite, deltaMs);
      break;
    }
    case 'cometa': {
      updateCometa(ctx, sprite, deltaMs);
      break;
    }
    // §120 星海終局篇新怪：AI 本體在 systems/finaleEnemies.ts（1200 行閘分檔）。
    case 'cargo': {
      updateCargo(ctx, sprite, deltaMs);
      break;
    }
    case 'ticketa': {
      updateTicketa(ctx, sprite, deltaMs);
      break;
    }
    case 'scanna': {
      updateScanna(ctx, sprite, deltaMs);
      break;
    }
    case 'foamy': {
      updateFoamy(ctx, sprite, deltaMs);
      break;
    }
    case 'frosty': {
      updateFrosty(ctx, sprite, deltaMs);
      break;
    }
    case 'manta': {
      updateManta(ctx, sprite, deltaMs);
      break;
    }
    case 'zappy': {
      updateZappy(ctx, sprite, deltaMs);
      break;
    }
    // §123 星海終局篇 W3 新怪：AI 本體在 systems/fieldEnemies.ts（1200 行閘分檔）。
    case 'copypuff': {
      updateCopypuff(ctx, sprite, deltaMs);
      break;
    }
    case 'prismbee': {
      updatePrismbee(ctx, sprite, deltaMs);
      break;
    }
    case 'datamote': {
      updateDatamote(ctx, sprite, deltaMs);
      break;
    }
    case 'gravitybub': {
      updateGravitybub(ctx, sprite, deltaMs);
      break;
    }
    case 'orbiton': {
      updateOrbiton(ctx, sprite, deltaMs);
      break;
    }
    case 'riftling': {
      updateRiftling(ctx, sprite, deltaMs);
      break;
    }
    case 'bearlet': {
      updateBearlet(ctx, sprite, deltaMs);
      break;
    }
    // §126 星海終局篇 W4 牛熊怪：AI 本體在 systems/fieldEnemies.ts。
    case 'bullrun': {
      updateBullrun(ctx, sprite, deltaMs);
      break;
    }
    case 'bearmarket': {
      updateBearmarket(ctx, sprite, deltaMs);
      break;
    }
    default: {
      const exhaustive: never = kind;
      void exhaustive;
    }
  }
}
