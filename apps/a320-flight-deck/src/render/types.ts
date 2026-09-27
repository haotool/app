/**
 * 渲染模組共用契約。每個模組只讀 FrameContext，不修改 SimState。
 */
import type { Color, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { SimState } from '../sim/types';

export type QualityLevel = 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface QualitySettings {
  level: QualityLevel;
  shadows: boolean;
  shadowMapSize: number;
  /** 0 = billboard 最低；3 = 最高密度 */
  cloudDetail: 0 | 1 | 2 | 3;
  cityDensity: number; // 0..1
  terrainSegments: number; // 近距地形 tile 每邊分段
  treeCount: number;
  rainDrops: number;
  bloom: boolean;
  msaa: number; // 0 / 4
  anisotropy: number;
  renderScale: number; // 由 RenderScaleManager 動態調整 0.5..1
}

export interface LightingInfo {
  /** 指向太陽的單位向量（世界） */
  sunDirection: Vector3;
  sunColor: Color;
  sunIntensity: number;
  ambientIntensity: number;
  /** 0 = 白天、1 = 深夜 */
  night: number;
  /** 0..1 日出/日落暖色程度 */
  dusk: number;
  fogColor: Color;
  skyHorizonColor: Color;
}

export interface FrameContext {
  state: SimState;
  /** 真實渲染間隔（s），暫停時仍前進（供動畫） */
  dt: number;
  /** 牆鐘秒數（燈號閃爍、雨滴等純視覺動畫） */
  time: number;
  camera: PerspectiveCamera;
  /** 飛機渲染姿態（物理步之間插值；重播時為紀錄插值） */
  pose: { position: Vector3; quaternion: Quaternion };
  lighting: LightingInfo;
  quality: QualitySettings;
  cameraInCockpit: boolean;
  reducedMotion: boolean;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  ULTRA: {
    level: 'ULTRA',
    shadows: true,
    shadowMapSize: 4096,
    cloudDetail: 3,
    cityDensity: 1,
    terrainSegments: 96,
    treeCount: 14000,
    rainDrops: 9000,
    bloom: true,
    msaa: 4,
    anisotropy: 8,
    renderScale: 1,
  },
  HIGH: {
    level: 'HIGH',
    shadows: true,
    shadowMapSize: 2048,
    cloudDetail: 2,
    cityDensity: 0.75,
    terrainSegments: 64,
    treeCount: 8000,
    rainDrops: 6000,
    bloom: true,
    msaa: 4,
    anisotropy: 4,
    renderScale: 1,
  },
  MEDIUM: {
    level: 'MEDIUM',
    shadows: true,
    shadowMapSize: 1024,
    cloudDetail: 1,
    cityDensity: 0.45,
    terrainSegments: 40,
    treeCount: 3000,
    rainDrops: 3000,
    bloom: false,
    msaa: 0,
    anisotropy: 2,
    renderScale: 0.85,
  },
  LOW: {
    level: 'LOW',
    shadows: false,
    shadowMapSize: 512,
    cloudDetail: 0,
    cityDensity: 0.25,
    terrainSegments: 24,
    treeCount: 800,
    rainDrops: 1200,
    bloom: false,
    msaa: 0,
    anisotropy: 1,
    renderScale: 0.7,
  },
};
