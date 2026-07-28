import type Phaser from 'phaser';
import type { EnemyKind } from '../core/types';

// 敵人面向 SSOT：全素材基準朝右（素材慣例見 apps/starpuff/docs/GAME_DESIGN.md），
// 「flipX=true ⟺ 面向左」的對應關係全遊戲僅在 setFacingBySign 一處定義。

// 速度死區：|vx| ≤ ε 不改面向（維持最後朝向），防近零速抖動——gusty／cometa 的
// 正弦漂移每週期兩次過零、Arcade 夾停與折返瞬間 vx 短暫近零。取 1 px/s：低於全部
// 移動速度常數最小值（MAGNO_WALK_SPEED=34）的 3%，高於物理引擎浮點噪音數個數量級。
export const FACING_VELOCITY_EPSILON = 1;

// 以符號設定面向：sign > 0 朝右、sign < 0 朝左、sign = 0 維持不變。
export function setFacingBySign(sprite: Phaser.GameObjects.Sprite, sign: number): void {
  if (sign !== 0) sprite.setFlipX(sign < 0);
}

// 移動態面向：跟隨水平速度符號，死區內維持最後朝向。
export function setFacingFromVelocityX(sprite: Phaser.GameObjects.Sprite, vx: number): void {
  if (Math.abs(vx) > FACING_VELOCITY_EPSILON) setFacingBySign(sprite, vx);
}

// 瞄準／前搖態面向：朝向目標 x（重疊時維持不變）。
export function setFacingTowardX(sprite: Phaser.GameObjects.Sprite, targetX: number): void {
  setFacingBySign(sprite, targetX - sprite.x);
}

// 方向性素材品種：素材有左右朝向，update 必須同步面向——表驅動守門遍歷此表
// （enemyFacing.test.ts），新增品種漏設面向即測試轉紅。
export const DIRECTIONAL_ENEMY_KINDS = [
  'shelly',
  'drilly',
  'gusty',
  'boomy',
  'mirri',
  'cometa',
  'cargo',
  'foamy',
  'frosty',
  'manta',
  // §123：複製噗鏡像行走、稜蜂正面反射（面向＝反射面）、裂隙怪瞬移後朝向、
  // 小熊市緩走拋箭——素材皆具左右朝向。
  'copypuff',
  'prismbee',
  'riftling',
  'bearlet',
] as const satisfies readonly EnemyKind[];

// 非方向性素材品種：正面或對稱構圖，flip 無視覺語意（magno／splatta 雖會走動，
// 但臉部為正面構圖僅持物不對稱；ticketa／scanna 素材對稱，既有 flip 呼叫無害；
// §123 datamote 塵粒／gravitybub 圓泡／orbiton 球體皆對稱構圖）。
export const NON_DIRECTIONAL_ENEMY_KINDS = [
  'jelly',
  'floaty',
  'spiky',
  'puffy',
  'chompy',
  'zappy',
  'glowy',
  'spora',
  'magno',
  'bubbla',
  'splatta',
  'twinkla',
  'ticketa',
  'scanna',
  'datamote',
  'gravitybub',
  'orbiton',
] as const satisfies readonly EnemyKind[];

// 完整性守門（型別層）：兩清單聯集必須覆蓋全部 EnemyKind——新增品種未歸類，
// UnclassifiedKind 非 never，下行賦值即 typecheck 失敗（集合層守門見測試）。
type ClassifiedKind =
  | (typeof DIRECTIONAL_ENEMY_KINDS)[number]
  | (typeof NON_DIRECTIONAL_ENEMY_KINDS)[number];
type UnclassifiedKind = Exclude<EnemyKind, ClassifiedKind>;
const kindClassificationExhaustive: UnclassifiedKind extends never ? true : never = true;
void kindClassificationExhaustive;
