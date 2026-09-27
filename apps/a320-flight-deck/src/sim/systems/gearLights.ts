/**
 * LandingGearSystem（收放程序：艙門→起落架→艙門，需 GREEN 液壓）、BrakeSystem（踏板/自動剎車/停機剎車/溫度）、
 * 前輪轉向，以及 LightSystem（閃光計時、著陸燈伸縮）。
 */
import { KT } from '../constants';
import type { SimEvent, SimState } from '../types';

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const AUTOBRAKE_DECEL = { OFF: 0, LO: 1.7, MED: 3.0, MAX: 6.0 } as const;

export class GearSystem {
  private allDown = true;
  private allUp = false;
  private abIntegral = 0;
  private abDelay = 0;

  update(s: SimState, dt: number, emit: (e: SimEvent) => void): void {
    const g = s.gear;
    const hyd = s.hyd.green.pressure > 1500 ? 1 : s.hyd.green.pressure > 800 ? 0.4 : 0;
    const down = g.lever === 'DOWN';
    for (let i = 0; i < 3; i++) {
      const target = down ? 1 : 0;
      if (Math.abs(g.position[i] - target) > 1e-4) {
        // 需先開艙門
        g.doors[i] = Math.min(1, g.doors[i] + 0.7 * dt * Math.max(hyd, down ? 0.3 : 0));
        if (g.doors[i] > 0.98) {
          const rate = (down ? 0.2 : 0.17) * (down ? Math.max(hyd, 0.35) : hyd) * dt;
          g.position[i] = down
            ? Math.min(1, g.position[i] + rate)
            : Math.max(0, g.position[i] - rate);
        }
      } else {
        g.doors[i] = Math.max(0, g.doors[i] - 0.6 * dt * Math.max(hyd, 0.2));
      }
      g.downLocked[i] = g.position[i] > 0.999;
      g.upLocked[i] = g.position[i] < 0.001;
    }
    const allDown = g.downLocked.every(Boolean);
    const allUp = g.upLocked.every(Boolean) && g.doors.every((d) => d < 0.01);
    if (allDown && !this.allDown) emit({ type: 'GEAR_LOCKED', down: true });
    if (allUp && !this.allUp) emit({ type: 'GEAR_LOCKED', down: false });
    this.allDown = allDown;
    this.allUp = allUp;

    this.brakes(s, dt);
    this.steering(s, dt);
    for (let i = 0; i < 3; i++) {
      if (!s.flight.wow[i]) {
        // 空中：輪子自然減速，收起時剎停
        g.wheelSpin[i] *= Math.max(0, 1 - dt * (g.position[i] < 0.95 ? 2.5 : 0.08));
      }
      g.wheelAngle[i] = (g.wheelAngle[i] + g.wheelSpin[i] * dt) % (Math.PI * 2);
    }
  }

  private brakes(s: SimState, dt: number): void {
    const g = s.gear;
    const inp = s.input;
    const green = s.hyd.green.pressure > 1500;
    const hydBrake = green || s.hyd.yellow.pressure > 1000;
    // 自動剎車：地面擾流板展開後啟動
    const pedal = Math.max(inp.brakeL, inp.brakeR);
    if (g.autobrake !== 'OFF' && pedal > 0.45 && g.autobrakeActive) {
      g.autobrake = 'OFF';
      g.autobrakeActive = false;
    }
    if (g.autobrake !== 'OFF' && !g.autobrakeActive && s.controls.groundSpoilersActive) {
      this.abDelay += dt;
      const delay = g.autobrake === 'MAX' ? 0 : g.autobrake === 'MED' ? 2 : 4;
      if (this.abDelay >= delay) {
        g.autobrakeActive = true;
        this.abIntegral = 0.2;
      }
    } else if (!s.controls.groundSpoilersActive) {
      this.abDelay = 0;
      if (g.autobrakeActive && !s.flight.onGround) g.autobrakeActive = false;
    }
    let ab = 0;
    if (g.autobrakeActive && green && g.antiSkid) {
      const target = AUTOBRAKE_DECEL[g.autobrake];
      const fwdSpeed = s.flight.gs * KT;
      const h = (s.flight.heading * Math.PI) / 180;
      const acc = s.aircraft.acceleration;
      const decel = -(acc.x * Math.sin(h) - acc.z * Math.cos(h));
      this.abIntegral = clamp(this.abIntegral + (target - decel) * 0.08 * dt, 0, 1);
      ab = fwdSpeed > 0.5 ? clamp(this.abIntegral + (target - decel) * 0.05, 0, 1) : 1;
      g.autobrakeDecel = decel > target * 0.8;
    } else {
      g.autobrakeDecel = false;
    }
    // 停機剎車由黃色蓄壓器供壓，恆可用
    const park = g.parkingBrake ? 1 : 0;
    const tl = Math.max(hydBrake ? Math.max(inp.brakeL, ab) : 0, park);
    const tr = Math.max(hydBrake ? Math.max(inp.brakeR, ab) : 0, park);
    g.brakePressL += (tl - g.brakePressL) * Math.min(1, dt / 0.25);
    g.brakePressR += (tr - g.brakePressR) * Math.min(1, dt / 0.25);
    // 剎車溫度：能量吸收 / 冷卻
    const v = s.flight.gs * KT;
    const mainLoad = s.aircraft.mass * 9.81 * 0.46;
    for (const i of [0, 1] as const) {
      const p = i === 0 ? g.brakePressL : g.brakePressR;
      const onGround = s.flight.wow[i + 1];
      const power = onGround ? p * 0.5 * mainLoad * v : 0;
      g.brakeTemp[i] +=
        (power / 2.6e5) * dt -
        (g.brakeTemp[i] - (s.flight.oat + 5)) * 0.004 * dt * (g.position[1] > 0.98 ? 1 : 0.5);
    }
  }

  private steering(s: SimState, dt: number): void {
    const g = s.gear;
    const gs = s.flight.gs;
    const hyd = s.hyd.green.pressure > 1500 || s.hyd.yellow.pressure > 1500;
    let target = 0;
    if (g.antiSkid && hyd && s.flight.wow[0]) {
      const tillerFade = clamp((70 - gs) / 50, 0, 1);
      const pedalFade = clamp((130 - gs) / 90, 0, 1);
      const rud = s.input.owner === 'AUTOPILOT' ? 0 : s.input.rudder;
      target =
        s.input.tiller * 75 * tillerFade + rud * 6 * pedalFade + this.apSteer * 6 * pedalFade;
    } else if (!s.flight.wow[0]) {
      target = 0;
    } else {
      target = g.steerAngle * 0.98; // 無液壓：自由迴轉
    }
    g.steerAngle += (clamp(target, -75, 75) - g.steerAngle) * Math.min(1, dt / 0.35);
  }

  /** 自動駕駛 rollout 時的前輪轉向指令（-1..1） */
  apSteer = 0;
}

export function updateLights(s: SimState, dt: number): void {
  const l = s.lights;
  const t = s.meta.time;
  const dc = s.elec.dcBat || s.elec.dcEss;
  const ac = s.elec.acBus1 || s.elec.acBus2;
  const airborne = !s.flight.onGround;
  const strobeActive = ac && (l.strobe === 'ON' || (l.strobe === 'AUTO' && airborne));
  const ph = t % 1.0;
  l.strobeOn = strobeActive && (ph < 0.05 || (ph > 0.12 && ph < 0.17));
  if (l.beacon && dc) {
    const b = (t * 1.1) % 1;
    l.beaconOn = b < 0.12 ? Math.sin((b / 0.12) * Math.PI) : 0;
  } else {
    l.beaconOn = 0;
  }
  for (const i of [0, 1] as const) {
    const sw = i === 0 ? l.landL : l.landR;
    const target = sw === 'RETRACT' || !ac ? 0 : 1;
    l.landingLightExtension[i] += (target - l.landingLightExtension[i]) * Math.min(1, dt / 1.5);
  }
}
