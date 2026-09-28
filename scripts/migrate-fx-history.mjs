import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HISTORY_WINDOW_DAYS } from '../apps/shared/fx/history.mjs';
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

function priorHistory(output) {
  const history = [];
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
    history.push(...index);
  }
  const current = readJson(resolve(output, 'current.json'));
  if (current !== null) {
    const path = current.manifest?.path;
    if (!/^releases\/[a-f0-9]{64}\.json$/.test(path ?? ''))
      throw new Error('Invalid previous release manifest reference');
    const manifest = readJson(resolve(output, path));
    if (!Array.isArray(manifest?.history)) throw new Error('Invalid previous release manifest');
    history.push(...manifest.history);
  }
  return history;
}

function retainedReference(output, previous, providerId, date) {
  const reference = previous.snapshot;
  if (
    !reference ||
    !/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.json$/.test(reference.path ?? '') ||
    !/^[a-f0-9]{64}$/.test(reference.sha256 ?? '')
  )
    throw new Error(
      `Missing previously published ${providerId} history for ${date}: invalid retained reference`,
    );
  const bytes = readFileSync(resolve(output, reference.path));
  if (bytesHash(bytes) !== reference.sha256)
    throw new Error(`Invalid previously published ${providerId} history object for ${date}`);
  const snapshot = JSON.parse(bytes.toString('utf8'));
  if (!validateProviderSnapshot(snapshot) || snapshot.providerId !== providerId)
    throw new Error(`Invalid previously published ${providerId} history object for ${date}`);
  return reference;
}

/** 以固定 commit 或指定資料目錄遷移；不連網、不猜時間。 */
export function migrateHistory(revision, output, dataRoot = null, now = new Date()) {
  if (!dataRoot && !/^[a-f\d]{40}$/i.test(revision))
    throw new Error('Git revision must be a full 40-character commit SHA');
  const previousHistory = dataRoot ? priorHistory(output) : [];
  const previousProviders = new Set(previousHistory.map((entry) => entry.providerId));
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
          if (error.code === 'ENOENT' && previousProviders.has(providerId))
            throw new Error(`Missing ${providerId} history directory: ${directory}`, {
              cause: error,
            });
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
  const dates = new Map();
  for (const entry of [
    ...previousHistory,
    ...paths.map((path) => ({
      providerId: path.includes('moneybox') ? 'moneybox' : 'bot',
      date: path.slice(-15, -5),
    })),
  ]) {
    if (!dates.has(entry.providerId)) dates.set(entry.providerId, new Set());
    dates.get(entry.providerId).add(entry.date);
  }
  const todayByProvider = {
    bot: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(now),
    moneybox: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now),
  };
  const earliest = new Date(`${todayByProvider.bot}T00:00:00Z`);
  earliest.setUTCDate(earliest.getUTCDate() - HISTORY_WINDOW_DAYS);
  const minimumBankDate = earliest.toISOString().slice(0, 10);
  const retainedDatesByProvider = new Map([
    [
      'bot',
      new Set(
        [...(dates.get('bot') ?? [])].filter(
          (date) => date >= minimumBankDate && date < todayByProvider.bot,
        ),
      ),
    ],
    [
      'moneybox',
      new Set(
        [...(dates.get('moneybox') ?? [])]
          .filter((date) => date <= todayByProvider.moneybox)
          .sort()
          .slice(-HISTORY_WINDOW_DAYS),
      ),
    ],
  ]);
  const previousByDate = new Map(
    previousHistory.map((entry) => [`${entry.providerId}:${entry.date}`, entry]),
  );
  const sourcePaths = new Set(paths);
  for (const { providerId, date } of previousHistory) {
    if (
      retainedDatesByProvider.get(providerId)?.has(date) &&
      !sourcePaths.has(
        `public/rates/${providerId === 'moneybox' ? 'providers/moneybox/' : ''}history/${date}.json`,
      )
    ) {
      throw new Error(`Missing previously published ${providerId} history source file for ${date}`);
    }
  }
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
      const previous = previousByDate.get(`${providerId}:${date}`);
      if (previous && retainedDatesByProvider.get(providerId)?.has(date)) {
        const reference = retainedReference(output, previous, providerId, date);
        history.push({ providerId, date, snapshot: reference });
        console.warn(
          `Retaining previously published ${providerId} history for ${date}: ${entry.reason}`,
        );
      }
    }
    entries.push(entry);
  }
  for (const [key, previous] of previousByDate) {
    const [providerId, date] = key.split(':');
    if (
      retainedDatesByProvider.get(providerId)?.has(date) &&
      !entries.some((entry) => entry.providerId === providerId && entry.date === date) &&
      !history.some((entry) => entry.providerId === providerId && entry.date === date)
    ) {
      const reference = retainedReference(output, previous, providerId, date);
      history.push({ providerId, date, snapshot: reference });
      entries.push({
        path: `public/rates/${providerId === 'moneybox' ? 'providers/moneybox/' : ''}history/${date}.json`,
        date,
        providerId,
        sourceHash: null,
        sourceVersion: null,
        methodVersion: '1',
        status: 'quarantined',
        reason: 'Historical source file is missing; retained the previously published snapshot',
        snapshot: reference,
      });
      console.warn(
        `Retaining previously published ${providerId} history for ${date}: source file missing`,
      );
    }
  }
  const result = {
    revision,
    total: entries.length,
    converted: entries.filter((e) => e.status === 'converted').length,
    quarantined: entries.filter((e) => e.status === 'quarantined').length,
    entries,
  };
  if (dataRoot && previousHistory.length) {
    for (const providerId of previousProviders) {
      if (!history.some((entry) => entry.providerId === providerId))
        throw new Error(`No retained ${providerId} history; previously published history exists`);
    }
  }
  if (!paths.length) throw new Error('No daily histories at revision');
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
