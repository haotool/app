/**
 * Cockpit：組裝殼體、主儀表板、遮光板、操縱台、頂板與駕駛操縱；逐幀依 SimState 更新燈號、背光、泛光、
 * 顯示器亮度（需電源）、擋風玻璃雨滴與檢查單高亮。
 */
import {
  BoxGeometry,
  EdgesGeometry,
  type Group,
  LineBasicMaterial,
  LineSegments,
  PointLight,
  SpotLight,
  type Material,
  type MeshBasicMaterial,
  type Texture,
} from 'three';
import type { SimApi } from '../../sim/api';
import type { DuId } from '../../sim/types';
import type { FrameContext, QualitySettings } from '../types';
import { CockpitBuilder, type AnimCtx } from './builder';
import { buildGlareshield, updateGlareLcds, type GlareParts } from './glareshield';
import { CockpitInteraction } from './interaction';
import { buildMainPanel, drawClock, type MainPanelParts } from './mainPanel';
import { createMaterials, type CockpitMaterials } from './materials';
import { buildOverhead, drawVolts, type OverheadParts } from './overhead';
import { buildPedestal, drawTrim, type PedestalParts } from './pedestal';
import { buildPilotControls } from './pilotControls';
import { buildShell, type ShellParts } from './shell';

export { CockpitInteraction } from './interaction';

/** 燈光強度（candela，與整合端曝光一起微調） */
const FLOOD_CD = 0.9;
const DOME_CD = { OFF: 0, DIM: 0.8, BRT: 2.2 } as const;

export class Cockpit {
  readonly group: Group;
  readonly interaction: CockpitInteraction;

  private readonly b: CockpitBuilder;
  private readonly mats: CockpitMaterials;
  private readonly shell: ShellParts;
  private readonly main: MainPanelParts;
  private readonly glare: GlareParts;
  private readonly ped: PedestalParts;
  private readonly ovhd: OverheadParts;
  private readonly floods: SpotLight[] = [];
  private readonly dome: PointLight;
  private readonly highlightLines: LineSegments[] = [];
  private readonly hlMat = new LineBasicMaterial({
    color: 0x7fe9ff,
    transparent: true,
    opacity: 0.7,
    fog: false,
    depthWrite: false,
  });
  private time = 0;
  private readonly ctx: AnimCtx;

  constructor(sim: SimApi, quality: QualitySettings) {
    this.mats = createMaterials();
    const b = new CockpitBuilder(this.mats);
    this.b = b;
    this.shell = buildShell(b);
    this.main = buildMainPanel(b);
    this.glare = buildGlareshield(b);
    this.ped = buildPedestal(b);
    this.ovhd = buildOverhead(b);
    buildPilotControls(b);
    b.finalize();
    this.group = b.root;

    // 泛光：遮光板下照主儀表板、頂部照中央操縱台
    const flood = (
      x: number,
      y: number,
      z: number,
      tx: number,
      ty: number,
      tz: number,
      angle: number,
    ): void => {
      const l = new SpotLight(0xffe2b8, 0, 1.6, angle, 0.8, 2);
      l.position.set(x, y, z);
      l.target.position.set(tx, ty, tz);
      l.castShadow = false;
      this.group.add(l, l.target);
      this.floods.push(l);
    };
    flood(-0.5, 0.25, -15.22, -0.5, -0.1, -15.4, 0.9);
    flood(0.5, 0.25, -15.22, 0.5, -0.1, -15.4, 0.9);
    flood(0, 1.15, -14.7, 0, -0.35, -14.7, 0.6);
    this.dome = new PointLight(0xfff0dc, 0, 3.2, 2);
    this.dome.position.set(0, 1.45, -14.2);
    this.group.add(this.dome);

    this.ctx = { dt: 0, time: 0, powered: false, integral: 0, annun: 1, pressTime: b.pressTime };
    this.interaction = new CockpitInteraction(sim, b, () => this.time);
    this.setQuality(quality);
  }

  update(frame: FrameContext): void {
    const s = frame.state;
    this.time = frame.time;
    const e = s.elec;
    const dc = e.dcBus1 || e.dcBus2 || e.dcEss || e.dcBat;
    const ac = e.acBus1 || e.acBus2 || e.acEss;
    const c = this.ctx;
    c.dt = Math.min(frame.dt, 0.1);
    c.time = frame.time;
    c.powered = dc;
    c.integral = dc ? s.lights.integral : 0;
    c.annun = s.lights.annun === 'DIM' ? 0.85 : 2.0;
    // 靜態動畫器（燈號、桿位、旋鈕）
    for (const a of this.b.animators) a(s, c);
    if (!dc) this.blankLegends();

    // 面板背光
    const back = c.integral * 0.55;
    for (const p of this.b.panels) p.material.emissiveIntensity = back;

    // 泛光與頂燈
    const flood = dc ? s.lights.flood * FLOOD_CD : 0;
    this.floods[0].intensity = flood;
    this.floods[1].intensity = flood;
    this.floods[2].intensity = flood * 0.8;
    this.dome.intensity = dc ? DOME_CD[s.lights.dome] : 0;

    // 顯示器亮度（需 AC；ISIS 走 DC ESS / 電瓶）
    for (const [du, mesh] of this.b.displays) {
      const powered =
        du === 'isis' || du === 'mcdu1' || du === 'mcdu2' ? dc && (ac || du === 'isis') : ac;
      const mat = mesh.material as MeshBasicMaterial;
      const v = powered ? Math.min(1, s.lights.duBrightness[du]) : 0;
      if (mat.color.r !== v) mat.color.setScalar(v);
    }

    // 小型 LCD
    updateGlareLcds(this.glare, s, dc);
    drawClock(this.main.clock, s, dc);
    drawTrim(this.ped.trimDisplay, s, dc);
    drawVolts(this.ovhd, s);

    // 擋風玻璃：夜間倒影稍增；雨滴依空速流動
    const glass = this.mats.glass;
    glass.opacity = 0.08 + frame.lighting.night * 0.07;
    glass.envMapIntensity = 0.7 + frame.lighting.night * 0.6;
    const u = this.shell.rain.uniforms;
    u.uTime.value = frame.time;
    const rain = frame.cameraInCockpit
      ? Math.max(s.weather.precipitation, s.weather.inCloud ? 0.25 : 0)
      : 0;
    u.uRain.value = rain;
    u.uFlow.value = Math.max(-4, 0.35 - s.flight.ias / 45);

    // 檢查單高亮脈動
    if (this.highlightLines.length) this.hlMat.opacity = 0.45 + 0.3 * Math.sin(frame.time * 3.2);
  }

  /** 無 DC 電源時：readControl 可能仍因熱匯流排回傳燈號，座艙端強制全暗 */
  private blankLegends(): void {
    const mesh = this.b.legends.mesh;
    const col = mesh.instanceColor;
    if (!col) return;
    const a = col.array;
    let dirty = false;
    for (let i = 0; i < mesh.count * 3; i++) {
      if (a[i] > 0.06) {
        a[i] = 0.055;
        dirty = true;
      }
    }
    if (dirty) col.needsUpdate = true;
  }

  setDisplayTexture(du: DuId, tex: Texture): void {
    const mesh = this.b.displays.get(du);
    if (!mesh) return;
    const mat = mesh.material as MeshBasicMaterial;
    mat.map = tex;
    mat.needsUpdate = true;
  }

  setHighlight(ids: string[]): void {
    for (const l of this.highlightLines) {
      l.removeFromParent();
      l.geometry.dispose();
    }
    this.highlightLines.length = 0;
    const want = new Set(ids);
    for (const hb of this.b.hitboxes) {
      if (!want.has(hb.id)) continue;
      const line = new LineSegments(
        new EdgesGeometry(new BoxGeometry(hb.half.x * 2.3, hb.half.y * 2.3, hb.half.z * 2)),
        this.hlMat,
      );
      line.position.copy(hb.center);
      line.renderOrder = 5;
      hb.obj.add(line);
      this.highlightLines.push(line);
    }
  }

  setQuality(q: QualitySettings): void {
    const shadows = q.shadows;
    this.group.traverse((o) => {
      if (o.name === 'cockpit-static') o.castShadow = shadows;
    });
    for (const p of this.b.panels) {
      p.canvas.map.anisotropy = q.anisotropy;
      p.canvas.map.needsUpdate = true;
    }
  }

  dispose(): void {
    this.setHighlight([]);
    this.b.dispose();
    for (const m of this.mats.all) {
      const mm = m as Material & { map?: Texture | null };
      mm.map?.dispose();
      m.dispose();
    }
    this.shell.rain.dispose();
    this.hlMat.dispose();
    for (const l of this.glare.lcds) {
      l.canvas.dispose();
      l.mat.dispose();
    }
    this.main.clock.dispose();
    this.ped.trimDisplay.dispose();
    for (const v of this.ovhd.volts) v.d.dispose();
  }
}
