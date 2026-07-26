import { ASSETS, type AssetEntry, type AssetPhase } from './assets';
import type { BossKind, EnemyKind, TransformForm } from './types';
import type { LevelSpec } from '../logic/levels';
import { FORM_INTRO_LEVEL, TRANSFORM_FORMS } from '../logic/transform';

// 分階段載入計畫（§115）：純 TS，不 import phaser，vitest 直接對象。
// 「何時載入」由 assets.ts 的 phase 欄位決定；「哪一關要哪些」由 LevelSpec 派生，
// 兩者皆為單一真值，禁止在 scene 內散寫資產清單。

// 貼圖重用別名（§55/§60/§66/§76/§84）：多關共用同一張橫景，以 grade/ambience 區分。
// systems/background.ts 的 textureKeyOf 一律取用此表，避免第二份對照。
export const BG_TEXTURE_ALIAS: Record<string, string> = {
  'bg-gallery': 'bg-arena',
  'bg-cavern': 'bg-eclipse',
  'bg-mirror': 'bg-arena',
  'bg-lumen': 'bg-arena',
  'bg-magnetic': 'bg-eclipse',
  'bg-prism': 'bg-arena',
  'bg-valley': 'bg-kiln',
  'bg-kilnway': 'bg-kiln',
  'bg-kilnhall': 'bg-kiln',
  'bg-meteorfield': 'bg-astral',
  'bg-starcourt': 'bg-astral',
  'bg-voidcore': 'bg-astral',
};

export function bgTextureKey(bgKey: string): string {
  return `${BG_TEXTURE_ALIAS[bgKey] ?? bgKey}-l`;
}

// 小怪品種 → 貼圖鍵 SSOT：systems/enemies.ts 與載入計畫共用同一份對照。
export const ENEMY_TEXTURE_KEYS: Record<EnemyKind, string> = {
  jelly: 'minion-jelly',
  floaty: 'minion-floaty',
  spiky: 'minion-spiky',
  puffy: 'minion-puffy',
  chompy: 'minion-chompy',
  shelly: 'minion-shelly',
  zappy: 'minion-zappy',
  drilly: 'minion-drilly',
  glowy: 'minion-glowy',
  spora: 'minion-spora',
  gusty: 'minion-gusty',
  boomy: 'minion-boomy',
  magno: 'minion-magno',
  mirri: 'minion-mirri',
  bubbla: 'minion-bubbla',
  splatta: 'minion-splatta',
  twinkla: 'minion-twinkla',
  cometa: 'minion-cometa',
  // §120 星海終局篇新怪（#857 素材已交付，鍵名以素材命名為準）。
  cargo: 'minion-cargojelly',
  ticketa: 'minion-ticketbat',
  scanna: 'minion-scannereye',
  foamy: 'minion-bubbler',
  frosty: 'minion-iceslime',
  manta: 'minion-tideray',
};

// 佔位立繪鍵（素材未交付期間的 manifest 守門豁免）：運行期各自回退（enemies 以
// FALLBACK_COLORS generateTexture、player 以素身＋形態著色、CodexScene 以 fx-star
// 剪影）。§119/§120 十鍵已於 #857 素材交付後全數移除納回載入計畫（機械鎖見
// assetPlan.test 的 PENDING 三條守門）；未來新佔位鍵入列須顯式過審。
export const PENDING_TEXTURE_KEYS: readonly string[] = [];

// 魔王品種 → 立繪鍵：jellord 含暴走幀（logic/bossFsm 轉段切換）。
export const BOSS_TEXTURE_KEYS: Record<BossKind, readonly string[]> = {
  jellord: ['boss-idle', 'boss-enraged'],
  noctra: ['boss-noctra'],
  prismix: ['boss-prismix'],
  syrona: ['boss-syrona'],
  voidra: ['boss-voidra'],
};

// 魔王召喚品種（systems/bossFactory.ts 分派）：不在 enemyMix 內仍會登場，必須併入關卡計畫。
export const BOSS_SUMMON_KINDS: Record<BossKind, readonly EnemyKind[]> = {
  jellord: ['jelly'],
  noctra: ['floaty'],
  prismix: ['mirri'],
  syrona: ['bubbla'],
  voidra: [],
};

// 潮汐關生成替換（logic/tide.tideFilterKind：磁極怪浸水改果凍）與滿潮救援紮根品種
// （systems/waves.respawnRescue 固定 spora）：兩者皆不出現在 enemyMix，須顯式併入。
const TIDE_SUBSTITUTE_KINDS: readonly EnemyKind[] = ['jelly', 'spora'];

// 主角姿勢貼圖：每關都會用到、不屬任何單一關卡。對應 systems/player.ts 的 Pose 聯集
// （該型別未匯出，此處為鏡像宣告；新增姿勢須同步）。
const HERO_POSE_KEYS: readonly string[] = [
  'hero-idle',
  'hero-inhale',
  'hero-inhale-big-1',
  'hero-inhale-big-2',
  'hero-puffed',
  'hero-hurt',
];

// 形態立繪：變身可於關內任意時點觸發，故解鎖後每關都須備妥。鍵名由
// TRANSFORM_FORMS 派生（player.ts 以 `hero-${form}` 取用），新增形態自動跟進。
const FORM_TEXTURE_KEYS: readonly string[] = Object.keys(TRANSFORM_FORMS).map(
  (form) => `hero-${form}`,
);

// 形態立繪的關卡可用性（PR #886 R7）：FORM_INTRO_LEVEL 之前的關卡不載該形態
// 立繪——四張新形態圖曾被無條件塞進 form 階段，使 L1 進場多載 292.6KiB
//（侵蝕 #883 的分階段優化）。未列 FORM_INTRO_LEVEL 的形態（雷/殼/風）恆載。
export function formTextureKeysForLevel(levelId: number): string[] {
  return Object.keys(TRANSFORM_FORMS)
    .filter((form) => (FORM_INTRO_LEVEL[form as TransformForm] ?? 0) <= levelId)
    .map((form) => `hero-${form}`);
}

// 全關共用核心：與關卡無關、但每關都必須在場的貼圖（形態立繪全集；逐關納入
// 時機由 formTextureKeysForLevel 依 FORM_INTRO_LEVEL 收斂）。
export const SHARED_LEVEL_KEYS: readonly string[] = [...HERO_POSE_KEYS, ...FORM_TEXTURE_KEYS];

// 該關實際會用到的貼圖鍵：關卡限定（背景／道具／小怪／魔王，由 LevelSpec 派生）
// ＋全關共用核心（主角姿勢／形態立繪）。
export function levelAssetKeys(level: LevelSpec): string[] {
  const keys = new Set<string>([
    bgTextureKey(level.bgKey),
    ...HERO_POSE_KEYS,
    ...formTextureKeysForLevel(level.id),
  ]);
  for (const decor of level.decor) keys.add(decor.key);

  const kinds = new Set<EnemyKind>(level.enemyMix.map((entry) => entry.kind));
  for (const elite of level.elites) {
    kinds.add(elite.kind);
    kinds.add(elite.rewardFlavor);
  }
  for (const drill of level.drillSpawns ?? []) kinds.add(drill.kind);
  if (level.boss) {
    for (const key of BOSS_TEXTURE_KEYS[level.boss]) keys.add(key);
    for (const kind of BOSS_SUMMON_KINDS[level.boss]) kinds.add(kind);
  }
  if (level.tide !== undefined) for (const kind of TIDE_SUBSTITUTE_KINDS) kinds.add(kind);

  for (const kind of kinds) keys.add(ENEMY_TEXTURE_KEYS[kind]);
  return [...keys];
}

// 未標註 phase 一律視為 boot：漏標只拖慢首屏，不會缺圖（anti-softlock 安全預設）。
export function phaseOf(entry: AssetEntry): AssetPhase {
  return entry.phase ?? 'boot';
}

export function entriesForPhase(
  phase: AssetPhase,
  assets: readonly AssetEntry[] = ASSETS,
): AssetEntry[] {
  return assets.filter((entry) => phaseOf(entry) === phase);
}

// 關卡限定資產＝任一關會用到的鍵；其餘 level 階段條目為全關共用核心（主角姿勢等），
// 每關都要在場。以 LEVELS 派生而非前綴猜測，加關加怪自動跟進。
function levelScopedKeys(levels: readonly LevelSpec[]): Set<string> {
  const scoped = new Set<string>();
  for (const level of levels) for (const key of levelAssetKeys(level)) scoped.add(key);
  return scoped;
}

// 進入關卡要載入的條目：關卡限定資產取本關所需，共用核心全載，形態立繪隨關備妥
// （變身可於關內任意時點觸發，延後到解鎖瞬間會來不及）。
export function entriesForLevel(
  level: LevelSpec,
  levels: readonly LevelSpec[],
  assets: readonly AssetEntry[] = ASSETS,
): AssetEntry[] {
  const needed = new Set(levelAssetKeys(level));
  const scoped = levelScopedKeys(levels);
  return assets.filter((entry) => {
    const phase = phaseOf(entry);
    // 形態立繪依 FORM_INTRO_LEVEL 逐關納入（R7）；其餘 form 條目維持每關全載。
    if (phase === 'form') return !FORM_TEXTURE_KEYS.includes(entry.key) || needed.has(entry.key);
    if (phase !== 'level' && phase !== 'boss') return false;
    return scoped.has(entry.key) ? needed.has(entry.key) : true;
  });
}

// 圖鑑立繪：CODEX_MONSTERS 的 textureKey 由呼叫端提供，此處僅做 manifest 對照。
export function entriesForKeys(
  keys: readonly string[],
  assets: readonly AssetEntry[] = ASSETS,
): AssetEntry[] {
  const wanted = new Set(keys);
  return assets.filter((entry) => wanted.has(entry.key));
}
