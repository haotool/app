/**
 * A320neo 幾何/性能與虛構機場 XHAO 配置。外部模型、座艙、物理、渲染共用此檔。
 * 機體座標：+X 右、+Y 上、-Z 機鼻；原點 = 重心，位於機身中心線。
 */
import type { Waypoint } from './types';

export const G = 9.80665;
export const KT = 0.514444; // m/s per kt
export const FT = 0.3048; // m per ft
export const NM = 1852; // m
export const DEG = Math.PI / 180;

export const AIRCRAFT = {
  length: 37.57,
  span: 35.8,
  height: 11.76,
  fuselageRadius: 1.98, // 寬 3.95 m
  fuselageHeight: 4.14,
  noseZ: -17.9, // 機鼻尖
  tailZ: 19.67, // 尾椎末端
  cockpitWindshieldZ: -15.6,
  /** 機身中心線在靜態停放時離地高度（m） */
  centerlineHeight: 3.9,
  wing: {
    rootLeZ: -3.6, // 翼根前緣（x = 1.95）
    rootX: 1.95,
    rootY: -1.25,
    rootChord: 6.1,
    tipX: 17.05,
    tipChord: 1.55,
    leSweepDeg: 27.5,
    dihedralDeg: 5.1,
    area: 122.6,
    mac: 4.29,
    sharkletHeight: 2.43,
  },
  hstab: {
    rootLeZ: 14.2,
    rootX: 0.9,
    span: 12.45,
    rootChord: 3.8,
    tipChord: 1.4,
    y: 0.7,
    sweepDeg: 30,
  },
  vfin: { rootLeZ: 11.4, height: 6.2, rootChord: 5.9, tipChord: 2.1, sweepDeg: 36, baseY: 1.8 },
  engine: {
    x: 5.75, // 左右對稱
    y: -2.15, // 短艙中心線
    inletZ: -7.1,
    length: 4.9,
    radius: 1.22, // 短艙外半徑
    fanRadius: 0.99,
  },
  /** 起落架輪胎接地點（伸出且未壓縮時；靜態壓縮約 0.15 m），[nose, left main, right main]；strutTop 為支柱上端鉸點 y */
  gear: [
    { x: 0, y: -4.05, z: -11.25, strutTop: -1.7, wheelRadius: 0.39 },
    { x: -3.795, y: -4.05, z: 1.39, strutTop: -1.35, wheelRadius: 0.585 },
    { x: 3.795, y: -4.05, z: 1.39, strutTop: -1.35, wheelRadius: 0.585 },
  ],
  /** 駕駛眼位（機體座標） */
  eyeCaptain: { x: -0.53, y: 0.62, z: -14.55 },
  eyeFo: { x: 0.53, y: 0.62, z: -14.55 },
  inertia: { ixx: 1.35e6, iyy: 3.9e6, izz: 5.05e6 }, // roll/pitch/yaw kg·m²
  emptyMass: 44_300,
  mtow: 79_000,
};

/** 襟翼設定：[手柄位置] → 縫翼/襟翼角度與 VFE */
export const FLAP_TABLE = [
  { handle: 0, config: '0', slats: 0, flaps: 0, vfe: 350 },
  { handle: 1, config: '1', slats: 18, flaps: 0, vfe: 230 },
  { handle: 1, config: '1+F', slats: 18, flaps: 10, vfe: 215 },
  { handle: 2, config: '2', slats: 22, flaps: 15, vfe: 200 },
  { handle: 3, config: '3', slats: 22, flaps: 20, vfe: 185 },
  { handle: 4, config: 'FULL', slats: 27, flaps: 40, vfe: 177 },
] as const;

/** 油門桿卡位（TLA 度） */
export const TLA = { MAX_REV: -20, REV_IDLE: -6, IDLE: 0, CL: 22.5, FLX: 35, TOGA: 45 };

// ---------------------------------------------------------------------------
// 機場 XHAO（虛構）：跑道 09/27，中心於世界原點，沿 x 軸；北側為航站區
// ---------------------------------------------------------------------------
export const AIRPORT = {
  icao: 'XHAO',
  name: 'Haotool Bay Intl',
  elevationFt: 0,
  runway: {
    ident: '27',
    reciprocal: '09',
    heading: 270, // 27 起降方向：向西（-x）
    length: 3200,
    width: 45,
    /** 27 跑道頭（東端）與 09 跑道頭（西端）世界 x */
    thr27X: 1600,
    thr09X: -1600,
    z: 0,
    touchdownX: 1300, // 27 著陸瞄準點
  },
  ils27: {
    ident: 'IHAO',
    freq: 109.5,
    course: 270,
    gsAngle: 3,
    locX: -1900, // 航向台天線（跑道西端外）
    gsX: 1300, // 下滑台（瞄準點旁）
    gsZ: 120,
    tchFt: 50,
  },
  papi27: { x: 1300, z: 36, side: 'left' as const },
  /** 平行滑行道 A（北側）與聯絡道 */
  taxiwayZ: -190,
  apron: { xMin: -900, xMax: 900, zMin: -520, zMax: -250 },
  terminal: { x: 0, z: -640, length: 820, depth: 90 },
  tower: { x: 1050, z: -420, height: 62 },
  /** 起飛待命點（27 跑道頭對正） */
  lineupPosition: { x: 1560, z: 0, heading: 270 },
  /** 停機位（冷艙與 Free Flight 起始） */
  gate: { x: -120, z: -300, heading: 180 },
  /** 地形在此範圍內壓平為 0 m */
  flattenHalfX: 4200,
  flattenHalfZ: 1800,
};

/** 預設航路：27 起飛 → 西 → 北山區 → 東 → 南側海岸 → ILS 27 */
export const DEFAULT_ROUTE: Waypoint[] = [
  { ident: 'RW27', x: 1600, z: 0, kind: 'RWY' },
  { ident: 'HAO01', x: -12000, z: 0, kind: 'WPT', alt: { type: 'AT_OR_ABOVE', ft: 4000 } },
  { ident: 'NORTH', x: -17000, z: -15000, kind: 'VOR' },
  { ident: 'RIDGE', x: 9000, z: -22000, kind: 'WPT' },
  { ident: 'HAO04', x: 30000, z: -9000, kind: 'WPT' },
  {
    ident: 'BAYSD',
    x: 31000,
    z: 9000,
    kind: 'IAF',
    alt: { type: 'AT_OR_BELOW', ft: 6000 },
    spd: 220,
  },
  { ident: 'CI27', x: 22000, z: 0, kind: 'WPT', alt: { type: 'AT', ft: 3000 }, spd: 180 },
  { ident: 'FF27', x: 10860, z: 0, kind: 'FAF', alt: { type: 'AT', ft: 1640 } },
  { ident: 'RW27', x: 1600, z: 0, kind: 'RWY', alt: { type: 'AT', ft: 50 } },
];

export const DEFAULT_CRZ_FL = 110;

/** 導航台（ND 顯示用） */
export const NAVAIDS = [
  { ident: 'HAO', kind: 'VOR' as const, x: -300, z: -900, freq: 113.1 },
  { ident: 'NTH', kind: 'VOR' as const, x: -17000, z: -15000, freq: 116.4 },
  { ident: 'BY', kind: 'NDB' as const, x: 26000, z: 4000, freq: 385 },
];

/** 其他機場（ND ARPT 顯示；外觀僅在遠景以簡化跑道呈現） */
export const OTHER_AIRPORTS = [
  { icao: 'XNRD', x: -34000, z: -38000, heading: 330 },
  { icao: 'XBAY', x: 46000, z: 26000, heading: 60 },
];

/** 世界範圍（地形覆蓋） */
export const WORLD = { halfSize: 64_000, seaLevelY: -1.5 };
