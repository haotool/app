import type Phaser from 'phaser';
import {
  BUFF_SPECS,
  consumeShieldBlock,
  createBuffState,
  pickupBuff,
  tickBuff,
  type BuffId,
  type BuffState,
} from '../logic/buffs';
import { TIDE, soakWakeInvuln, tideSoakVelocity } from '../logic/tide';
import { playSfx } from '../audio/sfx';
import type { BossHandle } from './boss';
import type { BossRoomHandle } from './bossRoom';
import type { CaramelStatus } from './caramelStatus';
import type { FxSystem } from './fx';
import type { MeteorSystem } from './meteor';
import type { PlayerHandle } from './player';
import type { TideHandle } from './tide';
import type { ToastSystem } from './toasts';

// 受擊單一入口與短期增益/環境場效結算（GAME_DESIGN §30/§69/§71/§74/§79）
// 自 GameScene 抽出（W2 前置 1200 行閘）：護盾泡格擋管線、buff 拾取/到期同步、
// 潮汐浸水三聯結算、隕星視窗推進、噴口升力與 P3 震落彈起集中於此。

// P3（§30）：全場震落強制彈起初速。
const QUAKE_BOUNCE_VY = -360;

export interface DamageDirectorHooks {
  player(): PlayerHandle;
  playerHp(): number;
  fx(): FxSystem;
  caramel(): CaramelStatus;
  toasts(): ToastSystem;
  tide(): TideHandle | null;
  meteor(): MeteorSystem | null;
  boss(): BossHandle;
  bossRoom(): BossRoomHandle | null;
  // 噴口乘流意圖（§74 W3）：持跳鍵讀值由 controls 供給。
  jumpHeld(): boolean;
  // 流星雨排除帶（§79）：開門後門前帶（levelGate 供給；未開門 null）。
  gateX(): number | null;
  // 勝敗轉場窗（finished || transitioning）：期間震落靜默。
  isSettled(): boolean;
}

export interface DamageDirector {
  damagePlayer(damage: number, sourceX: number): void;
  applyBuff(id: BuffId): void;
  advanceBuff(deltaMs: number): void;
  advanceTide(deltaMs: number): void;
  advanceMeteors(deltaMs: number): void;
  applyBossVents(deltaMs: number): void;
  resolveBossQuake(): void;
  // 現行增益狀態：caramel buffMods 與 starCombat 傷害倍率的單一真值。
  buff(): BuffState;
  // e2e 觀測點（§69）：當前短期增益狀態與本局累計拾取數。
  buffState(): { id: string | null; remainingMs: number; pickups: number };
}

export function createDamageDirector(
  scene: Phaser.Scene,
  hooks: DamageDirectorHooks,
): DamageDirector {
  let buff: BuffState = createBuffState();
  // e2e 觀測（§69）：本局累計增益拾取數——護盾可能拾取後旋即格擋消耗，快照式觀測會漏。
  let buffPickups = 0;

  // 玩家受擊單一入口（§69 護盾泡）：持盾期吸收 1 次任意傷害（彈幕/接觸/hazard）後破盾；
  // 破盾走 0 傷受擊管線取得擊退＋i-frame，杜絕同一接觸下一幀連擊。
  function damagePlayer(damage: number, sourceX: number): void {
    const block = consumeShieldBlock(buff);
    if (block.blocked) {
      buff = block.state;
      const sprite = hooks.player().sprite;
      hooks.fx().burstSmall(sprite.x, sprite.y, BUFF_SPECS.shield.tint);
      playSfx('metal');
      hooks.player().takeDamage(0, sourceX);
      return;
    }
    hooks.player().takeDamage(damage, sourceX);
  }

  // 短期增益（§69）：拾取單點——同時僅存一個、後拾覆蓋；移動倍率同步注入 player。
  function applyBuff(id: BuffId): void {
    buff = pickupBuff(buff, id);
    buffPickups += 1;
    hooks.caramel().sync();
    hooks.toasts().flavor(`${BUFF_SPECS[id].nameZh}！短暫強化`);
  }

  function advanceBuff(deltaMs: number): void {
    if (buff.id === null) {
      hooks.bossRoom()?.updateBuffHud(buff);
      return;
    }
    const result = tickBuff(buff, deltaMs);
    buff = result.state;
    if (result.expired) hooks.caramel().sync();
    hooks.bossRoom()?.updateBuffHud(buff);
  }

  // 糖漿潮汐逐幀結算（§71/§107）：水位推進＋浸水傷害/強緩速/上推；接觸傷害走
  // damagePlayer 單一入口，實際掉血再追加甦醒無敵窗（取 max）打斷滿潮死亡螺旋。
  function advanceTide(deltaMs: number): void {
    const tide = hooks.tide();
    if (!tide) return;
    tide.update(deltaMs);
    const sprite = hooks.player().sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (!tide.isSubmerged(body.bottom)) return;
    const hpBefore = hooks.playerHp();
    damagePlayer(TIDE.contactDamage, sprite.x);
    hooks.player().grantInvulnerability(soakWakeInvuln(hpBefore, hooks.playerHp()));
    const soaked = tideSoakVelocity(body.velocity.x, body.velocity.y);
    body.setVelocity(soaked.vx, soaked.vy);
  }

  // 流星雨逐幀結算（§79）：波次推進委派呈現層；排除帶＝玩家縱帶＋開門後門前帶。
  function advanceMeteors(deltaMs: number): void {
    const meteor = hooks.meteor();
    if (!meteor) return;
    const view = scene.cameras.main.worldView;
    meteor.update(deltaMs, {
      viewLeft: view.x,
      viewRight: view.right,
      playerX: hooks.player().sprite.x,
      gateX: hooks.gateX(),
    });
  }

  // 場控魔王噴口供力（§74 Syrona）：逐幀委派結算；尾參 jumpHeld＝持鍵乘流意圖（W3）。
  function applyBossVents(deltaMs: number): void {
    const boss = hooks.boss();
    if (!boss.getVentLift) return;
    const sprite = hooks.player().sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    const { x, y } = sprite;
    const held = hooks.jumpHeld();
    const lifted = boss.getVentLift(x, y, body.velocity.y, deltaMs, body.blocked.up, held);
    if (lifted !== null) {
      body.setVelocityY(lifted);
      // 焦糖化反制（§5 W2）：乘噴口氣流吹乾即解除減速。
      hooks.caramel().clear();
    }
  }

  // P3 全場震落（§30）：slam 附加全場訊號，站立玩家強制彈起。
  function resolveBossQuake(): void {
    if (hooks.isSettled()) return;
    hooks.fx().shake(10);
    const sprite = hooks.player().sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) sprite.setVelocityY(QUAKE_BOUNCE_VY);
  }

  return {
    damagePlayer,
    applyBuff,
    advanceBuff,
    advanceTide,
    advanceMeteors,
    applyBossVents,
    resolveBossQuake,
    buff: () => buff,
    buffState: () => ({ id: buff.id, remainingMs: buff.remainingMs, pickups: buffPickups }),
  };
}
