/**
 * AirportWorld：XHAO 鋪面/標線、建築、停機坪車輛與客機、助航燈光（含 PAPI 與 ALS rabbit）、周邊機場。
 * 地形（y=0 草地）由 Environment 繪製；本模組鋪面位於 y≈0.03–0.06。
 */
import {
  AdditiveBlending,
  BoxGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type CanvasTexture,
  type Scene,
} from 'three';
import { AIRPORT, DEG, OTHER_AIRPORTS, WORLD } from '../../sim/constants';
import { terrainHeight } from '../../sim/terrain';
import type { FrameContext, QualitySettings } from '../types';
import { APRON_LINKS, buildAirportLights, PAPI_THRESHOLDS } from './airportLights';
import {
  beam,
  box,
  disposeTree,
  flatRect,
  light,
  LIGHT_COLORS,
  LightField,
  makeCaps,
  merge,
  rng,
  smoothstep,
  updateViewportUniform,
  type LightDef,
} from './common';
import {
  asphaltTexture,
  chainLinkTexture,
  concreteTexture,
  designatorTexture,
  facadeTextures,
  radialTexture,
  tireMarksTexture,
} from './textures';

const RW = AIRPORT.runway;
const TWY = AIRPORT.taxiwayZ;
const CONNECTORS = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((k) => k * 400);
const TERMINAL_STANDS = [-300, -100, 100, 300];
const TERMINAL_STAND_Z = -570.1; // 機頭朝北停放之重心 z（機頭 -588）
const REMOTE_STANDS = [-720, -420, -120, 180, 480, 780];
const MASTS: [number, number][] = [
  [-1250, -300],
  [-760, -440],
  [-280, -300],
  [220, -440],
  [700, -300],
  [1250, -250],
];

export class AirportWorld {
  private readonly group = new Group();
  private quality: QualitySettings;
  private readonly textures: CanvasTexture[] = [];
  private readonly paved: MeshStandardMaterial[] = [];
  private readonly lit: { mat: MeshStandardMaterial; k: number }[] = [];
  private decalMat: MeshBasicMaterial | null = null;
  private capMats: MeshBasicMaterial[] = [];
  private fields: { f: LightField; day: number; night: number; px: number }[] = [];
  private rabbit: LightField | null = null;
  private guards: LightField | null = null;
  private papi: LightField | null = null;
  private readonly sock = new Group();
  private lastWet = -1;
  private readonly camPos = new Vector3();

  constructor(
    private readonly scene: Scene,
    quality: QualitySettings,
  ) {
    this.quality = quality;
    this.group.name = 'AirportWorld';
    this.buildSurfaces();
    this.buildMarkings();
    this.buildBuildings();
    this.buildTraffic();
    this.buildLights();
    this.buildOtherAirports();
    scene.add(this.group);
  }

  // ---------------------------------------------------------------------------
  private tex<T extends CanvasTexture>(t: T): T {
    this.textures.push(t);
    return t;
  }

  private add(
    geo: BufferGeometry,
    mat: MeshStandardMaterial | MeshBasicMaterial,
    cast: boolean,
    receive = true,
  ): Mesh {
    const m = new Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = receive;
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    this.group.add(m);
    return m;
  }

  private buildSurfaces(): void {
    const a = this.quality.anisotropy;
    const runwayTex = this.tex(asphaltTexture(11, [50, 52, 54], true, a));
    const taxiTex = this.tex(asphaltTexture(23, [76, 77, 78], false, a));
    const concTex = this.tex(concreteTexture(a));
    const runway = new MeshStandardMaterial({
      map: runwayTex,
      roughness: 0.88,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const taxi = new MeshStandardMaterial({
      map: taxiTex,
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const conc = new MeshStandardMaterial({
      map: concTex,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this.paved.push(runway, taxi, conc);

    this.add(flatRect(0, RW.z, RW.length + 120, RW.width, 0.03, 0, 16), runway, false);
    const taxiGeos: BufferGeometry[] = [];
    for (const s of [-1, 1])
      taxiGeos.push(flatRect(0, s * (RW.width / 2 + 3.75), RW.length + 120, 7.5, 0.028, 0, 16));
    taxiGeos.push(flatRect(0, TWY, RW.length + 80, 25, 0.03, 0, 16));
    for (const cx of CONNECTORS)
      taxiGeos.push(flatRect(cx, (-30 + TWY + 12.5) / 2, 23, -30 - (TWY + 12.5), 0.03, 0, 16));
    for (const ax of APRON_LINKS)
      taxiGeos.push(flatRect(ax, (TWY - 12.5 - 250) / 2, 30, 250 + TWY - 12.5, 0.03, 0, 16));
    // 陸側道路、停車場、油庫聯絡道
    taxiGeos.push(flatRect(1150, -705, 5500, 14, 0.03, 0, 16));
    taxiGeos.push(flatRect(0, -752.5, 600, 75, 0.03, 0, 16));
    taxiGeos.push(flatRect(-1460, -751, 8, 78, 0.028, 0, 16));
    this.add(merge(taxiGeos), taxi, false);
    const concGeos = [
      flatRect(-300, -422.5, 2400, 345, 0.032, 0, 20),
      flatRect(1250, -266.25, 120, 127.5, 0.03, 0, 20),
    ];
    this.add(merge(concGeos), conc, false);

    // 胎痕與跑道號碼
    const tireTex = this.tex(tireMarksTexture(a));
    const tireMat = new MeshStandardMaterial({
      color: 0x0b0b0b,
      alphaMap: tireTex,
      transparent: true,
      depthWrite: false,
      roughness: 0.75,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.add(
      merge([flatRect(1270, 0, 420, 24, 0.045, Math.PI), flatRect(-1270, 0, 420, 24, 0.045, 0)]),
      tireMat,
      false,
    );
    for (const [txt, x, yaw] of [
      ['27', RW.thr27X - 52.5, Math.PI / 2],
      ['09', RW.thr09X + 52.5, -Math.PI / 2],
    ] as const) {
      const mat = new MeshStandardMaterial({
        color: 0xeeeeea,
        alphaMap: this.tex(designatorTexture(txt, a)),
        alphaTest: 0.5,
        roughness: 0.7,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      });
      this.add(flatRect(x, 0, 8, 9, 0.05, yaw), mat, false);
    }
  }

  private buildMarkings(): void {
    const white: BufferGeometry[] = [];
    const yellow: BufferGeometry[] = [];
    const Y = 0.05;
    for (const [thrX, s] of [
      [RW.thr27X, -1],
      [RW.thr09X, 1],
    ] as const) {
      // 跑道頭條紋 12 條
      for (let k = 0; k < 6; k++) {
        for (const side of [-1, 1])
          white.push(flatRect(thrX + s * 21, side * (3.6 + k * 3.4), 30, 1.8, Y));
      }
      // 瞄準點
      for (const side of [-1, 1]) white.push(flatRect(thrX + s * 422.5, side * 12, 45, 6, Y));
      // 著陸區標線
      for (const [d, n] of [
        [150, 3],
        [300, 3],
        [600, 2],
        [750, 2],
        [900, 1],
      ] as const) {
        for (let j = 0; j < n; j++) {
          for (const side of [-1, 1])
            white.push(flatRect(thrX + s * (d + 11.25), side * (9.9 + j * 3.3), 22.5, 1.8, Y));
        }
      }
      // 防爆區黃色 V 形
      for (let k = 0; k < 3; k++) {
        const x0 = thrX - s * (6 + k * 18);
        for (const side of [-1, 1]) {
          const g = beam(
            new Vector3(x0, Y, 0),
            new Vector3(x0 - s * 17, Y, side * 20.5),
            0.9,
            0.01,
          );
          yellow.push(g);
        }
      }
    }
    for (let x = RW.thr27X - 80; x > RW.thr09X + 80; x -= 50)
      white.push(flatRect(x, 0, 30, 0.9, Y));
    for (const side of [-1, 1]) white.push(flatRect(0, side * 22.05, RW.length, 0.9, Y));
    // 停車格
    for (const z of [-735, -770]) {
      for (let x = -295; x <= 295; x += 2.7) white.push(flatRect(x, z, 0.12, 5, 0.05));
    }

    // 滑行道黃線
    yellow.push(flatRect(0, TWY, RW.length + 60, 0.2, Y));
    for (const cx of CONNECTORS) {
      yellow.push(flatRect(cx, (TWY - 22) / 2, 0.2, -22 - TWY, Y));
      // 等待位置標線：滑行道側兩實線、跑道側兩虛線
      yellow.push(flatRect(cx, -80.75, 23, 0.3, Y), flatRect(cx, -80.25, 23, 0.3, Y));
      for (let x = -11; x < 11; x += 2)
        yellow.push(
          flatRect(cx + x + 0.5, -79.75, 1, 0.3, Y),
          flatRect(cx + x + 0.5, -79.25, 1, 0.3, Y),
        );
    }
    for (const ax of APRON_LINKS) yellow.push(flatRect(ax, (TWY - 470) / 2, 0.2, TWY + 470, Y));
    yellow.push(flatRect(-300, -470, 2360, 0.2, Y));
    for (const sx of TERMINAL_STANDS) {
      yellow.push(flatRect(sx, -528, 0.2, 116, Y), flatRect(sx, -588, 4, 0.3, Y));
    }
    for (const sx of REMOTE_STANDS) {
      yellow.push(flatRect(sx, -290, 0.2, 80, Y), flatRect(sx, -282.1, 4, 0.3, Y));
    }
    const paint = (c: number): MeshStandardMaterial =>
      new MeshStandardMaterial({
        color: c,
        roughness: 0.65,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      });
    this.add(merge(white), paint(0xefefea), false);
    this.add(merge(yellow), paint(0xe8b21c), false);
  }

  private buildBuildings(): void {
    const a = this.quality.anisotropy;
    const wall = new MeshStandardMaterial({ color: 0xd8d5ce, roughness: 0.82 });
    const roof = new MeshStandardMaterial({ color: 0x6b7279, roughness: 0.45, metalness: 0.6 });
    const dark = new MeshStandardMaterial({ color: 0x33383d, roughness: 0.7, metalness: 0.2 });
    const red = new MeshStandardMaterial({ color: 0xb3261e, roughness: 0.55 });
    const white = new MeshStandardMaterial({ color: 0xeceae4, roughness: 0.5, metalness: 0.1 });
    const hangar = new MeshStandardMaterial({ color: 0xc3c9cf, roughness: 0.5, metalness: 0.45 });
    const { map, emissive } = facadeTextures(a);
    this.tex(map);
    this.tex(emissive);
    const facade = new MeshStandardMaterial({
      map,
      emissiveMap: emissive,
      emissive: 0xffffff,
      emissiveIntensity: 0,
      metalness: 0.85,
      roughness: 0.12,
    });
    const cabGlass = new MeshStandardMaterial({
      color: 0x1d2b33,
      emissive: 0xbfe8d8,
      emissiveIntensity: 0,
      metalness: 0.9,
      roughness: 0.08,
    });
    this.lit.push({ mat: facade, k: 1.6 }, { mat: cabGlass, k: 1.2 });

    const T = AIRPORT.terminal;
    const wallGeos: BufferGeometry[] = [box(T.x, 10, T.z, T.length, 20, T.depth)];
    const roofGeos: BufferGeometry[] = [box(T.x, 20.75, T.z, T.length + 20, 1.5, T.depth + 10)];
    const r = rng(5);
    for (let i = 0; i < 14; i++)
      roofGeos.push(
        box(
          T.x + (r() - 0.5) * (T.length - 60),
          22.5 + r(),
          T.z + (r() - 0.5) * 50,
          6 + r() * 10,
          2 + r() * 2,
          5 + r() * 6,
        ),
      );
    // 帷幕（南北兩面）
    const face = (z: number, yaw: number): BufferGeometry => {
      const g = new PlaneGeometry(T.length - 20, 15);
      const uv = g.getAttribute('uv');
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, uv.getX(i) * ((T.length - 20) / 40), uv.getY(i) * 0.75);
      g.rotateY(yaw);
      g.translate(T.x, 8.5, z);
      return g;
    };
    this.add(
      merge([face(T.z + T.depth / 2 + 0.06, 0), face(T.z - T.depth / 2 - 0.06, Math.PI)]),
      facade,
      false,
    );

    // 空橋（伸向機位 L1 門，-100 機位收回）
    const bridges: BufferGeometry[] = [];
    const legs: BufferGeometry[] = [];
    const faceZ = T.z + T.depth / 2;
    for (const sx of TERMINAL_STANDS) {
      const start = new Vector3(sx - 24, 4.6, faceZ + 3);
      const door = new Vector3(sx - 3.5, 4.6, TERMINAL_STAND_Z - 13.5);
      const end = sx === -100 ? start.clone().lerp(door, 0.62) : door;
      bridges.push(beam(start, end, 2.8, 3.0));
      bridges.push(new CylinderGeometry(2.4, 2.4, 3.4, 16).translate(start.x, 4.6, start.z));
      legs.push(box(start.x, 1.45, start.z, 1.2, 2.9, 1.2));
      const legP = start.clone().lerp(end, 0.72);
      for (const off of [-1, 1]) legs.push(box(legP.x + off * 1.1, 1.5, legP.z, 0.35, 3.0, 0.35));
      legs.push(box(legP.x, 0.35, legP.z, 3.2, 0.7, 1.2));
      bridges.push(box(end.x, 4.6, end.z, 3.4, 3.2, 3.4));
    }
    wallGeos.push(...bridges);
    const darkGeos: BufferGeometry[] = [...legs];

    // 塔台
    const TW = AIRPORT.tower;
    wallGeos.push(
      new CylinderGeometry(4, 4.8, 50, 20).translate(TW.x, 25, TW.z),
      box(TW.x, 4, TW.z + 14, 30, 8, 20),
    );
    roofGeos.push(
      new CylinderGeometry(7.8, 7.8, 1, 8).translate(TW.x, 49.9, TW.z),
      new CylinderGeometry(8.4, 8.4, 1, 8).translate(TW.x, 56.6, TW.z),
    );
    darkGeos.push(box(TW.x, 59.4, TW.z, 0.3, 4.6, 0.3));
    this.add(new CylinderGeometry(7.4, 6.2, 6, 8).translate(TW.x, 53.3, TW.z), cabGlass, true);

    // 機庫（拱形）
    const hangarGeos: BufferGeometry[] = [];
    const doorGeos: BufferGeometry[] = [];
    for (const hx of [-1440, -1370, -1300]) {
      const arch = new CylinderGeometry(30, 30, 70, 24, 1, true, Math.PI / 2, Math.PI);
      arch.rotateX(Math.PI / 2);
      arch.scale(1, 0.75, 1);
      hangarGeos.push(arch.translate(hx, 0, -560));
      hangarGeos.push(
        new CircleGeometry(30, 24, 0, Math.PI)
          .scale(1, 0.75, 1)
          .rotateY(Math.PI)
          .translate(hx, 0, -595),
      );
      doorGeos.push(
        new CircleGeometry(29.5, 24, 0, Math.PI).scale(1, 0.75, 1).translate(hx, 0, -525),
      );
    }
    this.add(merge(hangarGeos), hangar, true);
    this.add(merge(doorGeos), dark, true);

    // 消防站、貨運站、油庫
    const fireGeos = [box(1250, 4.5, -300, 40, 9, 22)];
    for (let k = 0; k < 4; k++) fireGeos.push(box(1250 - 15 + k * 10, 3, -288.9, 8, 6, 0.3));
    this.add(merge(fireGeos), red, true);
    roofGeos.push(box(1250, 9.3, -300, 42, 0.6, 24));
    wallGeos.push(box(650, 7, -650, 180, 14, 70));
    const tankGeos: BufferGeometry[] = [];
    for (let k = 0; k < 4; k++)
      tankGeos.push(new CylinderGeometry(10, 10, 12, 28).translate(-1500 + k * 26, 6, -830));
    this.add(merge(tankGeos), white, true);

    // 高桿燈
    for (const [mx, mz] of MASTS) {
      darkGeos.push(
        new CylinderGeometry(0.3, 0.5, 28, 8).translate(mx, 14, mz),
        box(mx, 28.3, mz, 3.2, 0.6, 1.2),
      );
    }

    // ILS 天線與下滑台
    const ils = AIRPORT.ils27;
    for (let k = 0; k < 14; k++) {
      const z = -18.2 + k * 2.8;
      darkGeos.push(
        box(ils.locX, 1.25, z, 0.12, 2.5, 0.12),
        box(ils.locX, 2.5, z, 1.8, 0.08, 0.08),
      );
    }
    wallGeos.push(box(ils.locX, 1.3, -40, 4, 2.6, 3), box(ils.gsX, 1.3, ils.gsZ + 8, 3, 2.6, 3));
    darkGeos.push(
      box(ils.gsX, 7.5, ils.gsZ, 0.5, 15, 0.5),
      box(ils.gsX - 0.45, 9, ils.gsZ, 0.4, 1, 1.2),
      box(ils.gsX - 0.45, 12, ils.gsZ, 0.4, 1, 1.2),
    );

    // 圍籬立柱
    const fence = { x0: -3800, x1: 3800, z0: -950, z1: 500 };
    const fenceLen = [fence.x1 - fence.x0, fence.z1 - fence.z0];
    for (let x = fence.x0; x <= fence.x1; x += 15)
      darkGeos.push(box(x, 1.3, fence.z0, 0.1, 2.6, 0.1), box(x, 1.3, fence.z1, 0.1, 2.6, 0.1));
    for (let z = fence.z0; z <= fence.z1; z += 15)
      darkGeos.push(box(fence.x0, 1.3, z, 0.1, 2.6, 0.1), box(fence.x1, 1.3, z, 0.1, 2.6, 0.1));
    const link = this.tex(chainLinkTexture());
    const fenceMat = new MeshStandardMaterial({
      color: 0x8c9296,
      alphaMap: link,
      alphaTest: 0.45,
      side: DoubleSide,
      metalness: 0.5,
      roughness: 0.5,
    });
    const fp = (cx: number, cz: number, len: number, yaw: number): BufferGeometry => {
      const g = new PlaneGeometry(len, 2.4);
      const uv = g.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * len) / 3, uv.getY(i));
      return g.rotateY(yaw).translate(cx, 1.2, cz);
    };
    this.add(
      merge([
        fp(0, fence.z0, fenceLen[0], 0),
        fp(0, fence.z1, fenceLen[0], 0),
        fp(fence.x0, (fence.z0 + fence.z1) / 2, fenceLen[1], Math.PI / 2),
        fp(fence.x1, (fence.z0 + fence.z1) / 2, fenceLen[1], Math.PI / 2),
      ]),
      fenceMat,
      false,
      false,
    );

    // 風向袋
    darkGeos.push(new CylinderGeometry(0.06, 0.1, 6.5, 8).translate(1330, 3.25, -75));
    const sockGeo = new ConeGeometry(0.45, 3.6, 14, 5, true);
    const pos = sockGeo.getAttribute('position');
    const colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const band = Math.min(4, Math.floor((pos.getY(i) + 1.8) / 0.72));
      if (band % 2 === 0) colors.push(1, 0.32, 0.05);
      else colors.push(0.95, 0.95, 0.95);
    }
    sockGeo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    sockGeo.rotateX(Math.PI / 2).translate(0, 0, 1.8);
    const sockMesh = new Mesh(
      sockGeo,
      new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.8 }),
    );
    sockMesh.castShadow = true;
    this.sock.add(sockMesh);
    this.sock.position.set(1330, 6.4, -75);
    this.sock.rotation.order = 'YXZ';
    this.group.add(this.sock);

    this.add(merge(wallGeos), wall, true);
    this.add(merge(roofGeos), roof, true);
    this.add(merge(darkGeos), dark, true);

    // 夜間地面泛光 decal
    const glowTex = this.tex(radialTexture());
    this.decalMat = new MeshBasicMaterial({
      map: glowTex,
      color: new Color(1, 0.78, 0.5),
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const decal = this.add(
      merge(MASTS.map(([mx, mz]) => flatRect(mx, mz, 120, 120, 0.07))),
      this.decalMat,
      false,
      false,
    );
    decal.renderOrder = 2;
  }

  /** 停放客機（通用窄體，無真實航空公司塗裝）與地勤車輛、停車場車輛 */
  private buildTraffic(): void {
    const rot = (g: BufferGeometry): BufferGeometry => g.rotateX(Math.PI / 2);
    const body: BufferGeometry[] = [
      rot(new CylinderGeometry(1.95, 1.95, 26, 20)).translate(0, 3.9, 1),
      new SphereGeometry(1.95, 20, 12).scale(1, 0.95, 2.6).translate(0, 3.9, -12),
      rot(new ConeGeometry(1.95, 7, 20)).translate(0, 4.3, 17.5),
      box(-9.5, 2.9, 1.5, 16, 0.4, 4.2, 0.45),
      box(9.5, 2.9, 1.5, 16, 0.4, 4.2, -0.45),
      box(0, 2.9, 0.5, 4, 0.5, 6),
      box(-3.2, 4.6, 17.2, 6, 0.25, 2.4, 0.55),
      box(3.2, 4.6, 17.2, 6, 0.25, 2.4, -0.55),
      box(-5.8, 2.7, -1.5, 0.4, 1, 3),
      box(5.8, 2.7, -1.5, 0.4, 1, 3),
    ];
    const accent: BufferGeometry[] = [
      new BoxGeometry(0.35, 6.5, 4).rotateX(0.5).translate(0, 8.6, 17.3),
      rot(new CylinderGeometry(1.1, 0.9, 4.2, 16)).translate(-5.8, 1.9, -2.5),
      rot(new CylinderGeometry(1.1, 0.9, 4.2, 16)).translate(5.8, 1.9, -2.5),
    ];
    const darkG: BufferGeometry[] = [
      box(0, 1.1, -11.5, 0.2, 1.9, 0.2),
      box(0, 0.375, -11.5, 0.9, 0.75, 0.75),
      box(0, 5.02, -15.2, 2.3, 0.42, 1.3),
    ];
    for (const s of [-1, 1]) {
      darkG.push(box(s * 3.8, 1.3, 2, 0.3, 2.2, 0.3), box(s * 3.8, 0.575, 2, 1.6, 1.15, 1.15));
      darkG.push(new CircleGeometry(0.95, 16).rotateY(Math.PI).translate(s * 5.8, 1.9, -4.62));
    }
    const stands: [number, number, number][] = [
      [-300, TERMINAL_STAND_Z, 0],
      [100, TERMINAL_STAND_Z, 0],
      [300, TERMINAL_STAND_Z, 0],
      [-420, -300, 180],
      [480, -300, 180],
      [780, -300, 180],
    ];
    const tails = [0x0f7f86, 0xb3322b, 0x1d3f7a, 0xe07b1a, 0x2f7d3b, 0x5d3a8a];
    const mk = (geos: BufferGeometry[], mat: MeshStandardMaterial): InstancedMesh => {
      const m = new InstancedMesh(merge(geos), mat, stands.length);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
      return m;
    };
    const bodyM = mk(
      body,
      new MeshStandardMaterial({ color: 0xf2f3f4, roughness: 0.35, metalness: 0.15 }),
    );
    const accentM = mk(
      accent,
      new MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.2 }),
    );
    const darkM = mk(darkG, new MeshStandardMaterial({ color: 0x1e2226, roughness: 0.6 }));
    const o = new Object3D();
    const c = new Color();
    stands.forEach(([x, z, h], k) => {
      o.position.set(x, 0, z);
      o.rotation.set(0, -h * DEG, 0);
      o.updateMatrix();
      for (const m of [bodyM, accentM, darkM]) m.setMatrixAt(k, o.matrix);
      accentM.setColorAt(k, c.setHex(tails[k % tails.length]));
    });
    for (const m of [bodyM, accentM, darkM]) m.computeBoundingSphere();

    // 地勤車輛
    const r = rng(77);
    const types: { s: [number, number, number]; c: number }[] = [
      { s: [3.2, 1.6, 2], c: 0xe0b020 },
      { s: [2.4, 1.2, 1.4], c: 0x7d8286 },
      { s: [10, 3.2, 2.6], c: 0xeeeeee },
      { s: [12, 3.1, 2.6], c: 0x2c5aa0 },
      { s: [7, 3.6, 2.5], c: 0xf0f0f0 },
      { s: [7, 1.4, 2], c: 0xd8a018 },
    ];
    const veh: { x: number; z: number; t: number; yaw: number }[] = [];
    for (const [sx, sz, h] of stands) {
      const n = 4 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) {
        const side = r() < 0.5 ? -1 : 1;
        const dx = side * (6 + r() * 14);
        const dz = (h === 0 ? 1 : -1) * (-10 + r() * 22);
        veh.push({
          x: sx + dx,
          z: sz + dz,
          t: Math.floor(r() * types.length),
          yaw: Math.floor(r() * 4) * (Math.PI / 2) + (r() - 0.5) * 0.2,
        });
      }
    }
    for (let i = 0; i < 18; i++)
      veh.push({
        x: -1400 + r() * 300,
        z: -470 + r() * 180,
        t: Math.floor(r() * types.length),
        yaw: r() * Math.PI,
      });
    const vGeo = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const vehM = new InstancedMesh(
      vGeo,
      new MeshStandardMaterial({ roughness: 0.5, metalness: 0.3 }),
      veh.length,
    );
    veh.forEach((v, k) => {
      const t = types[v.t];
      o.position.set(v.x, 0.05, v.z);
      o.rotation.set(0, v.yaw, 0);
      o.scale.set(t.s[0], t.s[1], t.s[2]);
      o.updateMatrix();
      vehM.setMatrixAt(k, o.matrix);
      vehM.setColorAt(k, c.setHex(t.c));
    });
    vehM.castShadow = true;
    vehM.receiveShadow = true;
    vehM.computeBoundingSphere();
    this.group.add(vehM);

    // 停車場車輛
    const cars: { x: number; z: number }[] = [];
    for (const z of [-735, -770]) {
      for (const dz of [-1.5, 1.5]) {
        for (let x = -294; x <= 294; x += 2.7) if (r() < 0.72) cars.push({ x, z: z + dz * 1.6 });
      }
    }
    const carM = new InstancedMesh(
      new BoxGeometry(1.8, 1.45, 4.4).translate(0, 0.72, 0),
      new MeshStandardMaterial({ roughness: 0.3, metalness: 0.6 }),
      cars.length,
    );
    const palette = [0xdedede, 0x1c1c1c, 0x8a8f94, 0x2d4c7a, 0x8d1f1f, 0xc8c2b4, 0x3a4a3a];
    o.scale.set(1, 1, 1);
    o.rotation.set(0, 0, 0);
    cars.forEach((p, k) => {
      o.position.set(p.x, 0.04, p.z);
      o.updateMatrix();
      carM.setMatrixAt(k, o.matrix);
      carM.setColorAt(k, c.setHex(palette[Math.floor(r() * palette.length)]));
    });
    carM.receiveShadow = true;
    carM.computeBoundingSphere();
    this.group.add(carM);
  }

  private buildLights(): void {
    const set = buildAirportLights();
    const beacons: LightDef[] = [
      light(AIRPORT.tower.x, AIRPORT.tower.height, AIRPORT.tower.z, LIGHT_COLORS.red, 0, 0, 1.4),
      ...[-1440, -1370, -1300].map((hx) => light(hx, 23, -560, LIGHT_COLORS.red, 0, 0, 1)),
      ...MASTS.map(([mx, mz]) => light(mx, 29, mz, LIGHT_COLORS.red, 0, 0, 0.8)),
      light(AIRPORT.ils27.gsX, 15.2, AIRPORT.ils27.gsZ, LIGHT_COLORS.red, 0, 0, 0.8),
    ];
    const mastHeads: LightDef[] = [];
    for (const [mx, mz] of MASTS)
      for (const dx of [-1.2, -0.4, 0.4, 1.2])
        mastHeads.push(light(mx + dx, 27.9, mz, LIGHT_COLORS.sodium, 0, 0, 1.2));
    this.addField(new LightField(set.elevated, { size: 0.55, minPx: 2, maxPx: 16 }), 0.35, 3.2, 1);
    this.addField(new LightField(set.inset, { size: 0.45, minPx: 2, maxPx: 12 }), 0.3, 2.6, 0.9);
    this.addField(new LightField(beacons, { size: 0.8, minPx: 2, maxPx: 12 }), 0.6, 3.5, 1);
    this.addField(new LightField(mastHeads, { size: 1.2, minPx: 2, maxPx: 20 }), 0, 2.4, 1.2);
    this.rabbit = new LightField(set.rabbit, { size: 0.9, minPx: 2.5, maxPx: 22 });
    this.guards = new LightField(set.guards, { size: 0.6, minPx: 2, maxPx: 14 });
    this.papi = new LightField(set.papi, { size: 1.2, minPx: 2.5, maxPx: 24 });
    this.group.add(this.rabbit.points, this.guards.points, this.papi.points);

    const caps = [
      makeCaps(set.elevated, 0.14, 0.32),
      makeCaps(set.inset, 0.2, 0.05),
      makeCaps(set.papi, 0.35, 0.5),
    ];
    for (const cm of caps) {
      this.capMats.push(cm.material as MeshBasicMaterial);
      this.group.add(cm);
    }
    const struct = new Mesh(
      merge(set.alsStructure),
      new MeshStandardMaterial({ color: 0x6e7479, roughness: 0.6, metalness: 0.4 }),
    );
    struct.castShadow = true;
    this.group.add(struct);
    // PAPI 燈箱
    const housings = set.papi.map((p) => box(p.x + 0.4, 0.55, p.z, 0.9, 0.9, 1.6));
    this.add(merge(housings), new MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.6 }), true);
  }

  private addField(f: LightField, day: number, night: number, px: number): void {
    this.fields.push({ f, day, night, px });
    this.group.add(f.points);
  }

  /** 周邊機場：以平台承載平坦跑道，遠景可見跑道燈 */
  private buildOtherAirports(): void {
    const pads: BufferGeometry[] = [];
    const strips: BufferGeometry[] = [];
    const defs: LightDef[] = [];
    for (const ap of OTHER_AIRPORTS) {
      const hr = ap.heading * DEG;
      const dx = Math.sin(hr);
      const dz = -Math.cos(hr);
      let minH = Infinity;
      let maxH = -Infinity;
      for (let t = -1500; t <= 1500; t += 150) {
        for (const w of [-60, 0, 60]) {
          const h = terrainHeight(ap.x + dx * t - dz * w, ap.z + dz * t + dx * w, 4);
          minH = Math.min(minH, h);
          maxH = Math.max(maxH, h);
        }
      }
      const top = Math.max(maxH, WORLD.seaLevelY + 2.5) + 1;
      const bottom = Math.min(minH, WORLD.seaLevelY) - 30;
      const yaw = -hr + Math.PI / 2; // 平台長軸對齊跑道方向
      pads.push(box(ap.x, (top + bottom) / 2, ap.z, 3400, top - bottom, 320, yaw));
      pads.push(
        box(ap.x - dz * 230, (top + bottom) / 2, ap.z + dx * 230, 900, top - bottom, 160, yaw),
      );
      strips.push(flatRect(ap.x, ap.z, 2900, 45, top + 0.05, yaw, 16));
      for (let t = -1450; t <= 1450; t += 60) {
        for (const w of [-24, 24])
          defs.push(
            light(ap.x + dx * t - dz * w, top + 0.4, ap.z + dz * t + dx * w, LIGHT_COLORS.white),
          );
      }
      for (let w = -21; w <= 21; w += 3) {
        defs.push(
          light(
            ap.x - dx * 1452 - dz * w,
            top + 0.4,
            ap.z - dz * 1452 + dx * w,
            LIGHT_COLORS.green,
          ),
        );
        defs.push(
          light(ap.x + dx * 1452 - dz * w, top + 0.4, ap.z + dz * 1452 + dx * w, LIGHT_COLORS.red),
        );
      }
      for (let d = 60; d <= 720; d += 60)
        defs.push(
          light(
            ap.x - dx * (1450 + d),
            top + 1.2,
            ap.z - dz * (1450 + d),
            LIGHT_COLORS.white,
            0,
            0,
            1.2,
          ),
        );
    }
    this.add(merge(pads), new MeshStandardMaterial({ color: 0x6f7a55, roughness: 0.95 }), false);
    this.add(merge(strips), this.paved[0], false);
    this.addField(new LightField(defs, { size: 0.8, minPx: 2, maxPx: 12 }), 0.2, 3.2, 1);
  }

  // ---------------------------------------------------------------------------
  update(frame: FrameContext): void {
    updateViewportUniform(frame.quality.renderScale);
    const night = frame.lighting.night;
    const w = frame.state.weather;
    const lowVis = 1 - smoothstep(600, 4000, w.visibility);
    const boost = 1 + lowVis * 1.6;

    for (const { f, day, night: nGain, px } of this.fields) {
      f.setGain((day + (nGain - day) * night) * boost, (1.3 + night * 1.6 + lowVis * 0.6) * px);
    }
    const capGain = (0.75 + 1.9 * night) * (1 + lowVis * 0.5);
    for (const m of this.capMats) m.color.setScalar(capGain);

    const baseGain = (0.35 + 2.9 * night) * boost;
    // ALS rabbit：每秒兩次由遠至近
    if (this.rabbit) {
      const n = this.rabbit.intensities.length;
      const phase = ((frame.time % 0.5) / 0.5) * (n + 3);
      for (let k = 0; k < n; k++)
        this.rabbit.intensities[k] = Math.max(0, 1 - Math.abs(phase - k) * 1.7) * 2.2;
      this.rabbit.markIntensities();
      this.rabbit.setGain(baseGain, 2 + night * 2);
    }
    // 跑道守衛燈交替
    if (this.guards) {
      const on = Math.floor(frame.time * 2) % 2;
      for (let k = 0; k < this.guards.intensities.length; k++)
        this.guards.intensities[k] = k % 2 === on ? 1.6 : 0.05;
      this.guards.markIntensities();
      this.guards.setGain(baseGain, 1.5 + night * 1.5);
    }
    // PAPI：依觀察者仰角
    if (this.papi) {
      frame.camera.getWorldPosition(this.camPos);
      const c = this.papi.colors;
      const pp = this.papi.positions;
      for (let k = 0; k < 4; k++) {
        const horiz = Math.hypot(this.camPos.x - pp[k * 3], this.camPos.z - pp[k * 3 + 2]);
        const elev = Math.atan2(this.camPos.y - pp[k * 3 + 1], Math.max(horiz, 1)) / DEG;
        const t = smoothstep(PAPI_THRESHOLDS[k] - 0.05, PAPI_THRESHOLDS[k] + 0.05, elev);
        c[k * 3] = 1;
        c[k * 3 + 1] = 0.08 + (0.93 - 0.08) * t;
        c[k * 3 + 2] = 0.05 + (0.8 - 0.05) * t;
      }
      this.papi.markColors();
      this.papi.setGain((0.9 + 2.8 * night) * boost, 2.2 + night * 1.5);
    }

    for (const { mat, k } of this.lit) mat.emissiveIntensity = night * k;
    if (this.decalMat) {
      this.decalMat.opacity = night * 0.55;
      this.decalMat.visible = night > 0.02;
    }

    // 濕跑道：粗糙度降低、顏色變深、反射增強
    const wet = Math.min(1, w.precipitation * 1.2);
    if (Math.abs(wet - this.lastWet) > 0.01) {
      this.lastWet = wet;
      this.paved.forEach((m, i) => {
        m.roughness = (i === 2 ? 0.85 : 0.9) - 0.6 * wet;
        m.color.setScalar(1 - 0.35 * wet);
        m.envMapIntensity = 1 + wet * 1.5;
      });
    }

    // 風向袋：指向下風；風弱時下垂
    const to = ((w.windDir + 180) % 360) * DEG;
    const spd = Math.min(1, w.windSpeed / 15);
    this.sock.rotation.y = Math.PI - to + Math.sin(frame.time * 2.3) * 0.05 * spd;
    this.sock.rotation.x = (1 - spd) * 1.2 + Math.sin(frame.time * 3.1) * 0.03;
  }

  setQuality(q: QualitySettings): void {
    this.quality = q;
    for (const t of this.textures) {
      if (t.anisotropy !== q.anisotropy) {
        t.anisotropy = q.anisotropy;
        t.needsUpdate = true;
      }
    }
  }

  dispose(): void {
    this.scene.remove(this.group);
    disposeTree(this.group);
  }
}
