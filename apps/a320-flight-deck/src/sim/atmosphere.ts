/**
 * ISA 大氣模型（對流層 + 平流層下段），含 ISA 偏差與 QNH。
 */
const T0 = 288.15;
const P0 = 101325;
const R = 287.05;
const LAPSE = 0.0065;
export const RHO0 = 1.225;

export interface AtmosphereSample {
  temperature: number; // K
  pressure: number; // Pa
  density: number; // kg/m³
  speedOfSound: number; // m/s
}

/** 依幾何高度（m）與 ISA 偏差（°C）取樣；out 重用避免配置 */
export function sampleAtmosphere(
  altM: number,
  isaDev: number,
  out: AtmosphereSample,
): AtmosphereSample {
  const h = Math.max(-500, altM);
  let tStd: number;
  let p: number;
  if (h < 11000) {
    tStd = T0 - LAPSE * h;
    p = P0 * Math.pow(tStd / T0, 5.25588);
  } else {
    tStd = 216.65;
    p = 22632 * Math.exp((-9.80665 * (h - 11000)) / (R * tStd));
  }
  const t = tStd + isaDev;
  out.temperature = t;
  out.pressure = p;
  out.density = p / (R * t);
  out.speedOfSound = Math.sqrt(1.4 * R * t);
  return out;
}

/** 標準氣壓高度（ft）：以 QNH 修正幾何高度 */
export function pressureAltitudeFt(altMslFt: number, qnhHpa: number): number {
  return altMslFt + (1013.25 - qnhHpa) * 27.3;
}

/** TAS → CAS（kt），含可壓縮性修正 */
export function tasToCas(tasMs: number, rho: number, pressure: number): number {
  const a0 = 340.294;
  const mach = tasMs / Math.sqrt((1.4 * pressure) / rho);
  const qc = pressure * (Math.pow(1 + 0.2 * mach * mach, 3.5) - 1);
  const cas = a0 * Math.sqrt(5 * (Math.pow(qc / P0 + 1, 2 / 7) - 1));
  return cas / 0.514444;
}
