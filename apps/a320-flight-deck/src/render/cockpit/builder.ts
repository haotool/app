/**
 * 座艙建構器：面板座標系、靜態幾何合併、實例化鍵帽/字樣層、hitbox 註冊與逐幀動畫器。
 * 所有控制項狀態只從 readControl(state, id) 讀取；建構器只保存純視覺動畫量。
 */
import {
  BufferAttribute,
  type BufferGeometry,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
  type Material,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  CONTROL_MAP,
  readControl,
  type ControlDef,
  type Legend,
  type LegendColor,
} from '../../sim/controlDefs';
import type { DuId, SimState } from '../../sim/types';
import { LabelAtlas, PanelCanvas } from './labels';
import type { CockpitMaterials } from './materials';

/** 轉非索引幾何（已是非索引則原樣回傳，避免 three 警告） */
const ni = (g: BufferGeometry): BufferGeometry => (g.index ? g.toNonIndexed() : g);

export interface Hitbox {
  id: string;
  def: ControlDef;
  obj: Object3D;
  center: Vector3;
  half: Vector3;
  /** 供 raycast 回傳命中點的區域座標（上/下半、左/右半判斷） */
  userData: { controlId: string; kind: ControlDef['kind']; panel: ControlDef['panel'] };
}

export interface AnimCtx {
  dt: number;
  time: number;
  /** DC 電源（按鈕燈、背光、泛光） */
  powered: boolean;
  /** 面板背光亮度（含電源） */
  integral: number;
  /** 燈號亮度倍率（ANN LT BRT/DIM） */
  annun: number;
  pressTime: ReadonlyMap<string, number>;
}

export type Animator = (s: SimState, c: AnimCtx) => void;

export const LEGEND_RGB: Record<LegendColor, [number, number, number]> = {
  amber: [1, 0.5, 0.04],
  white: [1, 0.95, 0.86],
  blue: [0.18, 0.5, 1],
  green: [0.15, 1, 0.35],
  red: [1, 0.07, 0.05],
  cyan: [0.1, 0.9, 1],
};
const UNLIT = 0.055;

/** 字樣實例層：一個 draw call 畫所有按鈕燈號/鍵帽印字 */
export class LegendLayer {
  readonly mesh: InstancedMesh;
  private readonly uv: InstancedBufferAttribute;
  private readonly colors: InstancedBufferAttribute;
  private readonly texts: string[] = [];
  private n = 0;

  constructor(
    private readonly atlas: LabelAtlas,
    capacity: number,
  ) {
    const geo = new PlaneGeometry(1, 1);
    this.uv = new InstancedBufferAttribute(new Float32Array(capacity * 4), 4);
    this.uv.setUsage(DynamicDrawUsage);
    geo.setAttribute('aUvRect', this.uv);
    const mat = new MeshBasicMaterial({
      map: atlas.texture,
      transparent: true,
      depthWrite: false,
      alphaTest: 0.03,
      fog: false,
    });
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec4 aUvRect;')
        .replace(
          '#include <uv_vertex>',
          '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = uv * aUvRect.zw + aUvRect.xy;\n#endif',
        );
    };
    mat.customProgramCacheKey = () => 'cockpit-legend';
    this.mesh = new InstancedMesh(geo, mat, capacity);
    this.colors = new InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
    this.colors.setUsage(DynamicDrawUsage);
    this.mesh.instanceColor = this.colors;
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.mesh.count = 0;
  }

  add(m: Matrix4, text: string): number {
    const i = this.n++;
    this.mesh.setMatrixAt(i, m);
    this.texts.push('\u0000');
    this.setText(i, text);
    this.setColor(i, UNLIT, UNLIT, UNLIT);
    this.mesh.count = this.n;
    return i;
  }

  setText(i: number, text: string): void {
    if (this.texts[i] === text) return;
    this.texts[i] = text;
    const r = this.atlas.rect(text);
    this.uv.setXYZW(i, r.x, r.y, r.w, r.h);
    this.uv.needsUpdate = true;
  }

  setColor(i: number, r: number, g: number, b: number): void {
    const a = this.colors.array;
    const k = i * 3;
    if (a[k] === r && a[k + 1] === g && a[k + 2] === b) return;
    this.colors.setXYZ(i, r, g, b);
    this.colors.needsUpdate = true;
  }

  setMatrix(i: number, m: Matrix4): void {
    this.mesh.setMatrixAt(i, m);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as Material).dispose();
  }
}

/** 鍵帽實例層（圓角方塊） */
export class CapLayer {
  readonly mesh: InstancedMesh;
  private n = 0;

  constructor(material: MeshStandardMaterial, capacity: number) {
    this.mesh = new InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.18), material, capacity);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.mesh.count = 0;
  }

  add(m: Matrix4, color: Color): number {
    const i = this.n++;
    this.mesh.setMatrixAt(i, m);
    this.mesh.setColorAt(i, color);
    this.mesh.count = this.n;
    return i;
  }

  setMatrix(i: number, m: Matrix4): void {
    this.mesh.setMatrixAt(i, m);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
  }
}

export class Panel {
  readonly obj: Object3D;
  readonly canvas: PanelCanvas;
  readonly material: MeshStandardMaterial;
  /** 面板法向（座艙座標） */
  readonly normal: Vector3;

  constructor(
    readonly name: string,
    matrix: Matrix4,
    readonly w: number,
    readonly h: number,
    bg: string,
  ) {
    this.obj = new Object3D();
    this.obj.name = `panel:${name}`;
    matrix.decompose(this.obj.position, this.obj.quaternion, this.obj.scale);
    this.obj.updateMatrix();
    this.canvas = new PanelCanvas(w, h, bg);
    this.material = new MeshStandardMaterial({
      map: this.canvas.map,
      emissiveMap: this.canvas.emissiveMap,
      emissive: new Color(1, 0.92, 0.78),
      emissiveIntensity: 0,
      roughness: 0.82,
      metalness: 0.05,
      fog: false,
    });
    this.normal = new Vector3(0, 0, 1).applyQuaternion(this.obj.quaternion);
  }

  /** 面板區域座標 → 座艙座標矩陣 */
  local(u: number, v: number, z: number, out = new Matrix4()): Matrix4 {
    return out.makeTranslation(u, v, z).premultiply(this.obj.matrix);
  }
}

const tmpM = new Matrix4();
const tmpM2 = new Matrix4();
const tmpV = new Vector3();

export type PbStyle = 'annun' | 'fcu' | 'ecp' | 'warn' | 'key' | 'keyLight' | 'fire' | 'abrk';

interface PbOpts {
  style?: PbStyle;
  w?: number;
  h?: number;
  label?: string;
}

export class CockpitBuilder {
  readonly root = new Group();
  readonly atlas = new LabelAtlas();
  readonly legends = new LegendLayer(this.atlas, 1400);
  readonly caps: CapLayer;
  readonly hitboxes: Hitbox[] = [];
  readonly animators: Animator[] = [];
  readonly panels: Panel[] = [];
  readonly displays = new Map<DuId, Mesh>();
  readonly pressTime = new Map<string, number>();
  readonly pullTime = new Map<string, number>();
  /** 旋鈕/選擇器視覺累計角（rad，純視覺） */
  readonly knobAngle = new Map<string, number>();
  private readonly statics = new Map<Material, BufferGeometry[]>();
  private readonly geoCache = new Map<string, BufferGeometry>();

  constructor(readonly mats: CockpitMaterials) {
    this.caps = new CapLayer(mats.cap, 700);
    this.root.name = 'cockpit';
    this.root.add(this.legends.mesh, this.caps.mesh);
  }

  /** 共享幾何快取 */
  geo(key: string, make: () => BufferGeometry): BufferGeometry {
    let g = this.geoCache.get(key);
    if (!g) {
      g = make();
      this.geoCache.set(key, g);
    }
    return g;
  }

  /** 靜態幾何（已套用矩陣）依材質收集，最後合併 */
  addStatic(geo: BufferGeometry, mat: Material, m: Matrix4): void {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    }
    if (!g.attributes.uv) {
      g.setAttribute(
        'uv',
        new BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2),
      );
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    g = g.applyMatrix4(m);
    const list = this.statics.get(mat);
    if (list) list.push(g);
    else this.statics.set(mat, [g]);
  }

  /** 建立面板（背板靜態 + 印字面） */
  panel(name: string, matrix: Matrix4, w: number, h: number, depth = 0.03, bg = '#56646f'): Panel {
    const p = new Panel(name, matrix, w, h, bg);
    this.panels.push(p);
    this.root.add(p.obj);
    const face = new Mesh(new PlaneGeometry(w, h), p.material);
    face.receiveShadow = true;
    face.position.z = 0.0005;
    p.obj.add(face);
    this.addStatic(
      new RoundedBoxGeometry(w + 0.006, h + 0.006, depth, 2, 0.003),
      this.mats.trim,
      p.local(0, 0, -depth / 2),
    );
    return p;
  }

  hit(id: string, obj: Object3D, center: Vector3, half: Vector3): void {
    const def = CONTROL_MAP.get(id);
    if (!def) throw new Error(`cockpit: unknown control ${id}`);
    this.hitboxes.push({
      id,
      def,
      obj,
      center,
      half,
      userData: { controlId: id, kind: def.kind, panel: def.panel },
    });
  }

  anim(fn: Animator): void {
    this.animators.push(fn);
  }

  /** 狀態燈（非控制項，例如 ALIGN、LDG GEAR） */
  lamp(
    p: Panel,
    u: number,
    v: number,
    w: number,
    h: number,
    read: (s: SimState) => Legend | null,
    printed = '',
  ): void {
    this.addStatic(
      this.geo('lampBezel', () => new RoundedBoxGeometry(1, 1, 1, 1, 0.1)),
      this.mats.bezel,
      p.local(u, v, 0.002).multiply(tmpM.makeScale(w + 0.004, h + 0.004, 0.004)),
    );
    const i = this.legends.add(p.local(u, v, 0.0045).multiply(tmpM.makeScale(w, h, 1)), printed);
    this.anim((s, c) => {
      const L = c.powered ? read(s) : null;
      if (L) {
        const [r, g, b] = LEGEND_RGB[L.color];
        this.legends.setText(i, L.text);
        this.legends.setColor(i, r * c.annun, g * c.annun, b * c.annun);
      } else {
        this.legends.setText(i, printed);
        this.legends.setColor(i, UNLIT, UNLIT, UNLIT);
      }
    });
  }

  /** 按鈕（自鎖 pb、瞬時、MCDU 鍵、ECP 鍵、主警告） */
  pb(p: Panel, id: string, u: number, v: number, o: PbOpts = {}): void {
    const def = CONTROL_MAP.get(id);
    if (!def) throw new Error(`cockpit: unknown control ${id}`);
    const style: PbStyle = o.style ?? 'annun';
    const w = o.w ?? (style === 'warn' ? 0.03 : style === 'fire' ? 0.034 : 0.022);
    const h = o.h ?? w;
    const depth = style === 'key' || style === 'keyLight' ? 0.006 : 0.008;
    const capColor = new Color(
      style === 'key'
        ? 0x3a3f45
        : style === 'keyLight'
          ? 0x5a6068
          : style === 'fcu' || style === 'ecp'
            ? 0x2c3035
            : style === 'fire'
              ? 0x241012
              : 0x17191c,
    );
    // 靜態凹座
    this.addStatic(
      this.geo('pbBezel', () => new RoundedBoxGeometry(1, 1, 1, 1, 0.12)),
      this.mats.bezel,
      p.local(u, v, 0.0018).multiply(tmpM.makeScale(w + 0.0055, h + 0.0055, 0.0036)),
    );
    const baseZ = depth / 2 + 0.0012;
    const capIdx = this.caps.add(
      p.local(u, v, baseZ).multiply(tmpM.makeScale(w, h, depth)),
      capColor,
    );
    const topZ = baseZ + depth / 2 + 0.00025;

    // 字樣槽位
    const slots: { idx: number; du: number; dv: number; w: number; h: number }[] = [];
    const addSlot = (du: number, dv: number, sw: number, sh: number, text: string): number => {
      const idx = this.legends.add(
        p.local(u + du, v + dv, topZ).multiply(tmpM.makeScale(sw, sh, 1)),
        text,
      );
      slots.push({ idx, du, dv, w: sw, h: sh });
      return idx;
    };
    const label = o.label ?? def.label;
    let upperI = -1;
    let lowerI = -1;
    let labelI = -1;
    let barI = -1;
    if (style === 'annun' || style === 'warn' || style === 'fire' || style === 'abrk') {
      upperI = addSlot(0, h * 0.24, w * 0.88, h * 0.34, def.upper ?? '');
      lowerI = addSlot(0, -h * 0.24, w * 0.88, h * 0.34, def.lower ?? '');
    } else if (style === 'fcu') {
      labelI = addSlot(0, h * 0.2, w * 0.95, h * 0.36, label);
      barI = addSlot(0, -h * 0.2, w * 0.8, h * 0.3, 'BAR');
    } else if (style === 'ecp') {
      labelI = addSlot(0, h * 0.12, w * 0.95, h * 0.55, label);
      barI = addSlot(0, -h * 0.32, w * 0.7, h * 0.2, 'LIT');
    } else {
      labelI = addSlot(0, 0, w * 0.95, h * 0.72, label);
    }

    const latching = def.kind === 'pb';
    const pressDir = p.normal.clone();
    let lastDepth = Number.NaN;
    this.anim((s, c) => {
      const view = readControl(s, id);
      // 按鈕深度：自鎖 pb 依 value；瞬時/鍵依最近按壓
      const t = c.pressTime.get(id);
      const pressed = t !== undefined && c.time - t < 0.14;
      let d = latching && style !== 'fcu' && style !== 'abrk' ? (view.value ? -0.0014 : 0.0006) : 0;
      if (style === 'fire') d = view.value ? 0.003 : 0;
      if (pressed) d = -0.0022;
      if (d !== lastDepth) {
        lastDepth = d;
        tmpV.copy(pressDir).multiplyScalar(d);
        this.caps.setMatrix(
          capIdx,
          p
            .local(u, v, baseZ)
            .multiply(tmpM.makeScale(w, h, depth))
            .premultiply(tmpM2.makeTranslation(tmpV.x, tmpV.y, tmpV.z)),
        );
        for (const sl of slots) {
          this.legends.setMatrix(
            sl.idx,
            p
              .local(u + sl.du, v + sl.dv, topZ)
              .multiply(tmpM.makeScale(sl.w, sl.h, 1))
              .premultiply(tmpM2.makeTranslation(tmpV.x, tmpV.y, tmpV.z)),
          );
        }
      }
      const setLegend = (idx: number, L: Legend | null, printed: string): void => {
        if (idx < 0) return;
        if (L && L.text !== '') {
          const [r, g, b] = LEGEND_RGB[L.color];
          this.legends.setText(idx, L.text);
          this.legends.setColor(idx, r * c.annun, g * c.annun, b * c.annun);
        } else {
          this.legends.setText(idx, printed);
          this.legends.setColor(idx, UNLIT, UNLIT, UNLIT);
        }
      };
      setLegend(upperI, view.upper, def.upper ?? '');
      setLegend(lowerI, view.lower, def.lower ?? '');
      if (labelI >= 0) {
        const k = 0.08 + c.integral * 1.1;
        this.legends.setColor(labelI, k * 0.95, k * 0.93, k * 0.86);
      }
      if (barI >= 0) {
        const lit = style === 'ecp' ? view.lower !== null : view.led;
        if (lit && c.powered) {
          const [r, g, b] = style === 'ecp' ? LEGEND_RGB.white : LEGEND_RGB.green;
          this.legends.setColor(barI, r * c.annun, g * c.annun, b * c.annun);
        } else this.legends.setColor(barI, 0.03, 0.035, 0.03);
      }
    });
    const pad = style === 'key' || style === 'keyLight' ? 0.0012 : 0.002;
    this.hit(id, p.obj, new Vector3(u, v, 0.008), new Vector3(w / 2 + pad, h / 2 + pad, 0.009));
  }

  /** 撥桿開關（上下位置） */
  toggle(
    p: Panel,
    id: string,
    u: number,
    v: number,
    o: { big?: boolean; horizontal?: boolean; labelPositions?: boolean } = {},
  ): Group {
    const def = CONTROL_MAP.get(id);
    if (!def?.positions) throw new Error(`cockpit: toggle ${id} needs positions`);
    const positions = def.positions;
    const n = positions.length;
    const topIsFirst = id === 'lt.annun' || id === 'press.manvs';
    const scale = o.big ? 1.6 : 1;
    // 底座
    this.addStatic(
      this.geo('tglPlate', () => new RoundedBoxGeometry(1, 1, 1, 1, 0.1)),
      this.mats.metal,
      p.local(u, v, 0.0015).multiply(tmpM.makeScale(0.016 * scale, 0.024 * scale, 0.003)),
    );
    this.addStatic(
      this.geo('tglCollar', () =>
        new CylinderGeometry(0.0045, 0.005, 0.006, 16).rotateX(Math.PI / 2),
      ),
      this.mats.metal,
      p.local(u, v, 0.005),
    );
    const pivot = new Group();
    pivot.position.set(u, v, 0.005);
    const lever = new Mesh(
      this.geo(o.big ? 'tglLeverBig' : 'tglLever', () => {
        const stem = new CylinderGeometry(0.0016 * scale, 0.0022 * scale, 0.02 * scale, 12)
          .rotateX(Math.PI / 2)
          .translate(0, 0, 0.01 * scale);
        const tip = new CylinderGeometry(0.0034 * scale, 0.003 * scale, 0.006 * scale, 14)
          .rotateX(Math.PI / 2)
          .translate(0, 0, 0.021 * scale);
        return mergeGeometries([ni(stem), ni(tip)]);
      }),
      o.big ? this.mats.red : this.mats.knobCap,
    );
    lever.castShadow = true;
    pivot.add(lever);
    p.obj.add(pivot);
    // 位置標示
    for (let i = 0; i < n; i++) {
      const up = topIsFirst ? n - 1 - i : i;
      const dv = n === 2 ? (up === 1 ? 0.016 : -0.016) : (up - 1) * 0.016;
      p.canvas.text(u + 0.013 * scale, v + dv * scale, positions[i], {
        size: 0.0042,
        align: 'left',
      });
    }
    const angleOf = (idx: number): number => {
      const up = topIsFirst ? n - 1 - idx : idx;
      const t = n === 2 ? (up === 1 ? 1 : -1) : up - 1;
      return -t * 0.42;
    };
    let cur = Number.NaN;
    this.anim((s, c) => {
      const target = angleOf(Math.round(readControl(s, id).value));
      cur = Number.isNaN(cur) ? target : cur + (target - cur) * Math.min(1, c.dt * 30);
      pivot.rotation.x = cur;
    });
    this.hit(id, p.obj, new Vector3(u, v, 0.012), new Vector3(0.011 * scale, 0.02 * scale, 0.014));
    return pivot;
  }

  /** 旋轉選擇器（離散位置） */
  selector(
    p: Panel,
    id: string,
    u: number,
    v: number,
    o: { radius?: number; spread?: number; labels?: string[]; labelRadius?: number } = {},
  ): void {
    const def = CONTROL_MAP.get(id);
    if (!def?.positions) throw new Error(`cockpit: selector ${id} needs positions`);
    const n = def.positions.length;
    const r = o.radius ?? 0.0085;
    const spread = o.spread ?? (n <= 3 ? 1.1 : 2.2);
    this.addStatic(
      this.geo(`selSkirt${r}`, () =>
        new CylinderGeometry(r * 1.35, r * 1.45, 0.002, 28).rotateX(Math.PI / 2),
      ),
      this.mats.knob,
      p.local(u, v, 0.001),
    );
    const knob = new Group();
    knob.position.set(u, v, 0.002);
    const body = new Mesh(
      this.geo(`selBody${r}`, () => {
        const cyl = new CylinderGeometry(r, r * 1.05, 0.009, 24)
          .rotateX(Math.PI / 2)
          .translate(0, 0, 0.0045);
        const bar = new RoundedBoxGeometry(r * 0.5, r * 2.3, 0.006, 1, 0.001).translate(
          0,
          0,
          0.011,
        );
        return mergeGeometries([ni(cyl), ni(bar)]);
      }),
      this.mats.knob,
    );
    body.castShadow = true;
    const pointer = new Mesh(
      this.geo(`selPtr${r}`, () =>
        new PlaneGeometry(r * 0.18, r * 1.0).translate(0, r * 0.6, 0.0141),
      ),
      this.mats.white,
    );
    knob.add(body, pointer);
    p.obj.add(knob);
    const labels = o.labels ?? def.positions;
    const lr = o.labelRadius ?? r * 2.3;
    const angleOf = (i: number): number => (n === 1 ? 0 : spread / 2 - (i / (n - 1)) * spread);
    for (let i = 0; i < n; i++) {
      const a = angleOf(i);
      p.canvas.text(u - Math.sin(a) * lr, v + Math.cos(a) * lr, labels[i], { size: 0.0042 });
    }
    let cur = Number.NaN;
    this.anim((s, c) => {
      const target = angleOf(Math.round(readControl(s, id).value));
      cur = Number.isNaN(cur) ? target : cur + (target - cur) * Math.min(1, c.dt * 25);
      knob.rotation.z = cur;
    });
    this.hit(id, p.obj, new Vector3(u, v, 0.008), new Vector3(r * 1.6, r * 1.6, 0.012));
  }

  /**
   * 無限旋鈕（FCU、BARO、RUD TRIM）：滾花外圈 + 指示線；旋轉角為純視覺累計，
   * 推入/拉出位移由 pushAnim（+1 推入、-1 拉出，衰減）驅動。
   */
  knob(
    p: Panel,
    id: string,
    u: number,
    v: number,
    r: number,
    pushAnim?: (s: SimState) => number,
  ): Group {
    this.addStatic(
      this.geo(`knobSkirt${r}`, () =>
        new CylinderGeometry(r * 1.3, r * 1.38, 0.002, 32).rotateX(Math.PI / 2),
      ),
      this.mats.bezel,
      p.local(u, v, 0.001),
    );
    const g = new Group();
    g.position.set(u, v, 0.002);
    const body = new Mesh(
      this.geo(`knobBody${r}`, () => {
        const parts: BufferGeometry[] = [
          new CylinderGeometry(r * 0.98, r, 0.012, 36)
            .rotateX(Math.PI / 2)
            .translate(0, 0, 0.006)
            .toNonIndexed(),
        ];
        // 滾花齒
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          const tooth = new RoundedBoxGeometry(r * 0.1, r * 0.16, 0.011, 1, r * 0.03)
            .rotateZ(a)
            .translate(Math.cos(a) * r, Math.sin(a) * r, 0.006);
          parts.push(tooth.index ? tooth.toNonIndexed() : tooth);
        }
        return mergeGeometries(parts);
      }),
      this.mats.knob,
    );
    body.castShadow = true;
    const capMesh = new Mesh(
      this.geo(`knobCap${r}`, () =>
        new CylinderGeometry(r * 0.72, r * 0.8, 0.0025, 32)
          .rotateX(Math.PI / 2)
          .translate(0, 0, 0.0128),
      ),
      this.mats.knobCap,
    );
    const mark = new Mesh(
      this.geo(`knobMark${r}`, () =>
        new PlaneGeometry(r * 0.12, r * 0.55).translate(0, r * 0.42, 0.0142),
      ),
      this.mats.white,
    );
    g.add(body, capMesh, mark);
    p.obj.add(g);
    let angle = 0;
    let push = 0;
    this.anim((s, c) => {
      const target = this.knobAngle.get(id) ?? 0;
      angle += (target - angle) * Math.min(1, c.dt * 20);
      g.rotation.z = -angle;
      let a = pushAnim ? pushAnim(s) : 0;
      const tp = c.pressTime.get(id);
      const tl = this.pullTime.get(id);
      if (tp !== undefined && c.time - tp < 0.25) a = 1 - (c.time - tp) / 0.25;
      if (tl !== undefined && c.time - tl < 0.25) a = -(1 - (c.time - tl) / 0.25);
      push += (a - push) * Math.min(1, c.dt * 30);
      g.position.z = 0.002 - push * 0.004;
    });
    this.hit(id, p.obj, new Vector3(u, v, 0.009), new Vector3(r * 1.35, r * 1.35, 0.012));
    return g;
  }

  /** 電位器（亮度 0..1） */
  pot(p: Panel, id: string, u: number, v: number, r = 0.006): void {
    const knob = new Group();
    knob.position.set(u, v, 0.001);
    const body = new Mesh(
      this.geo(`pot${r}`, () => {
        const c = new CylinderGeometry(r, r * 1.1, 0.008, 20)
          .rotateX(Math.PI / 2)
          .translate(0, 0, 0.004);
        const ptr = new RoundedBoxGeometry(r * 0.25, r * 0.9, 0.002, 1, 0.0003).translate(
          0,
          r * 0.5,
          0.0085,
        );
        return mergeGeometries([ni(c), ni(ptr)]);
      }),
      this.mats.knob,
    );
    knob.add(body);
    p.obj.add(knob);
    p.canvas.text(u - r * 1.9, v - r * 1.6, 'OFF', { size: 0.0032 });
    p.canvas.text(u + r * 1.9, v - r * 1.6, 'BRT', { size: 0.0032 });
    this.anim((s) => {
      knob.rotation.z = 2.3 - readControl(s, id).value * 4.6;
    });
    this.hit(id, p.obj, new Vector3(u, v, 0.005), new Vector3(r * 1.4, r * 1.4, 0.008));
  }

  /** 顯示器（DU）面板：外框 + 黑玻璃 + 可替換貼圖 */
  display(p: Panel, du: DuId, u: number, v: number, w: number, h: number): Mesh {
    this.addStatic(
      this.geo('duBezel', () => new RoundedBoxGeometry(1, 1, 1, 2, 0.02)),
      this.mats.bezel,
      p.local(u, v, 0.003).multiply(tmpM.makeScale(w + 0.022, h + 0.022, 0.006)),
    );
    const mat = new MeshBasicMaterial({ color: 0x000000, toneMapped: false, fog: false });
    const screen = new Mesh(new PlaneGeometry(w, h), mat);
    screen.name = `du:${du}`;
    screen.position.set(u, v, 0.0062);
    p.obj.add(screen);
    this.displays.set(du, screen);
    return screen;
  }

  /** 合併靜態幾何 */
  finalize(): void {
    for (const [mat, list] of this.statics) {
      const merged = mergeGeometries(list, false);
      for (const g of list) g.dispose();
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new Mesh(merged, mat);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      mesh.name = 'cockpit-static';
      this.root.add(mesh);
    }
    this.statics.clear();
    for (const p of this.panels) p.canvas.draw();
    this.root.updateMatrixWorld(true);
  }

  dispose(): void {
    this.atlas.dispose();
    this.legends.dispose();
    this.caps.dispose();
    for (const p of this.panels) {
      p.canvas.dispose();
      p.material.dispose();
    }
    this.root.traverse((o) => {
      const mesh = o as Mesh<BufferGeometry>;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
    for (const m of this.displays.values()) (m.material as Material).dispose();
  }
}

/** 由軸向量建立旋轉矩陣（面板 X/Y 軸，Z = X×Y） */
export function basis(
  origin: Vector3,
  xAxis: Vector3,
  yAxis: Vector3,
  out = new Matrix4(),
): Matrix4 {
  const x = xAxis.clone().normalize();
  const y = yAxis.clone().normalize();
  const z = new Vector3().crossVectors(x, y).normalize();
  y.crossVectors(z, x).normalize();
  out.makeBasis(x, y, z).setPosition(origin);
  return out;
}
