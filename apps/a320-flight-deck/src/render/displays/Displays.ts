/**
 * 顯示器管理：每具 DU 一張 CanvasTexture，依頻率節流、狀態雜湊未變則不重畫；
 * 電源/亮度/上電自檢統一處理。
 */
import { CanvasTexture, SRGBColorSpace, type WebGLRenderer } from 'three';
import { buildMcduScreen } from '../../sim/autoflight/mcdu';
import type { DuId, McduScreen, SimState } from '../../sim/types';
import type { FrameContext } from '../types';
import {
  C,
  type Ctx,
  HASH_SEED,
  drawSelfTest,
  duPowered,
  fillRect,
  hashValue,
  mix,
  screenOverlay,
} from './common';
import { drawEwd } from './ewd';
import { drawIsis } from './isis';
import { drawMcdu } from './mcdu';
import { drawNd } from './nd';
import { drawPfd } from './pfd';
import { drawSd } from './sd';

interface Unit {
  id: DuId;
  canvas: HTMLCanvasElement;
  ctx: Ctx;
  tex: CanvasTexture;
  interval: number;
  next: number;
  hash: number;
  wasPowered: boolean | null;
  powerOnAt: number;
}

const SIZES: Record<DuId, [number, number, number]> = {
  pfd1: [768, 768, 1 / 30],
  pfd2: [768, 768, 1 / 30],
  nd1: [768, 768, 1 / 15],
  nd2: [768, 768, 1 / 15],
  ewd: [768, 768, 1 / 10],
  sd: [768, 768, 1 / 10],
  mcdu1: [768, 640, 1 / 10],
  mcdu2: [768, 640, 1 / 10],
  isis: [384, 384, 1 / 20],
};

const SELF_TEST_S = 4;

export class Displays {
  readonly textures: Record<DuId, CanvasTexture>;
  private readonly units: Unit[] = [];
  private force = true;
  private disposed = false;

  constructor(renderer: WebGLRenderer) {
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const textures = {} as Record<DuId, CanvasTexture>;
    for (const id of Object.keys(SIZES) as DuId[]) {
      const [w, h, interval] = SIZES[id];
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      fillRect(ctx, 0, 0, w, h, C.bg);
      const tex = new CanvasTexture(canvas);
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = aniso;
      textures[id] = tex;
      this.units.push({
        id,
        canvas,
        ctx,
        tex,
        interval,
        next: 0,
        hash: 0,
        wasPowered: null,
        powerOnAt: -Infinity,
      });
    }
    this.textures = textures;
    // 字型載入完成後強制全部重畫
    if (typeof document !== 'undefined' && 'fonts' in document) {
      const redraw = (): void => {
        if (!this.disposed) this.force = true;
      };
      void document.fonts.load('32px "B612 Mono"').then(redraw, redraw);
      void document.fonts.ready.then(redraw, redraw);
    }
  }

  update(frame: FrameContext): void {
    const s = frame.state;
    const t = frame.time;
    const force = this.force;
    this.force = false;
    for (const u of this.units) {
      if (!force && t < u.next) continue;
      u.next = t + u.interval;
      const powered = duPowered(s, u.id);
      // 上電自檢追蹤（首幀不觸發；模擬時間倒退視為重置）
      if (u.wasPowered === null) u.wasPowered = powered;
      else if (powered && !u.wasPowered) u.powerOnAt = s.meta.time;
      u.wasPowered = powered;
      if (s.meta.time < u.powerOnAt) u.powerOnAt = -Infinity;
      const bright = s.lights.duBrightness[u.id];
      const on = powered && bright > 0;
      const selfTest = on && s.meta.time - u.powerOnAt < SELF_TEST_S;

      let mcdu: McduScreen | null = null;
      let h = mix(mix(mix(HASH_SEED, on ? 1 : 0), selfTest ? 1 : 0), bright);
      if (on && !selfTest) {
        if (u.id === 'mcdu1' || u.id === 'mcdu2') {
          mcdu = buildMcduScreen(s, u.id === 'mcdu1' ? 0 : 1);
          h = hashValue(h, mcdu);
        } else {
          h = this.hashFor(u.id, s, h);
        }
      }
      if (!force && h === u.hash) continue;
      u.hash = h;
      this.draw(u, s, on, selfTest, bright, mcdu);
      u.tex.needsUpdate = true;
    }
  }

  private hashFor(id: DuId, s: SimState, seed: number): number {
    let h = seed;
    switch (id) {
      case 'pfd1':
      case 'pfd2': {
        const side = id === 'pfd1' ? 0 : 1;
        h = hashValue(h, s.flight);
        h = hashValue(h, s.afs);
        h = hashValue(h, s.fcu);
        h = hashValue(h, s.efis[side]);
        h = hashValue(h, s.adirs.ir[side]);
        h = hashValue(h, s.ils);
        h = hashValue(h, s.controls.protActive);
        h = mix(h, s.input.pitch);
        h = mix(h, s.input.roll);
        h = mix(h, s.engines[0].tla);
        h = mix(h, s.engines[1].tla);
        h = mix(h, s.controls.flapHandle);
        return mix(h, Math.floor(s.meta.time * 2));
      }
      case 'nd1':
      case 'nd2': {
        const side = id === 'nd1' ? 0 : 1;
        h = hashValue(h, s.flight);
        h = hashValue(h, s.fplan);
        h = hashValue(h, s.efis[side]);
        h = hashValue(h, s.adirs.ir[side]);
        h = hashValue(h, s.ils);
        h = mix(h, s.fcu.hdg);
        h = hashValue(h, s.fcu.hdgManaged);
        h = hashValue(h, s.fcu.hdgPreset);
        h = hashValue(h, s.afs.lateral);
        h = hashValue(h, s.afs.lateralArmed);
        h = hashValue(h, s.afs.apprArmed);
        h = hashValue(h, s.afs.locArmed);
        h = hashValue(h, s.radio);
        h = mix(h, s.aircraft.position.x / 10);
        h = mix(h, s.aircraft.position.z / 10);
        return mix(h, s.weather.timeOfDay * 60);
      }
      case 'ewd':
        h = hashValue(h, s.engines);
        h = hashValue(h, s.warnings);
        h = mix(h, s.fuel.fob);
        h = mix(h, s.controls.slatsAngle);
        h = mix(h, s.controls.flapsAngle);
        h = hashValue(h, s.controls.flapConfig);
        h = hashValue(h, s.afs.flexTemp);
        h = hashValue(h, s.afs.alphaFloor);
        h = hashValue(h, s.afs.athrActive);
        h = hashValue(h, s.afs.athrMode);
        h = hashValue(h, s.afs.phase);
        h = hashValue(h, s.flight.onGround);
        h = mix(h, s.flight.altitudeMsl / 100);
        h = mix(h, s.flight.oat);
        h = hashValue(h, s.mech.engMode);
        h = hashValue(h, s.meta.phase);
        return hashValue(h, s.elec.dcBat);
      case 'sd':
        h = hashValue(h, s.ecam.sdPage);
        h = hashValue(h, s.elec);
        h = hashValue(h, s.hyd);
        h = hashValue(h, s.fuel);
        h = hashValue(h, s.pneu);
        h = hashValue(h, s.press);
        h = hashValue(h, s.apu);
        h = hashValue(h, s.engines);
        h = hashValue(h, s.gear);
        h = hashValue(h, s.controls);
        h = hashValue(h, s.failures);
        h = hashValue(h, s.doors);
        h = hashValue(h, s.warnings.messages.length);
        h = hashValue(h, s.warnings.cleared);
        h = mix(h, s.flight.tat);
        h = mix(h, s.flight.oat);
        h = mix(h, s.flight.gs);
        h = hashValue(h, s.flight.onGround);
        h = mix(h, s.aircraft.mass / 100);
        return mix(h, Math.floor(s.weather.timeOfDay * 60));
      case 'isis':
        h = mix(h, s.flight.pitch);
        h = mix(h, s.flight.roll);
        h = mix(h, s.flight.ias);
        h = mix(h, s.flight.pressureAltitude);
        h = mix(h, s.flight.heading);
        h = hashValue(h, s.efis[0].baroStd);
        h = mix(h, s.efis[0].qnh);
        h = hashValue(h, s.adirs.ir[2]);
        return hashValue(h, s.adirs.ir[0].aligned);
      default:
        return h;
    }
  }

  private draw(
    u: Unit,
    s: SimState,
    on: boolean,
    selfTest: boolean,
    bright: number,
    mcdu: McduScreen | null,
  ): void {
    const { ctx, canvas } = u;
    const w = canvas.width;
    const h = canvas.height;
    if (!on) {
      fillRect(ctx, 0, 0, w, h, C.bg);
      return;
    }
    ctx.save();
    if (selfTest) drawSelfTest(ctx, w, h);
    else {
      switch (u.id) {
        case 'pfd1':
          drawPfd(ctx, s, 0);
          break;
        case 'pfd2':
          drawPfd(ctx, s, 1);
          break;
        case 'nd1':
          drawNd(ctx, s, 0);
          break;
        case 'nd2':
          drawNd(ctx, s, 1);
          break;
        case 'ewd':
          drawEwd(ctx, s);
          break;
        case 'sd':
          drawSd(ctx, s);
          break;
        case 'mcdu1':
        case 'mcdu2':
          if (mcdu) drawMcdu(ctx, mcdu);
          break;
        case 'isis':
          drawIsis(ctx, s);
          break;
      }
    }
    ctx.restore();
    ctx.drawImage(screenOverlay(w, h), 0, 0);
    // 亮度：以黑色遮罩調暗
    const dim = (1 - Math.min(1, bright)) * 0.92;
    if (dim > 0.01) {
      ctx.fillStyle = `rgba(0,0,0,${dim.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  dispose(): void {
    this.disposed = true;
    for (const u of this.units) {
      u.tex.dispose();
      u.canvas.width = 0;
      u.canvas.height = 0;
    }
  }
}
