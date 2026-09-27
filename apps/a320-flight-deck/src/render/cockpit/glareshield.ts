/**
 * 遮光板：FCU（四旋鈕 + LCD 視窗 + AP/A/THR/LOC/APPR/EXPED）、兩側 EFIS 控制盤、MASTER WARN/CAUT。
 */
import { Matrix4, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three';
import type { SimState } from '../../sim/types';
import { basis, type CockpitBuilder, type Panel } from './builder';
import { DynamicCanvas, LCD_FONT } from './labels';

const LCD_ON = '#f7dcae';
const LCD_DIM = 'rgba(247,220,174,0.10)';

interface Lcd {
  canvas: DynamicCanvas;
  mat: MeshBasicMaterial;
  draw: (s: SimState, g: CanvasRenderingContext2D, w: number, h: number) => void;
  key: (s: SimState) => string;
}

export interface GlareParts {
  lcds: Lcd[];
}

function lcd(
  b: CockpitBuilder,
  p: Panel,
  u: number,
  v: number,
  w: number,
  h: number,
  key: Lcd['key'],
  draw: Lcd['draw'],
  list: Lcd[],
): void {
  const canvas = new DynamicCanvas(Math.round(w * 4200), Math.round(h * 4200));
  const mat = new MeshBasicMaterial({ map: canvas.texture, toneMapped: false, fog: false });
  const mesh = new Mesh(new PlaneGeometry(w, h), mat);
  mesh.position.set(u, v, 0.0012);
  p.obj.add(mesh);
  b.addStatic(
    b.geo('lcdBezel', () => new PlaneGeometry(1, 1)),
    b.mats.black,
    p.local(u, v, 0.0008).multiply(new Matrix4().makeScale(w + 0.004, h + 0.004, 1)),
  );
  list.push({ canvas, mat, draw, key });
}

function text(
  g: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  size: number,
  lit: boolean,
  align: CanvasTextAlign = 'left',
): void {
  g.font = `700 ${size}px ${LCD_FONT}`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = lit ? LCD_ON : LCD_DIM;
  g.fillText(str, x, y);
}

function bg(g: CanvasRenderingContext2D, w: number, h: number): void {
  g.fillStyle = '#0b0a08';
  g.fillRect(0, 0, w, h);
}

function dot(g: CanvasRenderingContext2D, x: number, y: number, r: number, lit: boolean): void {
  g.fillStyle = lit ? LCD_ON : LCD_DIM;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

export function buildGlareshield(b: CockpitBuilder): GlareParts {
  const t = -0.35;
  const yAxis = new Vector3(0, Math.cos(t), Math.sin(t));
  const lcds: Lcd[] = [];

  // ---------------- FCU ----------------
  const fcu = b.panel(
    'FCU',
    basis(new Vector3(0, 0.325, -15.215), new Vector3(1, 0, 0), yAxis),
    0.66,
    0.1,
    0.045,
    '#4b5963',
  );
  const c = fcu.canvas;
  c.text(0, 0.043, 'FLIGHT CONTROL UNIT', { size: 0.0036, glow: false });

  // SPD
  b.pb(fcu, 'fcu.spdmach', -0.292, -0.028, {
    style: 'fcu',
    w: 0.024,
    h: 0.018,
    label: 'SPD\nMACH',
  });
  b.knob(fcu, 'fcu.spd', -0.225, -0.018, 0.0125, (s) => s.fcu.knobAnim.spd);
  lcd(
    b,
    fcu,
    -0.24,
    0.026,
    0.082,
    0.026,
    (s) => `${s.fcu.spdMach}${s.fcu.spdManaged}${Math.round(s.fcu.spd)}${s.fcu.mach.toFixed(2)}`,
    (s, g, w, h) => {
      bg(g, w, h);
      text(g, 'SPD', w * 0.05, h * 0.2, h * 0.24, s.fcu.spdMach === 'SPD');
      text(g, 'MACH', w * 0.3, h * 0.2, h * 0.24, s.fcu.spdMach === 'MACH');
      const val = s.fcu.spdManaged
        ? '---'
        : s.fcu.spdMach === 'SPD'
          ? String(Math.round(s.fcu.spd)).padStart(3, '0')
          : `.${Math.round(s.fcu.mach * 100)}`;
      text(g, val, w * 0.47, h * 0.64, h * 0.56, true, 'center');
      dot(g, w * 0.86, h * 0.64, h * 0.1, s.fcu.spdManaged);
    },
    lcds,
  );
  b.pb(fcu, 'fcu.loc', -0.155, -0.03, { style: 'fcu', w: 0.03, h: 0.02 });

  // HDG
  b.knob(fcu, 'fcu.hdg', -0.1, -0.018, 0.0125, (s) => s.fcu.knobAnim.hdg);
  lcd(
    b,
    fcu,
    -0.1,
    0.026,
    0.09,
    0.026,
    (s) => `${s.fcu.trkFpa}${s.fcu.hdgManaged}${s.fcu.hdgPreset}${Math.round(s.fcu.hdg)}`,
    (s, g, w, h) => {
      bg(g, w, h);
      text(g, 'HDG', w * 0.04, h * 0.2, h * 0.24, !s.fcu.trkFpa);
      text(g, 'TRK', w * 0.28, h * 0.2, h * 0.24, s.fcu.trkFpa);
      text(g, 'LAT', w * 0.72, h * 0.2, h * 0.24, true);
      const val =
        s.fcu.hdgManaged && !s.fcu.hdgPreset
          ? '---'
          : String(Math.round(s.fcu.hdg) % 360).padStart(3, '0');
      text(g, val, w * 0.42, h * 0.64, h * 0.56, true, 'center');
      dot(g, w * 0.78, h * 0.64, h * 0.1, s.fcu.hdgManaged);
    },
    lcds,
  );

  // 中央：HDG-V/S / TRK-FPA 指示、AP、A/THR
  lcd(
    b,
    fcu,
    0.0,
    0.03,
    0.05,
    0.02,
    (s) => `${s.fcu.trkFpa}`,
    (s, g, w, h) => {
      bg(g, w, h);
      text(g, s.fcu.trkFpa ? 'TRK' : 'HDG', w * 0.25, h * 0.5, h * 0.42, true, 'center');
      text(g, s.fcu.trkFpa ? 'FPA' : 'V/S', w * 0.75, h * 0.5, h * 0.42, true, 'center');
    },
    lcds,
  );
  b.pb(fcu, 'fcu.hdgtrk', 0.0, 0.009, {
    style: 'key',
    w: 0.026,
    h: 0.012,
    label: 'HDG V/S\nTRK FPA',
  });
  b.pb(fcu, 'fcu.ap1', -0.018, -0.014, { style: 'fcu', w: 0.03, h: 0.02 });
  b.pb(fcu, 'fcu.ap2', 0.018, -0.014, { style: 'fcu', w: 0.03, h: 0.02 });
  b.pb(fcu, 'fcu.athr', 0.0, -0.037, { style: 'fcu', w: 0.034, h: 0.018 });

  // ALT
  lcd(
    b,
    fcu,
    0.115,
    0.026,
    0.1,
    0.026,
    (s) => `${Math.round(s.fcu.alt)}${s.afs.vertical ?? ''}`,
    (s, g, w, h) => {
      bg(g, w, h);
      text(g, 'ALT', w * 0.08, h * 0.2, h * 0.24, true);
      text(g, 'LVL/CH', w * 0.46, h * 0.2, h * 0.24, true);
      text(
        g,
        String(Math.round(s.fcu.alt)).padStart(5, '0'),
        w * 0.47,
        h * 0.64,
        h * 0.56,
        true,
        'center',
      );
      const managedAlt =
        s.afs.vertical === 'CLB' ||
        s.afs.vertical === 'DES' ||
        s.afs.verticalArmed.includes('CLB') ||
        s.afs.verticalArmed.includes('DES');
      dot(g, w * 0.9, h * 0.64, h * 0.1, managedAlt);
    },
    lcds,
  );
  b.knob(fcu, 'fcu.alt', 0.115, -0.018, 0.0135, (s) => s.fcu.knobAnim.alt);
  b.selector(fcu, 'fcu.altinc', 0.172, -0.024, { radius: 0.0055, spread: 1.2, labelRadius: 0.012 });
  b.pb(fcu, 'fcu.metric', 0.18, 0.02, { style: 'key', w: 0.02, h: 0.01, label: 'METRIC' });
  b.pb(fcu, 'fcu.exped', 0.06, -0.034, { style: 'fcu', w: 0.03, h: 0.02 });
  b.pb(fcu, 'fcu.appr', 0.235, -0.034, { style: 'fcu', w: 0.03, h: 0.02 });

  // V/S
  lcd(
    b,
    fcu,
    0.28,
    0.026,
    0.074,
    0.026,
    (s) => `${s.fcu.trkFpa}${s.fcu.vsDashes}${Math.round(s.fcu.vs)}${s.fcu.fpa.toFixed(1)}`,
    (s, g, w, h) => {
      bg(g, w, h);
      text(g, 'V/S', w * 0.08, h * 0.2, h * 0.24, !s.fcu.trkFpa);
      text(g, 'FPA', w * 0.6, h * 0.2, h * 0.24, s.fcu.trkFpa);
      let val: string;
      if (s.fcu.vsDashes) val = '-----';
      else if (s.fcu.trkFpa) val = `${s.fcu.fpa >= 0 ? '+' : '-'}${Math.abs(s.fcu.fpa).toFixed(1)}`;
      else {
        const hundreds = Math.round(Math.abs(s.fcu.vs) / 100);
        val = `${s.fcu.vs >= 0 ? '+' : '-'}${String(hundreds).padStart(2, '0')}oo`;
      }
      text(g, val, w * 0.5, h * 0.64, h * 0.52, true, 'center');
    },
    lcds,
  );
  b.knob(fcu, 'fcu.vs', 0.285, -0.02, 0.0125, (s) => s.fcu.knobAnim.vs);
  c.text(-0.225, -0.047, 'PUSH TO LEVEL OFF', { size: 0.0026, glow: false });
  c.text(0.285, -0.047, 'PUSH TO LEVEL OFF', { size: 0.0026, glow: false });
  for (const u of [-0.325, 0.325]) {
    c.screw(u, 0.043);
    c.screw(u, -0.043);
  }

  // ---------------- EFIS ×2 ----------------
  for (const side of [1, 2] as const) {
    const sg = side === 1 ? -1 : 1;
    const e = b.panel(
      `EFIS${side}`,
      basis(new Vector3(sg * 0.495, 0.325, -15.215), new Vector3(1, 0, 0), yAxis),
      0.3,
      0.1,
      0.045,
      '#4b5963',
    );
    // 機長側 BARO 在左；副駕駛側鏡射
    const bu = side === 1 ? -0.1 : 0.1;
    lcd(
      b,
      e,
      bu,
      0.03,
      0.06,
      0.022,
      (s) => {
        const ef = s.efis[side - 1];
        return `${ef.baroStd}${ef.baroUnit}${ef.qnh.toFixed(1)}`;
      },
      (s, g, w, h) => {
        bg(g, w, h);
        const ef = s.efis[side - 1];
        const val = ef.baroStd
          ? 'Std'
          : ef.baroUnit === 'hPa'
            ? String(Math.round(ef.qnh))
            : (ef.qnh * 0.02953).toFixed(2);
        text(g, 'QFE', w * 0.08, h * 0.25, h * 0.26, false);
        text(g, 'QNH', w * 0.08, h * 0.72, h * 0.26, !ef.baroStd);
        text(g, val, w * 0.62, h * 0.52, h * 0.62, true, 'center');
      },
      lcds,
    );
    b.knob(e, `efis${side}.baro`, bu, -0.018, 0.0115);
    b.selector(e, `efis${side}.barounit`, bu + (side === 1 ? -0.036 : 0.036), -0.036, {
      radius: 0.005,
      spread: 1.0,
      labelRadius: 0.011,
    });
    const fx = side === 1 ? -0.045 : 0.045;
    b.pb(e, `efis${side}.fd`, fx, 0.024, { style: 'fcu', w: 0.024, h: 0.018 });
    b.pb(e, `efis${side}.ls`, fx, -0.014, { style: 'fcu', w: 0.024, h: 0.018 });
    const row = side === 1 ? [0.0, 0.03, 0.06, 0.09, 0.12] : [-0.12, -0.09, -0.06, -0.03, 0.0];
    const keys =
      side === 1 ? ['cstr', 'wpt', 'vord', 'ndb', 'arpt'] : ['arpt', 'ndb', 'vord', 'wpt', 'cstr'];
    keys.forEach((k, i) =>
      b.pb(e, `efis${side}.${k}`, row[i], 0.03, { style: 'fcu', w: 0.025, h: 0.017 }),
    );
    const mx = side === 1 ? 0.02 : -0.1;
    const rx = side === 1 ? 0.1 : -0.02;
    b.selector(e, `efis${side}.mode`, mx, -0.022, {
      radius: 0.0085,
      spread: 2.0,
      labelRadius: 0.018,
    });
    b.selector(e, `efis${side}.range`, rx, -0.022, {
      radius: 0.0085,
      spread: 2.4,
      labelRadius: 0.018,
    });
    e.canvas.text(mx, -0.047, 'ND MODE', { size: 0.003 });
    e.canvas.text(rx, -0.047, 'ND RANGE', { size: 0.003 });

    // 主警告
    const w = b.panel(
      `WARN${side}`,
      basis(new Vector3(sg * 0.7, 0.325, -15.215), new Vector3(1, 0, 0), yAxis),
      0.08,
      0.1,
      0.045,
      '#4b5963',
    );
    b.pb(w, `warn${side}.mw`, 0, 0.022, { style: 'warn', w: 0.034, h: 0.03 });
    b.pb(w, `warn${side}.mc`, 0, -0.022, { style: 'warn', w: 0.034, h: 0.03 });
  }
  return { lcds };
}

export function updateGlareLcds(parts: GlareParts, s: SimState, powered: boolean): void {
  for (const l of parts.lcds) {
    l.canvas.update(powered ? l.key(s) : 'off', (g, w, h) => {
      if (powered) l.draw(s, g, w, h);
      else {
        g.fillStyle = '#060605';
        g.fillRect(0, 0, w, h);
      }
    });
  }
}
