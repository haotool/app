import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  normalizeBankSnapshot,
  normalizeMoneyboxSnapshot,
  exportLegacyRates,
  validateProviderSnapshot,
  buildProviderSnapshot,
} from '../apps/shared/fx/index.ts';
import { bytesHash, writeObject } from './lib/fx-release-objects.mjs';
import { extractSeoulSnapshotDate, guardPublishedAt } from './fetch-moneybox-rates.js';

const SUPPORTED_SOURCE_VERSIONS = new Set([undefined, null, 'legacy', '2.0']);

function priorHistoryProviders(output) {
  const providers = new Set();
  const readJson = (path) => {
    try {
      return JSON.parse(readFileSync(path, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  };
  const index = readJson(resolve(output, 'history-index.json'));
  if (index !== null) {
    if (!Array.isArray(index)) throw new Error('Invalid previous history index');
    for (const entry of index) providers.add(entry.providerId);
  }
  const current = readJson(resolve(output, 'current.json'));
  if (current !== null) {
    const path = current.manifest?.path;
    if (!/^releases\/[a-f0-9]{64}\.json$/.test(path ?? ''))
      throw new Error('Invalid previous release manifest reference');
    const manifest = readJson(resolve(output, path));
    if (!Array.isArray(manifest?.history)) throw new Error('Invalid previous release manifest');
    for (const entry of manifest.history) providers.add(entry.providerId);
  }
  return providers;
}

/** 以固定 commit 或指定資料目錄遷移；不連網、不猜時間。 */
export function migrateHistory(revision, output, dataRoot = null) {
  const previousProviders = dataRoot ? priorHistoryProviders(output) : new Set();
  const paths = dataRoot
    ? ['history', 'providers/moneybox/history'].flatMap((folder) => {
        const directory = resolve(dataRoot, folder);
        try {
          return readdirSync(directory)
            .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
            .map((name) => `public/rates/${folder}/${name}`);
        } catch (error) {
          const providerId = folder.startsWith('providers/') ? 'moneybox' : 'bot';
          if (error.code === 'ENOENT' && !previousProviders.has(providerId)) return [];
          throw error;
        }
      })
    : execFileSync('git', ['ls-tree', '-r', '--name-only', revision], {
        encoding: 'utf8',
      })
        .trim()
        .split('\n')
        .filter((path) =>
          /^public\/rates\/(?:providers\/moneybox\/)?history\/\d{4}-\d{2}-\d{2}\.json$/.test(path),
        )
        .sort();
  paths.sort();
  if (!paths.length) throw new Error('No daily histories at revision');
  const entries = [],
    history = [];
  let previousMoneyboxPublishedAt = null;
  mkdirSync(output, { recursive: true });
  for (const path of paths) {
    const raw = dataRoot
      ? readFileSync(resolve(dataRoot, path.replace(/^public\/rates\//, '')))
      : execFileSync('git', ['show', `${revision}:${path}`]);
    const sourceHash = bytesHash(raw),
      providerId = path.includes('moneybox') ? 'moneybox' : 'bot',
      date = path.slice(-15, -5);
    const entry = {
      path,
      date,
      providerId,
      sourceHash,
      sourceVersion: null,
      methodVersion: '1',
      status: 'quarantined',
      reason: null,
    };
    // Preserve original bytes even when their semantics cannot be proved.
    const evidence = writeObject(
      output,
      { encoding: 'utf8', source: raw.toString('utf8') },
      'evidence',
    );
    entry.evidence = evidence;
    try {
      const data = JSON.parse(raw.toString('utf8'), (_key, value, context) =>
        typeof value === 'number' ? context.source : value,
      );
      entry.sourceVersion = data.schemaVersion ?? 'legacy';
      if (data.providerId != null && data.providerId !== providerId) {
        throw new Error('Historical provider identity mismatch');
      }
      if (!SUPPORTED_SOURCE_VERSIONS.has(data.schemaVersion)) {
        throw new Error(`Unsupported source schema: ${data.schemaVersion}`);
      }
      if (
        providerId === 'bot' &&
        (data.base !== 'TWD' || !/^Taiwan Bank(?: \(臺灣銀行牌告匯率\))?$/.test(data.source ?? ''))
      ) {
        throw new Error('Taiwan Bank identity mismatch');
      }
      if (
        providerId === 'moneybox' &&
        (data.base !== 'KRW' || !/^MoneyBox(?: \(明洞換匯所聯盟\))?$/.test(data.source ?? ''))
      ) {
        throw new Error('MoneyBox identity mismatch');
      }
      const quoteInput = { ...data, sourcePublishedAt: data.sourcePublishedAt ?? null };
      if (!quoteInput.timestamp && !quoteInput.fetchedAt)
        throw new Error('Missing evidenced fetch timestamp');
      if (providerId === 'moneybox') {
        if (extractSeoulSnapshotDate(data) !== date)
          throw new Error('MoneyBox history date differs from legacy Seoul snapshot date');
        const publishedAt = guardPublishedAt(
          data.sourcePublishedAt,
          data.fetchedAt ?? data.timestamp,
          previousMoneyboxPublishedAt,
        );
        quoteInput.sourcePublishedAt = publishedAt.value;
        if (publishedAt.status === 'known') previousMoneyboxPublishedAt = publishedAt.value;
      }
      const quotes = (providerId === 'bot' ? normalizeBankSnapshot : normalizeMoneyboxSnapshot)(
        quoteInput,
      );
      if (!quotes.length) throw new Error('No provable sides');
      const snapshot = buildProviderSnapshot(providerId, quotes);
      if (!validateProviderSnapshot(snapshot)) throw new Error('Invalid normalized snapshot');
      const legacy = exportLegacyRates(quotes, providerId);
      for (const [currency, row] of Object.entries(legacy)) {
        if (providerId === 'moneybox') {
          for (const side of ['buy', 'sell']) {
            const actual = row[side];
            const declared = data.rates[currency]?.[side];
            if (actual === null && declared == null) continue;
            if (actual === null || declared == null || Number(actual) !== Number(declared))
              throw new Error(`Legacy mismatch ${currency}.${side}`);
          }
        } else {
          const cashSell = row.cashSell;
          if (data.rates?.[currency] != null && Number(data.rates[currency]) !== Number(cashSell))
            throw new Error(`Conflicting legacy cash sell ${currency}`);
        }
      }
      const ref = writeObject(output, snapshot);
      Object.assign(entry, {
        status: 'converted',
        outputHash: ref.sha256,
        snapshot: ref,
        coverage: quotes
          .filter((q) => q.status === 'available')
          .map((q) => `${q.fromCurrency}->${q.toCurrency}:${q.sourceQuote.deliveryMethod}`),
        units: [...new Set(quotes.map((q) => q.sourceQuote.unitAmount))],
      });
      if (
        providerId === 'moneybox' &&
        Object.values(data.rates).some((row) => row.spbuy != null || row.spsell != null)
      )
        entry.unsupportedFields = ['spbuy', 'spsell'];
      history.push({ providerId, date, snapshot: ref });
    } catch (error) {
      entry.reason = error.message;
    }
    entries.push(entry);
  }
  const result = {
    revision,
    total: entries.length,
    converted: entries.filter((e) => e.status === 'converted').length,
    quarantined: entries.filter((e) => e.status === 'quarantined').length,
    entries,
  };
  const { revision: _revision, ...manifest } = result;
  writeFileSync(resolve(output, 'migration.json'), JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(resolve(output, 'history-index.json'), JSON.stringify(history) + '\n');
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dataRootIndex = process.argv.indexOf('--data-root');
  const dataRoot = dataRootIndex < 0 ? null : resolve(process.argv[dataRootIndex + 1]);
  if (dataRootIndex >= 0 && !process.argv[dataRootIndex + 1])
    throw new Error('--data-root requires a path');
  const revision = dataRoot
    ? execFileSync('git', ['-C', dataRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
    : process.argv[2];
  const outputIndex = process.argv.indexOf('--output');
  const output = resolve(
    outputIndex < 0
      ? dataRoot
        ? resolve(dataRoot, 'v3')
        : 'screenshots/fx-migration'
      : process.argv[outputIndex + 1],
  );
  const result = migrateHistory(revision, output, dataRoot);
  console.log(
    JSON.stringify({
      revision: result.revision,
      total: result.total,
      converted: result.converted,
      quarantined: result.quarantined,
    }),
  );
}
