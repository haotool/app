/**
 * 程序貼圖：可無縫重複的雜訊、水面法線、雲團密度。全部以 DataTexture 產生，無外部資源。
 */
import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  ClampToEdgeWrapping,
  UnsignedByteType,
} from 'three';

function hash(ix: number, iy: number, seed: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** 週期性 value noise（period 為格點數），用於可無縫重複的貼圖 */
function periodicNoise(x: number, y: number, period: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const x0 = ((ix % period) + period) % period;
  const y0 = ((iy % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const y1 = (y0 + 1) % period;
  const a = hash(x0, y0, seed);
  const b = hash(x1, y0, seed);
  const c = hash(x0, y1, seed);
  const d = hash(x1, y1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function periodicFbm(
  u: number,
  v: number,
  basePeriod: number,
  octaves: number,
  seed: number,
): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let p = basePeriod;
  for (let i = 0; i < octaves; i++) {
    sum += amp * periodicNoise(u * p, v * p, p, seed + i * 31);
    norm += amp;
    amp *= 0.5;
    p *= 2;
  }
  return sum / norm;
}

function finish(tex: DataTexture, anisotropy: number, repeat = true): DataTexture {
  tex.wrapS = tex.wrapT = repeat ? RepeatWrapping : ClampToEdgeWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = anisotropy;
  tex.colorSpace = NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** RGBA 各通道為不同頻率的 fbm（線性空間），地形細節與雲層使用 */
export function makeNoiseTexture(size: number, anisotropy: number): DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const i = (y * size + x) * 4;
      data[i] = periodicFbm(u, v, 4, 5, 11) * 255;
      data[i + 1] = periodicFbm(u, v, 8, 5, 23) * 255;
      data[i + 2] = periodicFbm(u, v, 32, 3, 37) * 255;
      data[i + 3] = periodicFbm(u, v, 16, 4, 53) * 255;
    }
  }
  return finish(new DataTexture(data, size, size, RGBAFormat, UnsignedByteType), anisotropy);
}

/** 水面法線貼圖（由週期性高度場有限差分求得） */
export function makeWaterNormalTexture(size: number, anisotropy: number): DataTexture {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      // 方向性波浪：拉伸座標讓波峰略呈長條
      h[y * size + x] = periodicFbm(u, v, 6, 5, 71) * 0.7 + periodicFbm(u, v, 12, 3, 97) * 0.3;
    }
  }
  const data = new Uint8Array(size * size * 4);
  const strength = 6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = h[y * size + ((x - 1 + size) % size)];
      const r = h[y * size + ((x + 1) % size)];
      const d = h[((y - 1 + size) % size) * size + x];
      const u = h[((y + 1) % size) * size + x];
      let nx = (l - r) * strength;
      let ny = (d - u) * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * size + x) * 4;
      data[i] = (nx * 0.5 + 0.5) * 255;
      data[i + 1] = (ny * 0.5 + 0.5) * 255;
      data[i + 2] = (nz * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  return finish(new DataTexture(data, size, size, RGBAFormat, UnsignedByteType), anisotropy);
}

/** 雲團密度貼圖：R = 柔邊團塊密度、G = 內部細節（用於明暗） */
export function makeCloudPuffTexture(size: number): DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const dx = u * 2 - 1;
      const dy = v * 2 - 1;
      const r = Math.sqrt(dx * dx + dy * dy);
      const n = periodicFbm(u, v, 4, 5, 131);
      const edge = 0.62 + (n - 0.5) * 0.55;
      const falloff = Math.max(0, 1 - Math.pow(r / Math.max(edge, 0.05), 2.2));
      const density = Math.min(1, falloff * (0.65 + n * 0.7));
      const i = (y * size + x) * 4;
      data[i] = density * 255;
      data[i + 1] = periodicFbm(u, v, 8, 4, 151) * 255;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }
  return finish(new DataTexture(data, size, size, RGBAFormat, UnsignedByteType), 1, false);
}
