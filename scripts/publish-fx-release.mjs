import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  normalizeBankSnapshot,
  normalizeMoneyboxSnapshot,
  validateReleaseManifest,
  validateCurrentRelease,
  validateProviderSnapshot,
  exportLegacyRates,
} from '../apps/shared/fx/index.ts';

export const sunsetAt = (activatedAt) =>
  activatedAt === null
    ? null
    : new Date(
        Math.max(Date.parse('2026-12-31T00:00:00Z'), Date.parse(activatedAt) + 30 * 86400000),
      ).toISOString();
export const bytesHash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function writeObject(root, data, prefix = 'objects') {
  const text = JSON.stringify(data) + '\n';
  const sha256 = bytesHash(text);
  const path = `${prefix}/${sha256}.json`;
  const destination = resolve(root, path);
  mkdirSync(dirname(destination), { recursive: true });
  if (existsSync(destination)) {
    if (readFileSync(destination, 'utf8') !== text) throw new Error('Immutable object conflict');
  } else writeFileSync(destination, text, { flag: 'wx' });
  return { path, sha256 };
}
function readPrevious(root) {
  if (!existsSync(resolve(root, 'current.json'))) return null;
  const current = JSON.parse(readFileSync(resolve(root, 'current.json'), 'utf8'));
  if (
    !validateCurrentRelease(current) ||
    current.releaseId !== current.manifest.sha256 ||
    current.manifest.path !== `releases/${current.releaseId}.json`
  )
    throw new Error('Invalid previous pointer');
  const manifest = readVerifiedObject(root, current.manifest);
  if (!validManifest(manifest)) throw new Error('Invalid previous manifest');
  validateManifestReferences(root, manifest);
  return manifest;
}

function readVerifiedObject(root, reference) {
  if (
    !reference ||
    !/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.json$/.test(reference.path) ||
    !/^[a-f0-9]{64}$/.test(reference.sha256)
  ) {
    throw new Error('Invalid release object reference');
  }
  const bytes = readFileSync(resolve(root, reference.path));
  if (bytesHash(bytes) !== reference.sha256)
    throw new Error(`Invalid object hash: ${reference.path}`);
  return JSON.parse(bytes.toString('utf8'));
}

function validManifest(value) {
  return (
    validateReleaseManifest(value) &&
    value.providers.length > 0 &&
    new Set(value.providers.map((provider) => provider.providerId)).size ===
      value.providers.length &&
    new Set(value.history.map((entry) => `${entry.providerId}:${entry.date}`)).size ===
      value.history.length
  );
}

function validateManifestReferences(root, manifest) {
  // ponytail: 14-day carry-forward ceiling covers known market holidays; use an
  // explicit storedAt/provider calendar when a provider exposes one.
  const maxCarryForwardDays = 14;
  const dateNumber = (date) => Date.parse(`${date}T00:00:00Z`);
  for (const provider of manifest.providers) {
    const snapshot = readVerifiedObject(root, provider.snapshot);
    if (
      !validateProviderSnapshot(snapshot) ||
      snapshot.providerId !== provider.providerId ||
      snapshot.quotes.length === 0
    ) {
      throw new Error(`Invalid provider snapshot: ${provider.providerId}`);
    }
  }
  for (const entry of manifest.history) {
    const snapshot = readVerifiedObject(root, entry.snapshot);
    if (
      !validateProviderSnapshot(snapshot) ||
      snapshot.providerId !== entry.providerId ||
      snapshot.quotes.length === 0
    ) {
      throw new Error(`Invalid history snapshot: ${entry.providerId}/${entry.date}`);
    }
    const timeZone = { bot: 'Asia/Taipei', moneybox: 'Asia/Seoul' }[snapshot.providerId];
    if (!timeZone) throw new Error(`Unknown history provider timezone: ${snapshot.providerId}`);
    const declaredDates = new Set(
      snapshot.quotes.flatMap((quote) =>
        [
          quote.sourceQuote.sourcePublishedAt,
          quote.sourceQuote.fetchedAt,
          quote.sourceQuote.lastSuccessfulCheckAt,
        ]
          .filter((value) => value !== null)
          .map((value) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(value))),
      ),
    );
    const generatedDate = new Intl.DateTimeFormat('en-CA', { timeZone }).format(
      new Date(manifest.generatedAt),
    );
    const sourceDate = [...declaredDates].sort().at(-1);
    // History date is the calendar day on which the snapshot was stored. A
    // weekend/holiday snapshot may carry the previous published board date.
    if (
      declaredDates.size === 0 ||
      !sourceDate ||
      dateNumber(entry.date) < dateNumber(sourceDate) ||
      (dateNumber(entry.date) - dateNumber(sourceDate)) / 86400000 > maxCarryForwardDays ||
      entry.date > generatedDate
    ) {
      throw new Error(`History date mismatch: ${entry.providerId}/${entry.date}`);
    }
  }
}
export async function publishRelease(root, inputs, now = new Date().toISOString(), history) {
  const previous = readPrevious(root);
  // 每個 provider 保留自身最後一次檢查結果；本輪未執行的 provider 不改寫狀態。
  const providers = new Map((previous?.providers ?? []).map((p) => [p.providerId, p]));
  const snapshots = new Map();
  for (const [providerId, input] of Object.entries(inputs)) {
    if (input === null) {
      const prior = providers.get(providerId);
      if (prior) providers.set(providerId, { ...prior, checkStatus: 'failed' });
      continue;
    }
    const normalizer = { bot: normalizeBankSnapshot, moneybox: normalizeMoneyboxSnapshot }[
      providerId
    ];
    if (!normalizer) throw new Error(`Unknown provider adapter: ${providerId}`);
    const data = { schemaVersion: '3.0', providerId, quotes: normalizer(input) };
    if (!data.quotes.length || !validateProviderSnapshot(data))
      throw new Error('Empty or invalid provider snapshot');
    const snapshot = writeObject(root, data);
    const prior = providers.get(providerId);
    // 內容與狀態皆未變時沿用既有條目，避免每輪產生新 release 造成 commit／purge churn。
    if (prior?.checkStatus === 'ok' && prior.snapshot.sha256 === snapshot.sha256) {
      snapshots.set(providerId, data);
      continue;
    }
    providers.set(providerId, {
      providerId,
      snapshot,
      checkStatus: 'ok',
      lastSuccessfulCheckAt: now,
    });
    snapshots.set(providerId, data);
  }
  if (!providers.size) throw new Error('No verified provider snapshot');
  const nextProviders = [...providers.values()].sort((a, b) =>
    a.providerId < b.providerId ? -1 : a.providerId > b.providerId ? 1 : 0,
  );
  if (
    previous &&
    history === undefined &&
    JSON.stringify(nextProviders) === JSON.stringify(previous.providers)
  ) {
    const current = JSON.parse(readFileSync(resolve(root, 'current.json'), 'utf8'));
    return { current, manifest: previous, snapshots, unchanged: true };
  }
  const activatedAt = previous?.deprecation.activatedAt ?? null;
  const manifest = {
    schemaVersion: '3.0',
    generatedAt: now,
    providers: nextProviders,
    history: history ?? previous?.history ?? [],
    deprecation: {
      activatedAt,
      sunsetAt: sunsetAt(activatedAt),
      replacement: 'https://app.haotool.org/ratewise/open-data/',
    },
  };
  if (!validManifest(manifest)) throw new Error('Invalid release manifest');
  validateManifestReferences(root, manifest);
  const ref = writeObject(root, manifest, 'releases');
  const current = { schemaVersion: '3.0', releaseId: ref.sha256, manifest: ref };
  // Only this mutable pointer is replaced; failures above leave last-known-good intact.
  writeFileSync(resolve(root, 'current.json.tmp'), JSON.stringify(current) + '\n');
  renameSync(resolve(root, 'current.json.tmp'), resolve(root, 'current.json'));
  return { current, manifest, snapshots };
}
/** v2 prices are projected from original source fields, never a reciprocal of rounded v3 rates. */
export function legacyPayload(snapshot, original) {
  const mapped = exportLegacyRates(snapshot.quotes, snapshot.providerId);
  if (snapshot.providerId === 'moneybox')
    return {
      ...original,
      deprecated: true,
      replacement: 'public/rates/v3/current.json',
      rates: Object.fromEntries(
        Object.entries(mapped).map(([code, row]) => [
          code,
          {
            ...original.rates?.[code],
            buy: row.buy === null ? null : Number(row.buy),
            sell: row.sell === null ? null : Number(row.sell),
          },
        ]),
      ),
    };
  const details = Object.fromEntries(
    Object.entries(mapped).map(([code, row]) => [
      code,
      {
        ...(original.details?.[code] ?? {}),
        cash: {
          ...(original.details?.[code]?.cash ?? {}),
          buy: row.cashBuy == null ? null : Number(row.cashBuy),
          sell: row.cashSell == null ? null : Number(row.cashSell),
        },
        spot: {
          ...(original.details?.[code]?.spot ?? {}),
          buy: row.spotBuy == null ? null : Number(row.spotBuy),
          sell: row.spotSell == null ? null : Number(row.spotSell),
        },
      },
    ]),
  );
  return {
    ...original,
    deprecated: true,
    replacement: 'public/rates/v3/current.json',
    details,
    rates: Object.fromEntries(
      Object.entries(details).flatMap(([code, row]) =>
        row.cash.sell === null ? [] : [[code, row.cash.sell]],
      ),
    ),
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dataRoot = resolve(process.env.FX_DATA_ROOT ?? 'public/rates');
  const provider = process.env.FX_PROVIDER;
  if (!['bot', 'moneybox'].includes(provider))
    throw new Error('FX_PROVIDER must be bot or moneybox');
  const path = resolve(
    dataRoot,
    provider === 'bot' ? 'latest.json' : 'providers/moneybox/latest.json',
  );
  const input = process.env.FX_FETCH_FAILED === '1' ? null : JSON.parse(readFileSync(path, 'utf8'));
  // v3 發布不得改寫 v2 latest.json（expand–contract：v2 棄用標記待 S4 公開切換時處理）。
  const result = await publishRelease(resolve(dataRoot, 'v3'), { [provider]: input });
  console.log(result.unchanged ? 'v3 release unchanged' : `v3 release ${result.current.releaseId}`);
}
