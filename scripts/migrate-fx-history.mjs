import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  normalizeBankSnapshot,
  normalizeMoneyboxSnapshot,
  exportLegacyRates,
  validateProviderSnapshot,
} from '../apps/shared/fx/runtime.mjs';
import { bytesHash, writeObject } from './publish-fx-release.mjs';

const SUPPORTED_SOURCE_VERSIONS = new Set([undefined, null, 'legacy', '2.0']);

/** Fixed git commit is the only input: no network, no guessed timestamps, no silent omissions. */
export function migrateHistory(revision, output) {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('A full data commit SHA is required');
  const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', revision], {
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter((path) =>
      /^public\/rates\/(?:providers\/moneybox\/)?history\/\d{4}-\d{2}-\d{2}\.json$/.test(path),
    );
  if (!paths.length) throw new Error('No daily histories at revision');
  const entries = [],
    history = [];
  mkdirSync(output, { recursive: true });
  for (const path of paths) {
    const raw = execFileSync('git', ['show', `${revision}:${path}`]);
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
      const quotes = (providerId === 'bot' ? normalizeBankSnapshot : normalizeMoneyboxSnapshot)(
        quoteInput,
      );
      if (!quotes.length) throw new Error('No provable sides');
      const snapshot = { schemaVersion: '3.0', providerId, quotes };
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
  writeFileSync(resolve(output, 'migration.json'), JSON.stringify(result, null, 2) + '\n');
  writeFileSync(resolve(output, 'history-index.json'), JSON.stringify(history) + '\n');
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = migrateHistory(
    process.argv[2],
    resolve(process.argv[3] ?? 'screenshots/fx-migration'),
  );
  console.log(
    JSON.stringify({
      revision: result.revision,
      total: result.total,
      converted: result.converted,
      quarantined: result.quarantined,
    }),
  );
}
