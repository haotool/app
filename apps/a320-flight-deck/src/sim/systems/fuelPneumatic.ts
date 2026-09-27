/**
 * 燃油（油箱耗用與供油路徑）、氣源（引擎/APU bleed、交叉供氣、空調組）、增壓、防冰、ADIRS 對準。
 */
import { FT } from '../constants';
import type { SimState } from '../types';

export function updateFuel(s: SimState, dt: number): void {
  const f = s.fuel;
  const burn = (i: 0 | 1, kg: number): void => {
    const own = i === 0 ? 'left' : 'right';
    const ownPumps = i === 0 ? f.pumps.l1 || f.pumps.l2 : f.pumps.r1 || f.pumps.r2;
    // 中央油箱泵壓力較高，優先供油（縫翼收上時）
    if (f.center > 0 && (f.pumps.c1 || f.pumps.c2) && s.controls.slatsAngle < 1) {
      f.center = Math.max(0, f.center - kg);
    } else if (f[own] > 0 && (ownPumps || s.flight.pressureAltitude < 15000)) {
      f[own] = Math.max(0, f[own] - kg);
    } else if (f.xfeed) {
      const other = i === 0 ? 'right' : 'left';
      f[other] = Math.max(0, f[other] - kg);
    }
    if (i === 0) f.used1 += kg;
    else f.used2 += kg;
  };
  burn(0, (s.engines[0].ff / 3600) * dt);
  burn(1, (s.engines[1].ff / 3600) * dt);
  if (s.apu.state === 'AVAILABLE' || s.apu.state === 'STARTING') {
    const kg = (130 / 3600) * dt;
    f.left = Math.max(0, f.left - kg);
  }
  f.fob = f.left + f.right + f.center;
  s.aircraft.mass = s.fplan.zfw * 1000 + f.fob;
}

export function updatePneumatic(s: SimState, dt: number): void {
  const p = s.pneu;
  const apuValve = p.apuBleed && s.apu.state === 'AVAILABLE';
  p.xbleedOpen = p.xbleed === 'OPEN' || (p.xbleed === 'AUTO' && apuValve);
  // APU bleed 開啟時引擎 bleed 閥自動關閉
  const e1 = p.eng1Bleed && !apuValve && !s.engines[0].firePushed ? s.engines[0].bleedPress : 0;
  const e2 = p.eng2Bleed && !apuValve && !s.engines[1].firePushed ? s.engines[1].bleedPress : 0;
  const apu = apuValve ? s.apu.bleedPress : 0;
  let l = Math.max(e1, apu);
  let r = e2;
  if (p.xbleedOpen) {
    const m = Math.max(l, r);
    l = m;
    r = m;
  }
  const k = Math.min(1, dt / 0.6);
  p.ductL += (l - p.ductL) * k;
  p.ductR += (r - p.ductR) * k;
  // 引擎起動時空調組自動關閉
  const starting = s.engines[0].state === 'STARTING' || s.engines[1].state === 'STARTING';
  const flowK = p.packFlow === 'LO' ? 0.8 : p.packFlow === 'HI' ? 1.2 : 1;
  const acOk = s.elec.acBus1 || s.elec.acBus2;
  const p1 = p.pack1 && !starting && acOk && p.ductL > 12 ? 1 : 0;
  const p2 = p.pack2 && !starting && acOk && p.ductR > 12 ? 1 : 0;
  p.pack1Flow += (p1 * flowK - p.pack1Flow) * Math.min(1, dt / 2);
  p.pack2Flow += (p2 * flowK - p.pack2Flow) * Math.min(1, dt / 2);
  const cooling = p.pack1Flow + p.pack2Flow;
  const target = cooling > 0.1 ? 22.5 : s.flight.oat + 6;
  p.cabinTemp += (target - p.cabinTemp) * Math.min(1, dt / 60);
}

/** 標準大氣壓力（psi） */
function pressurePsi(altFt: number): number {
  const h = Math.max(-1000, altFt) * FT;
  return 14.696 * Math.pow(1 - 2.25577e-5 * h, 5.25588);
}

export function updatePressurization(s: SimState, dt: number): void {
  const pr = s.press;
  const alt = s.flight.altitudeMsl;
  const supply = s.pneu.pack1Flow + s.pneu.pack2Flow > 0.3;
  let targetVs: number;
  if (pr.modeMan) {
    targetVs = pr.manVs * 1000;
    if (pr.manVs === 0) targetVs = 0;
  } else if (!supply) {
    // 無氣源：客艙高度向外界靠攏（洩壓）
    targetVs = Math.max(-2000, Math.min(2000, (alt - pr.cabinAlt) * 0.2));
  } else {
    const onGround = s.flight.onGround;
    let targetAlt: number;
    if (onGround) targetAlt = alt;
    else if (s.meta.phase === 'DESCENT' || s.meta.phase === 'APPROACH' || s.meta.phase === 'FINAL')
      targetAlt = pr.landingElev;
    else targetAlt = Math.min(8000, Math.max(pr.landingElev, alt * 0.22));
    // ΔP 上限 8.06 psi
    const maxDp = 8.06;
    while (pressurePsi(targetAlt) - pressurePsi(alt) > maxDp) targetAlt += 100;
    targetVs = Math.max(-750, Math.min(1000, (targetAlt - pr.cabinAlt) * 0.05 * 60));
    if (pr.ditching) targetVs = Math.min(targetVs, 0);
  }
  pr.cabinVs += (targetVs - pr.cabinVs) * Math.min(1, dt / 3);
  pr.cabinAlt += (pr.cabinVs / 60) * dt;
  pr.cabinAlt = Math.max(pr.cabinAlt, Math.min(alt, -200));
  pr.deltaP = Math.max(-1, pressurePsi(pr.cabinAlt) - pressurePsi(alt));
  pr.outflowValve = pr.ditching
    ? 0
    : Math.max(0, Math.min(1, 0.35 + pr.cabinVs / 3000 + (s.flight.onGround ? 0.65 : 0)));
}

export function updateAntiIce(s: SimState, dt: number): void {
  const ai = s.antiIce;
  const w = s.weather;
  // 機翼防冰需要 bleed；地面測試 30 s 後自動關（此處簡化：地面不加熱）
  const wingHeat = ai.wing && (s.pneu.ductL > 10 || s.pneu.ductR > 10) && !s.flight.onGround;
  const icingRate = w.icing ? 0.004 + w.precipitation * 0.004 : 0;
  ai.iceAccretion = Math.max(
    0,
    Math.min(1, ai.iceAccretion + (wingHeat ? -0.02 : icingRate) * dt - (w.icing ? 0 : 0.001 * dt)),
  );
  for (const i of [0, 1] as const) {
    const on = i === 0 ? ai.eng1 : ai.eng2;
    const running = s.engines[i].n2 > 50;
    ai.engineIce[i] = Math.max(
      0,
      Math.min(
        0.6,
        ai.engineIce[i] +
          (on && running ? -0.03 : icingRate * 0.6) * dt -
          (w.icing ? 0 : 0.002 * dt),
      ),
    );
  }
  ai.iceDetected = ai.iceAccretion > 0.08 || ai.engineIce[0] > 0.08 || ai.engineIce[1] > 0.08;
}

export function updateAdirs(s: SimState, dt: number): void {
  const powered = s.elec.dcBat || s.elec.hotBus;
  for (const ir of s.adirs.ir) {
    if (ir.mode === 'OFF' || !powered) {
      ir.aligned = false;
      ir.attAvail = false;
      ir.alignRemaining = 0;
      continue;
    }
    if (ir.mode === 'ATT') {
      ir.aligned = false;
      ir.alignRemaining = Math.max(0, ir.alignRemaining - dt);
      ir.attAvail = ir.alignRemaining <= 0;
      continue;
    }
    if (!ir.aligned) {
      if (ir.alignRemaining <= 0) ir.alignRemaining = s.adirs.fastAlign ? 15 : 420;
      // 對準期間飛機不得移動
      if (s.flight.gs > 1) ir.alignRemaining = s.adirs.fastAlign ? 15 : 420;
      ir.alignRemaining -= dt;
      ir.attAvail = false;
      if (ir.alignRemaining <= 0) {
        ir.aligned = true;
        ir.attAvail = true;
        ir.alignRemaining = 0;
      }
    }
  }
}
