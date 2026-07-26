import Phaser from 'phaser';
import { loadAssets } from '../core/assetLoader';
import { entriesForPhase } from '../core/assetPlan';
import { SceneKeys } from '../core/types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  // 首屏只載 boot 階段（§115）：其餘資產於進關卡／開圖鑑時才載，
  // 未標註 phase 的條目一併算 boot，確保漏標不會缺圖。
  preload(): void {
    loadAssets(this, entriesForPhase('boot'));
  }

  create(): void {
    this.scene.start(SceneKeys.Title);
  }
}
