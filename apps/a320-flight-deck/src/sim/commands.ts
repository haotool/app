/**
 * 座艙指令 → 系統狀態。每個控制項都有依賴與系統效應（NO DEAD CONTROLS）。
 * 需電源的面板（FCU/EFIS/MCDU/ECP）在無電時不反應；機械元件（桿、保護蓋、撥桿）永遠可動。
 */
import type { Command } from './controlDefs';
import { CONTROL_MAP } from './controlDefs';
import { TLA } from './constants';
import type { AutoFlightSystem } from './autoflight/autoflight';
import { mcduKey } from './autoflight/mcdu';
import type { EfisState, SdPage, SimEvent, SimState } from './types';

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const DETENTS = [TLA.MAX_REV, TLA.REV_IDLE, TLA.IDLE, TLA.CL, TLA.FLX, TLA.TOGA];

export function applyCommand(
  s: SimState,
  afs: AutoFlightSystem,
  cmd: Command,
  emit: (e: SimEvent) => void,
): void {
  const def = CONTROL_MAP.get(cmd.id);
  if (!def) return;
  const id = cmd.id;
  const dc = s.elec.dcBat || s.elec.dcEss;
  const ac = s.elec.acBus1 || s.elec.acBus2;
  const click = (): void =>
    emit({
      type: 'CLICK',
      kind:
        def.kind === 'pb' || def.kind === 'momentary'
          ? 'button'
          : def.kind === 'key'
            ? 'key'
            : def.kind === 'guard'
              ? 'guard'
              : def.kind === 'lever'
                ? 'lever'
                : def.kind === 'knob' || def.kind === 'pot' || def.kind === 'selector'
                  ? 'knob'
                  : 'switch',
    });

  // ---- 位置型：switch / selector / pot / lever set ----
  if (cmd.type === 'set' || cmd.type === 'rotate' || cmd.type === 'release') {
    const positions = def.positions;
    if (positions && def.kind !== 'lever') {
      const cur = currentIndex(s, id);
      const next =
        cmd.type === 'set'
          ? Math.round(cmd.value)
          : cmd.type === 'rotate'
            ? cur + Math.sign(cmd.delta)
            : cur;
      const idx = clamp(next, 0, positions.length - 1);
      if (cmd.type === 'release' && id === 'press.manvs') {
        s.press.manVs = 0;
        return;
      }
      if (idx !== cur) {
        setPosition(s, id, idx, positions[idx], emit);
        click();
      }
      return;
    }
  }
  if (cmd.type === 'guard') {
    const target = def.guards ?? id.replace('.guard', '');
    const open = s.mech.guardsOpen.includes(target);
    if (open !== cmd.open) {
      s.mech.guardsOpen = cmd.open
        ? [...s.mech.guardsOpen, target]
        : s.mech.guardsOpen.filter((g) => g !== target);
      click();
    }
    return;
  }

  // ---- 桿 ----
  if (def.kind === 'lever') {
    lever(s, afs, id, cmd, emit);
    return;
  }
  if (def.kind === 'pot') {
    const v =
      cmd.type === 'set'
        ? cmd.value
        : cmd.type === 'rotate'
          ? (id.startsWith('brt.')
              ? s.lights.duBrightness[id.slice(4) as keyof typeof s.lights.duBrightness]
              : id === 'lt.integral'
                ? s.lights.integral
                : s.lights.flood) +
            cmd.delta * 0.05
          : null;
    if (v === null) return;
    const val = clamp(v, 0, 1);
    if (id === 'lt.integral') s.lights.integral = val;
    else if (id === 'lt.flood') s.lights.flood = val;
    else if (id.startsWith('brt.'))
      s.lights.duBrightness[id.slice(4) as keyof typeof s.lights.duBrightness] = val;
    return;
  }

  // ---- 旋鈕（FCU / BARO / 方向舵配平） ----
  if (def.kind === 'knob') {
    knob(s, afs, id, cmd, dc);
    click();
    return;
  }

  if (cmd.type !== 'press') return;

  // ---- MCDU ----
  if (def.kind === 'key') {
    if (!ac) return;
    const side = id.startsWith('mcdu1') ? 0 : 1;
    mcduKey(s, side, id.slice(6));
    s.mcdu[side].keyFlash = s.meta.time;
    click();
    return;
  }

  // ---- 受保護按鈕 ----
  if (id === 'fire.eng1' || id === 'fire.eng2' || id === 'fire.apu') {
    if (!s.mech.guardsOpen.includes(id)) return;
    click();
    if (id === 'fire.apu') {
      s.apu.master = false;
      return;
    }
    const e = s.engines[id === 'fire.eng1' ? 0 : 1];
    e.firePushed = !e.firePushed;
    return;
  }

  click();
  const toggle = (get: boolean): boolean => !get;
  switch (id) {
    case 'elec.bat1':
      s.elec.bat1 = toggle(s.elec.bat1);
      return;
    case 'elec.bat2':
      s.elec.bat2 = toggle(s.elec.bat2);
      return;
    case 'elec.extpwr':
      if (s.elec.extPwrAvail) s.elec.extPwrOn = !s.elec.extPwrOn;
      return;
    case 'elec.gen1':
      s.elec.gen1 = toggle(s.elec.gen1);
      return;
    case 'elec.gen2':
      s.elec.gen2 = toggle(s.elec.gen2);
      return;
    case 'elec.apugen':
      s.elec.apuGen = toggle(s.elec.apuGen);
      return;
    case 'elec.bustie':
      s.elec.busTie = toggle(s.elec.busTie);
      return;
    case 'fuel.xfeed':
      s.fuel.xfeed = toggle(s.fuel.xfeed);
      return;
    case 'hyd.eng1pump':
      s.hyd.eng1Pump = toggle(s.hyd.eng1Pump);
      return;
    case 'hyd.eng2pump':
      s.hyd.eng2Pump = toggle(s.hyd.eng2Pump);
      return;
    case 'hyd.elecpump':
      s.hyd.elecPump = toggle(s.hyd.elecPump);
      return;
    case 'hyd.yelecpump':
      s.hyd.yellowElecPump = toggle(s.hyd.yellowElecPump);
      return;
    case 'hyd.ptu':
      s.hyd.ptu = toggle(s.hyd.ptu);
      return;
    case 'apu.master':
      s.apu.master = toggle(s.apu.master);
      if (!s.apu.master) s.apu.startPb = false;
      return;
    case 'apu.start':
      if (s.apu.master && s.apu.state === 'OFF') s.apu.startPb = true;
      return;
    case 'air.pack1':
      s.pneu.pack1 = toggle(s.pneu.pack1);
      return;
    case 'air.pack2':
      s.pneu.pack2 = toggle(s.pneu.pack2);
      return;
    case 'air.eng1bleed':
      s.pneu.eng1Bleed = toggle(s.pneu.eng1Bleed);
      return;
    case 'air.eng2bleed':
      s.pneu.eng2Bleed = toggle(s.pneu.eng2Bleed);
      return;
    case 'air.apubleed':
      s.pneu.apuBleed = toggle(s.pneu.apuBleed);
      return;
    case 'ai.wing':
      s.antiIce.wing = toggle(s.antiIce.wing);
      return;
    case 'ai.eng1':
      s.antiIce.eng1 = toggle(s.antiIce.eng1);
      return;
    case 'ai.eng2':
      s.antiIce.eng2 = toggle(s.antiIce.eng2);
      return;
    case 'ai.probe':
      s.antiIce.probe = toggle(s.antiIce.probe);
      return;
    case 'press.modesel':
      s.press.modeMan = toggle(s.press.modeMan);
      return;
    case 'press.ditching':
      s.press.ditching = toggle(s.press.ditching);
      return;
    case 'fire.test':
      s.warnings.fireTest = !s.warnings.fireTest;
      return;
    case 'fcu.spdmach':
      if (dc) {
        s.fcu.spdMach = s.fcu.spdMach === 'SPD' ? 'MACH' : 'SPD';
        if (s.fcu.spdMach === 'MACH') s.fcu.mach = Math.round(s.flight.mach * 100) / 100;
      }
      return;
    case 'fcu.hdgtrk':
      if (dc) afs.toggleTrkFpa(s);
      return;
    case 'fcu.metric':
      if (dc) s.fcu.metric = !s.fcu.metric;
      return;
    case 'fcu.ap1':
      if (dc) afs.toggleAp(s, 1);
      return;
    case 'fcu.ap2':
      if (dc) afs.toggleAp(s, 2);
      return;
    case 'fcu.athr':
      if (dc) afs.toggleAthr(s);
      return;
    case 'fcu.loc':
      if (dc) afs.toggleLoc(s);
      return;
    case 'fcu.appr':
      if (dc) afs.toggleAppr(s);
      return;
    case 'fcu.exped':
      if (dc) afs.toggleExped(s);
      return;
    case 'warn1.mw':
    case 'warn2.mw':
      s.warnings.acknowledged = [
        ...new Set([
          ...s.warnings.acknowledged,
          ...s.warnings.messages.filter((m) => m.level === 'WARNING').map((m) => m.id),
        ]),
      ];
      if (s.afs.apDisconnectWarning > 0) s.afs.apDisconnectWarning = 0;
      return;
    case 'warn1.mc':
    case 'warn2.mc':
      s.warnings.acknowledged = [
        ...new Set([
          ...s.warnings.acknowledged,
          ...s.warnings.messages.filter((m) => m.level === 'CAUTION').map((m) => m.id),
        ]),
      ];
      if (s.afs.athrDisconnectCaution > 0) s.afs.athrDisconnectCaution = 0;
      return;
    case 'sidestick1.apdisc':
    case 'sidestick2.apdisc':
      afs.disconnectAp(s, true);
      return;
    case 'thr.instdisc':
      afs.instinctiveAthrDisc(s);
      return;
    case 'abrk.lo':
    case 'abrk.med':
    case 'abrk.max': {
      const mode = id === 'abrk.lo' ? 'LO' : id === 'abrk.med' ? 'MED' : 'MAX';
      if (s.gear.autobrake === mode) {
        s.gear.autobrake = 'OFF';
        s.gear.autobrakeActive = false;
      } else if (
        s.hyd.green.pressure > 1500 &&
        s.gear.antiSkid &&
        (mode !== 'MAX' || s.flight.onGround)
      ) {
        s.gear.autobrake = mode;
      }
      return;
    }
    case 'rudtrim.reset':
      s.controls.rudderTrim = 0;
      return;
    default:
      break;
  }
  if (id.startsWith('fuel.')) {
    const k = id.slice(5) as keyof typeof s.fuel.pumps;
    s.fuel.pumps[k] = !s.fuel.pumps[k];
    return;
  }
  if (id.startsWith('efis')) {
    if (!dc) return;
    const ef = s.efis[id[4] === '1' ? 0 : 1];
    const key = id.slice(6) as 'fd' | 'ls' | 'cstr' | 'wpt' | 'vord' | 'ndb' | 'arpt';
    if (
      key === 'fd' ||
      key === 'ls' ||
      key === 'cstr' ||
      key === 'wpt' ||
      key === 'vord' ||
      key === 'ndb' ||
      key === 'arpt'
    ) {
      // CSTR/WPT/VOR.D/NDB/ARPT 互斥（Airbus EFIS）
      if (key !== 'fd' && key !== 'ls') {
        const was = ef[key];
        ef.cstr = ef.wpt = ef.vord = ef.ndb = ef.arpt = false;
        ef[key] = !was;
      } else {
        ef[key] = !ef[key];
      }
    }
    return;
  }
  if (id.startsWith('ecp.')) {
    if (!ac) return;
    ecp(s, id.slice(4));
  }
}

function ecp(s: SimState, key: string): void {
  const pages: SdPage[] = [
    'ENG',
    'BLEED',
    'PRESS',
    'ELEC',
    'HYD',
    'FUEL',
    'APU',
    'COND',
    'DOOR',
    'WHEEL',
    'F/CTL',
    'STS',
  ];
  const w = s.warnings;
  switch (key) {
    case 'CLR': {
      const top = w.messages.find(
        (m) => (m.level === 'WARNING' || m.level === 'CAUTION') && !w.cleared.includes(m.id),
      );
      if (top) w.cleared = [...w.cleared, top.id];
      else s.ecam.manualPage = null;
      return;
    }
    case 'RCL':
      w.cleared = [];
      return;
    case 'EMER CANC': {
      const top = w.messages.find((m) => !w.acknowledged.includes(m.id));
      if (top) w.acknowledged = [...w.acknowledged, top.id];
      return;
    }
    case 'TO CONF':
      w.toConfigTest = 4;
      return;
    case 'ALL': {
      const cur = pages.indexOf(s.ecam.sdPage);
      s.ecam.manualPage = pages[(cur + 1) % pages.length];
      return;
    }
    default: {
      const page = key as SdPage;
      s.ecam.manualPage = s.ecam.manualPage === page ? null : page;
    }
  }
}

function currentIndex(s: SimState, id: string): number {
  const L = s.lights;
  const idx = <T extends string>(arr: readonly T[], v: T): number => Math.max(0, arr.indexOf(v));
  switch (id) {
    case 'air.xbleed':
      return idx(['SHUT', 'AUTO', 'OPEN'], s.pneu.xbleed);
    case 'air.packflow':
      return idx(['LO', 'NORM', 'HI'], s.pneu.packFlow);
    case 'press.manvs':
      return 1 - s.press.manVs;
    case 'lt.strobe':
      return idx(['OFF', 'AUTO', 'ON'], L.strobe);
    case 'lt.beacon':
      return L.beacon ? 1 : 0;
    case 'lt.wing':
      return L.wing ? 1 : 0;
    case 'lt.navlogo':
      return L.navLogo ? 1 : 0;
    case 'lt.rwyturnoff':
      return L.rwyTurnoff ? 1 : 0;
    case 'lt.landL':
      return idx(['RETRACT', 'OFF', 'ON'], L.landL);
    case 'lt.landR':
      return idx(['RETRACT', 'OFF', 'ON'], L.landR);
    case 'lt.nose':
      return idx(['OFF', 'TAXI', 'TO'], L.nose);
    case 'lt.dome':
      return idx(['OFF', 'DIM', 'BRT'], L.dome);
    case 'lt.annun':
      return idx(['TEST', 'BRT', 'DIM'], L.annun);
    case 'sign.seatbelts':
      return idx(['OFF', 'AUTO', 'ON'], L.seatBelts);
    case 'sign.nosmoking':
      return idx(['OFF', 'AUTO', 'ON'], L.noSmoking);
    case 'fcu.altinc':
      return s.fcu.altInc === 100 ? 0 : 1;
    case 'eng.mode':
      return idx(['CRANK', 'NORM', 'IGN/START'], s.mech.engMode);
    case 'eng.master1':
      return s.engines[0].master ? 1 : 0;
    case 'eng.master2':
      return s.engines[1].master ? 1 : 0;
    case 'brk.antiskid':
      return s.gear.antiSkid ? 1 : 0;
    default:
      break;
  }
  if (id.startsWith('adirs.ir'))
    return idx(['OFF', 'NAV', 'ATT'], s.adirs.ir[Number(id.slice(-1)) - 1].mode);
  if (id.startsWith('efis')) {
    const ef = s.efis[id[4] === '1' ? 0 : 1];
    if (id.endsWith('.mode')) return idx(['LS', 'VOR', 'NAV', 'ARC', 'PLAN'], ef.mode);
    if (id.endsWith('.range')) return [10, 20, 40, 80, 160, 320].indexOf(ef.range);
    if (id.endsWith('.barounit')) return ef.baroUnit === 'inHg' ? 0 : 1;
  }
  return 0;
}

function setPosition(
  s: SimState,
  id: string,
  idx: number,
  pos: string,
  emit: (e: SimEvent) => void,
): void {
  const L = s.lights;
  switch (id) {
    case 'air.xbleed':
      s.pneu.xbleed = pos as typeof s.pneu.xbleed;
      return;
    case 'air.packflow':
      s.pneu.packFlow = pos as typeof s.pneu.packFlow;
      return;
    case 'press.manvs':
      s.press.manVs = (1 - idx) as -1 | 0 | 1;
      return;
    case 'lt.strobe':
      L.strobe = pos as typeof L.strobe;
      return;
    case 'lt.beacon':
      L.beacon = idx === 1;
      return;
    case 'lt.wing':
      L.wing = idx === 1;
      return;
    case 'lt.navlogo':
      L.navLogo = idx === 1;
      return;
    case 'lt.rwyturnoff':
      L.rwyTurnoff = idx === 1;
      return;
    case 'lt.landL':
      L.landL = pos as typeof L.landL;
      return;
    case 'lt.landR':
      L.landR = pos as typeof L.landR;
      return;
    case 'lt.nose':
      L.nose = (pos === 'T.O' ? 'TO' : pos) as typeof L.nose;
      return;
    case 'lt.dome':
      L.dome = pos as typeof L.dome;
      return;
    case 'lt.annun':
      L.annun = pos as typeof L.annun;
      return;
    case 'sign.seatbelts':
      if (L.seatBelts !== pos && (s.elec.dcBat || s.elec.dcEss)) emit({ type: 'CHIME' });
      L.seatBelts = pos as typeof L.seatBelts;
      return;
    case 'sign.nosmoking':
      if (L.noSmoking !== pos && (s.elec.dcBat || s.elec.dcEss)) emit({ type: 'CHIME' });
      L.noSmoking = pos as typeof L.noSmoking;
      return;
    case 'fcu.altinc':
      s.fcu.altInc = idx === 0 ? 100 : 1000;
      return;
    case 'eng.mode':
      s.mech.engMode = pos as typeof s.mech.engMode;
      return;
    case 'eng.master1':
      s.engines[0].master = idx === 1;
      return;
    case 'eng.master2':
      s.engines[1].master = idx === 1;
      return;
    case 'brk.antiskid':
      s.gear.antiSkid = idx === 1;
      if (!s.gear.antiSkid) s.gear.autobrake = 'OFF';
      return;
    default:
      break;
  }
  if (id.startsWith('adirs.ir')) {
    const ir = s.adirs.ir[Number(id.slice(-1)) - 1];
    const mode = pos as typeof ir.mode;
    if (mode !== ir.mode) {
      ir.mode = mode;
      ir.aligned = false;
      ir.alignRemaining = mode === 'ATT' ? (s.adirs.fastAlign ? 3 : 20) : 0;
    }
    return;
  }
  if (id.startsWith('efis')) {
    const ef: EfisState = s.efis[id[4] === '1' ? 0 : 1];
    if (id.endsWith('.mode')) ef.mode = pos as EfisState['mode'];
    else if (id.endsWith('.range')) ef.range = Number(pos) as EfisState['range'];
    else if (id.endsWith('.barounit')) ef.baroUnit = pos as EfisState['baroUnit'];
  }
}

function knob(s: SimState, afs: AutoFlightSystem, id: string, cmd: Command, dc: boolean): void {
  const f = s.fcu;
  if (id === 'rudtrim') {
    if (cmd.type === 'rotate')
      s.controls.rudderTrim = clamp(
        Math.round((s.controls.rudderTrim + cmd.delta * 0.1) * 10) / 10,
        -20,
        20,
      );
    return;
  }
  if (!dc) return;
  const anim = (k: keyof typeof f.knobAnim, v: number): void => {
    f.knobAnim[k] = v;
  };
  if (id.startsWith('efis') && id.endsWith('.baro')) {
    const ef = s.efis[id[4] === '1' ? 0 : 1];
    if (cmd.type === 'rotate') {
      if (ef.baroStd) return;
      ef.qnh = clamp(
        ef.baroUnit === 'hPa'
          ? ef.qnh + cmd.delta
          : Math.round((ef.qnh / 33.8639 + cmd.delta * 0.01) * 33.8639 * 100) / 100,
        940,
        1080,
      );
    } else if (cmd.type === 'push') {
      ef.baroStd = true;
    } else if (cmd.type === 'pull') {
      ef.baroStd = false;
    }
    return;
  }
  switch (id) {
    case 'fcu.spd':
      if (cmd.type === 'rotate') {
        if (f.spdMach === 'MACH')
          f.mach = clamp(Math.round((f.mach + cmd.delta * 0.01) * 100) / 100, 0.1, 0.82);
        else f.spd = clamp(f.spd + cmd.delta, 100, 399);
        if (f.spdManaged) {
          f.spdManaged = false;
          f.spd = clamp(Math.round(s.afs.targetSpeed) + cmd.delta, 100, 399);
        }
      } else if (cmd.type === 'push') {
        afs.pushSpd(s);
        anim('spd', 1);
      } else if (cmd.type === 'pull') {
        afs.pullSpd(s);
        anim('spd', -1);
      }
      return;
    case 'fcu.hdg':
      if (cmd.type === 'rotate') afs.rotateHdg(s, cmd.delta);
      else if (cmd.type === 'push') {
        afs.pushHdg(s);
        anim('hdg', 1);
      } else if (cmd.type === 'pull') {
        afs.pullHdg(s);
        anim('hdg', -1);
      }
      return;
    case 'fcu.alt':
      if (cmd.type === 'rotate')
        f.alt = clamp(Math.round((f.alt + cmd.delta * f.altInc) / f.altInc) * f.altInc, 100, 49000);
      else if (cmd.type === 'push') {
        afs.pushAlt(s);
        anim('alt', 1);
      } else if (cmd.type === 'pull') {
        afs.pullAlt(s);
        anim('alt', -1);
      }
      return;
    case 'fcu.vs':
      if (cmd.type === 'rotate') afs.rotateVs(s, cmd.delta);
      else if (cmd.type === 'push') {
        afs.pushVs(s);
        anim('vs', 1);
      } else if (cmd.type === 'pull') {
        afs.pullVs(s);
        anim('vs', -1);
      }
      return;
    default:
  }
}

function lever(
  s: SimState,
  afs: AutoFlightSystem,
  id: string,
  cmd: Command,
  emit: (e: SimEvent) => void,
): void {
  const c = s.controls;
  const value =
    cmd.type === 'set'
      ? cmd.value
      : cmd.type === 'press'
        ? null
        : cmd.type === 'rotate'
          ? cmd.delta
          : null;
  switch (id) {
    case 'thr.lever1':
    case 'thr.lever2': {
      if (value === null) return;
      const e = s.engines[id === 'thr.lever1' ? 0 : 1];
      let tla = cmd.type === 'rotate' ? e.tla + cmd.delta : value;
      tla = clamp(tla, TLA.MAX_REV, TLA.TOGA);
      // 反推需先回到慢車並提起反推鎖（此處：空中不得進入反推區）
      if (tla < TLA.IDLE && !s.flight.onGround && !(s.flight.wow[1] || s.flight.wow[2]))
        tla = TLA.IDLE;
      // 卡位吸附
      for (const d of DETENTS) {
        if (Math.abs(tla - d) < 1.4) {
          if (Math.abs(e.tla - d) >= 1.4) emit({ type: 'CLICK', kind: 'detent' });
          tla = d;
        }
      }
      e.tla = tla;
      return;
    }
    case 'flaps': {
      const next =
        cmd.type === 'press'
          ? (c.flapHandle + 1) % 5
          : cmd.type === 'rotate'
            ? c.flapHandle + Math.sign(cmd.delta)
            : Math.round(value ?? 0);
      const h = clamp(next, 0, 4);
      if (h !== c.flapHandle) {
        c.flapHandle = h;
        emit({ type: 'CLICK', kind: 'detent' });
      }
      return;
    }
    case 'spdbrk': {
      if (cmd.type === 'press') {
        // RET 位置按壓 = 上提預位
        if (c.speedbrakeHandle < 0.05) {
          c.spoilersArmed = !c.spoilersArmed;
          emit({ type: 'CLICK', kind: 'lever' });
        }
        return;
      }
      const v = cmd.type === 'rotate' ? c.speedbrakeHandle + cmd.delta * 0.25 : (value ?? 0);
      if (v < -0.05) {
        c.spoilersArmed = true;
        c.speedbrakeHandle = 0;
        return;
      }
      c.speedbrakeHandle = clamp(v, 0, 1);
      if (c.speedbrakeHandle > 0.05) c.spoilersArmed = false;
      return;
    }
    case 'gear.lever': {
      const down = cmd.type === 'press' ? s.gear.lever === 'UP' : (value ?? 0) >= 0.5;
      if (!down && s.flight.onGround) return; // 地面收輪保護
      if ((s.gear.lever === 'DOWN') !== down) {
        s.gear.lever = down ? 'DOWN' : 'UP';
        emit({ type: 'GEAR_LEVER', down });
        emit({ type: 'CLICK', kind: 'lever' });
      }
      return;
    }
    case 'pbrk': {
      const on = cmd.type === 'press' ? !s.gear.parkingBrake : (value ?? 0) >= 0.5;
      if (on !== s.gear.parkingBrake) {
        s.gear.parkingBrake = on;
        emit({ type: 'CLICK', kind: 'lever' });
      }
      return;
    }
    case 'sidestick1':
    case 'sidestick2':
      return;
    default:
      void afs;
  }
}
