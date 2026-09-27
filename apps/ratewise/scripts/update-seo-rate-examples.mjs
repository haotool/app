/** 牌告 SEO 投影：與 App 共用 v3 方向及 decimal 試算；不再發布外部參考率。 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { format, resolveConfig } from 'prettier';
import { RATES_API } from '../src/config/api-endpoints.ts';
import {
  normalizeBankSnapshot,
  normalizeMoneyboxSnapshot,
  estimate,
  boardMidpoint,
} from '../../shared/fx/runtime.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(ROOT, 'src/config/generated/seo-rate-examples.ts');
const OPTIONAL_MODE = process.env.SEO_RATE_EXAMPLES_OPTIONAL === '1';
const formatDateInTaipei = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
const MONEYBOX_CDN_URL = RATES_API.moneyboxCdn;

export function buildSeoExamples(bankPayload, moneyboxPayload = null) {
  const bank = normalizeBankSnapshot(bankPayload).filter(
    (q) => q.sourceQuote.deliveryMethod === 'cash',
  );
  if (!bank.length) throw new Error('No validated bank quotes');
  const shop =
    moneyboxPayload === null
      ? []
      : normalizeMoneyboxSnapshot(moneyboxPayload).filter(
          (q) => q.sourceQuote.subjectCurrency === 'TWD',
        );
  const results = {};
  for (const code of new Set(bank.map((q) => q.sourceQuote.subjectCurrency))) {
    const quotes = bank.filter((q) => q.sourceQuote.subjectCurrency === code);
    const source = quotes[0].sourceQuote;
    const outward = quotes.find((q) => q.fromCurrency === 'TWD');
    const example = estimate(outward, {
      fromCurrency: 'TWD',
      toCurrency: code,
      amount: '30000',
      mode: 'EXACT_IN',
    });
    results[code] = {
      exampleTWD: 30000,
      foreignAtCash: example.toAmount === null ? null : Number(example.toAmount),
      cashSell: source.sell === null ? null : Number(source.sell),
      cashBuy: source.buy === null ? null : Number(source.buy),
      bankMid: boardMidpoint(source) === null ? null : Number(boardMidpoint(source)),
      spotAvailable: normalizeBankSnapshot(bankPayload).some(
        (q) =>
          q.sourceQuote.subjectCurrency === code &&
          q.sourceQuote.deliveryMethod === 'account' &&
          q.status === 'available',
      ),
      sourcePublishedAt: source.sourcePublishedAt,
      fetchedAt: source.fetchedAt,
      quotes,
    };
    if (code === 'KRW' && shop.length) {
      const forward = shop.find(
        (q) => q.fromCurrency === 'TWD' && q.toCurrency === 'KRW' && q.status === 'available',
      );
      const reverse = shop.find(
        (q) => q.fromCurrency === 'KRW' && q.toCurrency === 'TWD' && q.status === 'available',
      );
      const sourceQuote = (forward ?? reverse)?.sourceQuote;
      if (sourceQuote && (forward || reverse)) {
        results[code].alternativeProviders = [
          {
            name: '明洞換匯所',
            nameEn: 'Myeongdong Exchange',
            providerId: sourceQuote.providerId,
            rate: forward?.rate == null ? null : Number(forward.rate),
            rateBuy: reverse?.rate == null ? null : Number(reverse.rate),
            source: 'MoneyBox',
            sourceUrl: sourceQuote.sourceUrl,
            sourcePublishedAt: sourceQuote.sourcePublishedAt,
            fetchedAt: sourceQuote.fetchedAt,
            note: '韓國明洞分店現場現鈔牌告試算；費用與鈔券交付條件須向業者確認。',
            quotes: shop,
          },
        ];
      }
    }
  }
  return results;
}

const TYPES = `import type { QuoteSnapshot } from '@app/shared/fx';
export interface AlternativeProvider {
  name: string; nameEn: string; providerId: string; rate: number | null; rateBuy: number | null;
  source: string; sourceUrl: string; sourcePublishedAt: string | null; fetchedAt: string;
  note: string; quotes: QuoteSnapshot[];
}
export interface RateExample {
  exampleTWD: number; foreignAtCash: number | null; cashSell: number | null; cashBuy: number | null;
  bankMid: number | null; spotAvailable: boolean; sourcePublishedAt: string | null; fetchedAt: string;
  quotes: QuoteSnapshot[]; alternativeProviders?: AlternativeProvider[];
}`;
export function renderSeoExamples(results, bankPayload) {
  const sourceTime = bankPayload.sourcePublishedAt ?? null;
  const fetchedAt = bankPayload.fetchedAt ?? bankPayload.timestamp;
  return `/** 自動生成：銀行／換錢所牌告快照；未知來源時間不推測。 */\n${TYPES}\nexport const SEO_RATE_EXAMPLES: Record<string, RateExample> = ${JSON.stringify(results, null, 2)};\nexport const SEO_RATE_EXAMPLES_UPDATE_TIME = ${JSON.stringify(sourceTime ?? '來源時間未知')};\n/** 擷取日期，非牌告生效日期。 */\nexport const SEO_RATE_EXAMPLES_DATE = ${JSON.stringify(formatDateInTaipei(new Date(fetchedAt)))};\n`;
}
async function fetchPayload(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
async function main() {
  const { values } = parseArgs({
    options: { 'bank-file': { type: 'string' }, 'moneybox-file': { type: 'string' } },
  });
  const bank = values['bank-file']
    ? JSON.parse(readFileSync(values['bank-file'], 'utf8'))
    : await fetchPayload(RATES_API.latestRaw);
  let shop = null;
  try {
    shop = values['moneybox-file']
      ? JSON.parse(readFileSync(values['moneybox-file'], 'utf8'))
      : values['bank-file']
        ? null
        : await fetchPayload(RATES_API.moneyboxRaw || MONEYBOX_CDN_URL);
  } catch (error) {
    console.warn(`MoneyBox unavailable; omit its comparison: ${error.message}`);
  }
  let results;
  try {
    results = buildSeoExamples(bank, shop);
  } catch (error) {
    if (shop === null) throw error;
    console.warn(`MoneyBox validation failed; omit its comparison: ${error.message}`);
    results = buildSeoExamples(bank, null);
  }
  const output = await format(renderSeoExamples(results, bank), {
    ...(await resolveConfig(OUTPUT)),
    filepath: OUTPUT,
  });
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, output);
  console.log(`SEO quote projection generated: ${Object.keys(results).length} currencies`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`SEO quote projection failed; existing artifact preserved: ${error.message}`);
    if (OPTIONAL_MODE) {
      console.warn('⚠️ prebuild 優雅降級模式：保留既有 SEO artifact。');
      process.exit(0);
    }
    process.exitCode = 1;
  });
}
