// 分階段載入量稽核（W5a 素材接關）：輸出 boot 與指定關卡的 manifest 條目數與
// webp 總量，供接關前後效能對比（#857 效能預算硬驗收）。
// 用法：node scripts/asset-load-audit.mjs [levelId ...]（預設 1 21 26）
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import './lib/ts-bridge.mjs';

const { entriesForPhase, entriesForLevel, deferredEntriesForLevel } =
  await import('../src/game/core/assetPlan.ts');
const { LEVELS } = await import('../src/game/logic/levels.ts');

const levelIds = process.argv.slice(2).map(Number).filter(Number.isFinite);
const targets = levelIds.length > 0 ? levelIds : [1, 21, 26];

function sumBytes(entries) {
  let bytes = 0;
  for (const entry of entries) bytes += statSync(fileURLToPath(entry.url)).size;
  return bytes;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

const boot = entriesForPhase('boot');
console.log(`boot: ${boot.length} 條 ${kb(sumBytes(boot))}`);

for (const id of targets) {
  const level = LEVELS.find((entry) => entry.id === id);
  if (!level) {
    console.log(`L${id}: 不存在`);
    continue;
  }
  const entries = entriesForLevel(level, LEVELS);
  const deferred = deferredEntriesForLevel(level);
  console.log(
    `L${id}: 進場 ${entries.length} 條 ${kb(sumBytes(entries))}｜開場後補載 ${deferred.length} 條 ${kb(sumBytes(deferred))}`,
  );
}
