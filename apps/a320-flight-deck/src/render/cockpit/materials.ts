/**
 * 座艙共用材質：Airbus 灰藍霧面內裝、深色遮光板、刷紋金屬、布面座椅。所有材質關閉霧效（座艙內不受大氣霧影響）。
 */
import {
  CanvasTexture,
  DoubleSide,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Material,
} from 'three';

export interface CockpitMaterials {
  lining: MeshStandardMaterial;
  panel: MeshStandardMaterial;
  trim: MeshStandardMaterial;
  dark: MeshStandardMaterial;
  carpet: MeshStandardMaterial;
  knob: MeshStandardMaterial;
  knobCap: MeshStandardMaterial;
  cap: MeshStandardMaterial;
  metal: MeshStandardMaterial;
  seat: MeshStandardMaterial;
  seatFrame: MeshStandardMaterial;
  frame: MeshStandardMaterial;
  red: MeshPhysicalMaterial;
  black: MeshStandardMaterial;
  rubber: MeshStandardMaterial;
  white: MeshStandardMaterial;
  glass: MeshPhysicalMaterial;
  bezel: MeshStandardMaterial;
  screenBlack: MeshBasicMaterial;
  all: Material[];
}

/** 布面紋理：細密編織 + 縫線，讓座椅不是塑膠感 */
function fabricTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  if (!g) return null;
  g.fillStyle = '#3a4550';
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    g.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
    g.fillRect(0, y, 256, 1);
  }
  for (let x = 0; x < 256; x += 3) {
    g.fillStyle = 'rgba(0,0,0,0.05)';
    g.fillRect(x, 0, 1, 256);
  }
  g.strokeStyle = 'rgba(20,24,28,0.8)';
  g.setLineDash([4, 3]);
  g.lineWidth = 2;
  g.strokeRect(12, 12, 232, 232);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  return t;
}

export function createMaterials(): CockpitMaterials {
  const std = (color: number, roughness: number, metalness = 0): MeshStandardMaterial =>
    new MeshStandardMaterial({ color, roughness, metalness, fog: false });
  const fabric = fabricTexture();
  const seat = std(0xffffff, 0.95);
  if (fabric) seat.map = fabric;
  else seat.color.set(0x3a4550);

  const m: Omit<CockpitMaterials, 'all'> = {
    lining: std(0x9aa4ad, 0.88),
    panel: std(0x55636f, 0.8, 0.05),
    trim: std(0x3b444d, 0.75, 0.05),
    dark: std(0x16191d, 0.97),
    carpet: std(0x2d3237, 1),
    knob: std(0x1f2226, 0.55, 0.1),
    knobCap: std(0x9ea4aa, 0.35, 0.8),
    cap: std(0xffffff, 0.42, 0.05),
    metal: std(0x8c9298, 0.38, 0.85),
    seat,
    seatFrame: std(0x2a2f35, 0.6, 0.3),
    frame: std(0x4a545d, 0.7, 0.1),
    red: new MeshPhysicalMaterial({ color: 0xb3141a, roughness: 0.3, clearcoat: 0.6, fog: false }),
    black: std(0x0d0e10, 0.5),
    rubber: std(0x121314, 0.95),
    white: std(0xe8e8e2, 0.6),
    glass: new MeshPhysicalMaterial({
      color: 0xd4e2dc,
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      side: DoubleSide,
      envMapIntensity: 0.9,
      specularIntensity: 1,
      fog: false,
    }),
    bezel: std(0x24292e, 0.6, 0.1),
    screenBlack: new MeshBasicMaterial({ color: 0x000000, toneMapped: false, fog: false }),
  };
  return { ...m, all: Object.values(m) };
}
