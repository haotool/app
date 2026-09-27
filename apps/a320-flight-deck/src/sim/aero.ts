/**
 * 空氣動力係數模型（簡化但物理一致的穩定導數模型）。
 * 升力受 AoA / 襟縫翼 / 擾流板 / 地面效應 / 結冰影響；阻力受 AoA、起落架、襟翼、擾流板、Mach 影響。
 * FBW 以同一模型做動態反演（NDI），確保控制律與物理一致。
 */
import { AIRCRAFT, DEG } from './constants';

export const S = AIRCRAFT.wing.area;
export const CBAR = AIRCRAFT.wing.mac;
export const BSPAN = 34.1;

export const CM_DE = -1.3; // /rad，升降舵後緣下 → 低頭
export const CM_THS = 2.2; // /rad，THS 機頭上
export const CL_DA = 0.045; // /rad
export const CL_SP = 0.04; // 滿擾流板差動
export const CN_DR = 0.12; // /rad，方向舵後緣右 → 機鼻右

export interface AeroInput {
  alpha: number; // rad
  beta: number; // rad
  pHat: number; // 無因次角速度
  qHat: number;
  rHat: number;
  mach: number;
  flaps: number; // deg
  slats: number; // deg
  gear: number; // 0..1
  spoilerL: number; // 0..1 平均展開
  spoilerR: number;
  heightOverSpan: number; // 地面效應
  ice: number; // 0..1
}

export interface AeroSurfaces {
  elevator: number; // rad
  ths: number; // rad
  aileron: number; // rad，(L-R)/2，右滾為正
  rudder: number; // rad
}

export interface AeroCoeffs {
  cl: number;
  cd: number;
  cy: number;
  cRoll: number; // 右翼下為正
  cm: number; // 抬頭為正
  cn: number; // 機鼻右為正
  alphaStall: number; // rad
}

/** 失速迎角（依縫翼與結冰） */
export function stallAlpha(slats: number, ice: number): number {
  return (13.5 + (slats / 27) * 3.5 - ice * 4) * DEG;
}

/** 基本升力（不含操縱面），供 FBW 與性能速度計算 */
export function liftCoefficient(alpha: number, flaps: number, slats: number, ice: number): number {
  const a0 = -2.8 * DEG; // 零升迎角（機身基準）
  const dFlap = (flaps / 40) * 1.0 + (slats / 27) * 0.12;
  const aStall = stallAlpha(slats, ice);
  const clLin = 5.1 * (alpha - a0) + dFlap;
  if (alpha <= aStall) return clLin;
  // 失速後升力下降（平滑）
  const over = alpha - aStall;
  const clMax = 5.1 * (aStall - a0) + dFlap;
  return clMax - 2.2 * over - 6 * over * over;
}

export function computeAero(i: AeroInput, sf: AeroSurfaces, out: AeroCoeffs): AeroCoeffs {
  const spoilerMean = (i.spoilerL + i.spoilerR) / 2;
  const gef = Math.max(0, 1 - i.heightOverSpan); // 地面效應因子
  let cl = liftCoefficient(i.alpha, i.flaps, i.slats, i.ice);
  cl *= 1 + 0.08 * gef * gef;
  cl -= spoilerMean * 0.55;
  cl += 0.35 * sf.elevator * -1; // 升降舵後緣下增升（小）
  cl += 0.3 * i.qHat;

  const ar = (BSPAN * BSPAN) / S;
  const k = 1 / (Math.PI * 0.8 * ar);
  const hb = Math.max(i.heightOverSpan, 0.02);
  const groundK = (16 * hb * hb) / (1 + 16 * hb * hb);
  const machDrag = i.mach > 0.74 ? 18 * Math.pow(i.mach - 0.74, 2.6) : 0;
  const aStall = stallAlpha(i.slats, i.ice);
  const postStall = i.alpha > aStall ? (i.alpha - aStall) * 1.2 : 0;
  const cd =
    0.0215 +
    k * cl * cl * Math.min(1, groundK + 0.15) +
    i.flaps * 0.0013 +
    i.slats * 0.0004 +
    i.gear * 0.019 +
    spoilerMean * 0.085 +
    Math.abs(i.beta) * 0.18 +
    machDrag +
    postStall +
    i.ice * 0.012;

  const cy = -0.95 * i.beta - 0.15 * sf.rudder;

  const cRoll =
    -0.09 * i.beta +
    CL_DA * sf.aileron +
    CL_SP * (i.spoilerR - i.spoilerL) -
    0.5 * i.pHat +
    0.12 * i.rHat +
    0.012 * sf.rudder;

  const cm =
    -0.02 +
    -1.2 * i.alpha +
    CM_DE * sf.elevator +
    CM_THS * sf.ths -
    18 * i.qHat -
    (i.flaps / 40) * 0.06 +
    i.gear * 0.004 +
    spoilerMean * 0.02 -
    (i.alpha > aStall ? (i.alpha - aStall) * 1.5 : 0);

  const cn = 0.11 * i.beta - 0.17 * i.rHat - 0.03 * i.pHat + CN_DR * sf.rudder - 0.005 * sf.aileron;

  out.cl = cl;
  out.cd = cd;
  out.cy = cy;
  out.cRoll = cRoll;
  out.cm = cm;
  out.cn = cn;
  out.alphaStall = aStall;
  return out;
}

/** 依組態的 CLmax（性能速度） */
export function clMaxFor(flaps: number, slats: number, ice: number): number {
  return liftCoefficient(stallAlpha(slats, ice), flaps, slats, ice);
}
