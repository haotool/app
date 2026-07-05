/**
 * L3 品質守門（E5 copy 四層架構）。
 *
 * 涵蓋：
 * - AI 贅詞黑名單（可見文案全域掃描）
 * - 寫死匯率 lint（幣別頁 corpus 禁止匯率區間與括號年份）
 * - 無來源最高級宣稱（幣別頁 corpus）
 * - 跨幣別相似度上限（persona 敘述 bigram Jaccard）
 * - phrase budget（#566 SF-1 新模板句收斂＋高頻句上限）
 * - About FAQ 去機房語言與 answer 級自指涉掃描（#566 SF-2 / SF-3）
 * - 金額頁 v2（中文別名 title、answer-first description、階梯表純計算）
 */

import { describe, expect, it } from 'vitest';
import {
  ABOUT_PAGE_FAQ,
  ABOUT_PAGE_SEO,
  CARD_RATE_GUIDE_PAGE,
  CASH_VS_SPOT_RATE_PAGE,
  CURRENCY_PERSONAS,
  FAQ_PAGE_SEO,
  GUIDE_PAGE_SEO,
  HOMEPAGE_SEO,
  OPEN_DATA_PAGE_SEO,
  SELL_RATE_VS_MID_RATE_PAGE,
  buildForwardAmountLadder,
  buildPairAmountSeo,
  buildReverseAmountLadder,
  formatZhAmount,
  getAmountAnswerData,
  getCurrencyLandingPageContent,
  getReverseCurrencyLandingPageContent,
  type CurrencyLandingCode,
} from '../seo-metadata';
import { INDEXABLE_FORWARD_AMOUNTS, INDEXABLE_REVERSE_TWD_AMOUNTS } from '../seo-paths';
import { SEO_RATE_EXAMPLES } from '../generated/seo-rate-examples';

const ALL_CODES = Object.keys(CURRENCY_PERSONAS) as CurrencyLandingCode[];

interface FAQLike {
  question: string;
  answer: string;
}

/** 收集單一幣別頁（正向＋反向）的全部可見文案。 */
function collectCurrencyCopy(code: CurrencyLandingCode): string {
  const pages = [getCurrencyLandingPageContent(code), getReverseCurrencyLandingPageContent(code)];
  return pages
    .flatMap((page) => [
      page.title,
      page.description,
      page.travelTip,
      ...page.highlights,
      ...page.faqEntries.flatMap((f) => [f.question, f.answer]),
      ...(page.answerCapsule ?? []).flatMap((f) => [f.question, f.answer]),
    ])
    .join('\n');
}

/** 收集核心內容頁可見文案（首頁、FAQ、About、Guide、攻略頁、Open Data）。 */
function collectCorePageCopy(): string {
  const parts: string[] = [
    HOMEPAGE_SEO.description,
    HOMEPAGE_SEO.content.eyebrow,
    HOMEPAGE_SEO.content.heading,
    HOMEPAGE_SEO.content.intro,
    ...HOMEPAGE_SEO.content.highlights,
    ...HOMEPAGE_SEO.faqContent.flatMap((f: FAQLike) => [f.question, f.answer]),
    ...HOMEPAGE_SEO.answerCapsule.flatMap((f: FAQLike) => [f.question, f.answer]),
    FAQ_PAGE_SEO.title,
    FAQ_PAGE_SEO.description,
    ...(FAQ_PAGE_SEO.faqContent ?? []).flatMap((f: FAQLike) => [f.question, f.answer]),
    ...(FAQ_PAGE_SEO.answerCapsule ?? []).flatMap((f: FAQLike) => [f.question, f.answer]),
    ABOUT_PAGE_SEO.title ?? '',
    ABOUT_PAGE_SEO.description,
    ...(ABOUT_PAGE_SEO.faqContent ?? []).flatMap((f: FAQLike) => [f.question, f.answer]),
    ...(ABOUT_PAGE_SEO.answerCapsule ?? []).flatMap((f: FAQLike) => [f.question, f.answer]),
    GUIDE_PAGE_SEO.title ?? '',
    GUIDE_PAGE_SEO.description,
    OPEN_DATA_PAGE_SEO.title ?? '',
    OPEN_DATA_PAGE_SEO.description,
  ];
  for (const guide of [SELL_RATE_VS_MID_RATE_PAGE, CASH_VS_SPOT_RATE_PAGE, CARD_RATE_GUIDE_PAGE]) {
    parts.push(
      guide.title ?? '',
      guide.description,
      guide.heading,
      guide.intro,
      ...guide.highlights,
      ...guide.sections.flatMap((s) => [s.title, ...s.paragraphs]),
      ...(guide.faqContent ?? []).flatMap((f: FAQLike) => [f.question, f.answer]),
      guide.ctaTitle,
      guide.ctaDescription,
    );
  }
  return parts.join('\n');
}

function fullVisibleCopy(): string {
  return [collectCorePageCopy(), ...ALL_CODES.map(collectCurrencyCopy)].join('\n');
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

// ─── 1. AI 贅詞黑名單 ────────────────────────────────────────────────────────

describe('AI-trace guard：贅詞黑名單', () => {
  const BLACKLIST = /一次搞懂|一次看懂|值得注意的是|快速建立|完整解析|皆可追溯/;

  it('全站可見文案不得含 AI 贅詞黑名單', () => {
    const copy = fullVisibleCopy();
    const match = BLACKLIST.exec(copy);
    expect(match, `發現黑名單贅詞：「${match?.[0]}」`).toBeNull();
  });
});

// ─── 2. 寫死匯率 lint ────────────────────────────────────────────────────────

describe('AI-trace guard：寫死匯率 lint（幣別頁）', () => {
  // 匯率區間句式（如「24-25 台幣」）與括號年份（如「（2026 年）」）都會過期。
  const HARDCODED_RATE_RANGE = /\d+(\.\d+)?\s*[-~～]\s*\d+(\.\d+)?\s*(元)?台幣/;
  const PAREN_YEAR = /（\s*\d{4}\s*年\s*）/;

  it.each(ALL_CODES)('%s 幣別頁不得含寫死匯率區間或括號年份', (code) => {
    const copy = collectCurrencyCopy(code);
    expect(HARDCODED_RATE_RANGE.exec(copy)?.[0]).toBeUndefined();
    expect(PAREN_YEAR.exec(copy)?.[0]).toBeUndefined();
  });
});

// ─── 3. 無來源最高級宣稱 ─────────────────────────────────────────────────────

describe('AI-trace guard：無來源最高級宣稱（幣別頁）', () => {
  const SUPERLATIVES = /最便宜|最划算|最優惠/;

  it.each(ALL_CODES)('%s 幣別頁 FAQ 不得含「最便宜／最划算／最優惠」', (code) => {
    const copy = collectCurrencyCopy(code);
    expect(SUPERLATIVES.exec(copy)?.[0]).toBeUndefined();
  });
});

// ─── 4. 跨幣別相似度上限（persona 敘述） ─────────────────────────────────────

/** 移除數字、拉丁字母與標點後取中文字 bigram 集合。 */
function narrativeBigrams(text: string): Set<string> {
  const cjk = text.replace(/[^\u4e00-\u9fff]/g, '');
  const grams = new Set<string>();
  for (let i = 0; i < cjk.length - 1; i += 1) {
    grams.add(cjk.slice(i, i + 2));
  }
  return grams;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const gram of a) {
    if (b.has(gram)) intersection += 1;
  }
  return intersection / (a.size + b.size - intersection);
}

function personaNarrative(code: CurrencyLandingCode): string {
  const persona = CURRENCY_PERSONAS[code];
  return [
    persona.hook,
    persona.cashCulture,
    persona.denominationTip,
    persona.exchangeChannel,
    persona.travelTip,
    ...persona.faqSpecific.map((f) => f.answer),
    persona.reverse.travelTip,
    ...persona.reverse.faqSpecific.map((f) => f.answer),
  ].join('\n');
}

describe('cross-currency dedupe：persona 敘述唯一性', () => {
  it('任兩幣別 persona 敘述 bigram Jaccard 相似度須低於 0.5', () => {
    const grams = new Map(
      ALL_CODES.map((code) => [code, narrativeBigrams(personaNarrative(code))]),
    );
    for (let i = 0; i < ALL_CODES.length; i += 1) {
      for (let j = i + 1; j < ALL_CODES.length; j += 1) {
        const a = ALL_CODES[i]!;
        const b = ALL_CODES[j]!;
        const score = jaccard(grams.get(a)!, grams.get(b)!);
        expect(score, `${a} vs ${b} persona 敘述相似度 ${score.toFixed(3)} 超標`).toBeLessThan(0.5);
      }
    }
  });

  it.each(ALL_CODES)('%s persona 必填敘述欄位皆為實質內容（≥ 12 字）', (code) => {
    const persona = CURRENCY_PERSONAS[code];
    for (const field of [
      persona.hook,
      persona.cashCulture,
      persona.denominationTip,
      persona.exchangeChannel,
      persona.travelTip,
    ]) {
      expect(field.length).toBeGreaterThanOrEqual(12);
    }
  });

  it.each(ALL_CODES)('%s 正向 persona 特化 FAQ ≥ 3 題、反向 ≥ 1 題', (code) => {
    const persona = CURRENCY_PERSONAS[code];
    expect(persona.faqSpecific.length).toBeGreaterThanOrEqual(3);
    expect(persona.reverse.faqSpecific.length).toBeGreaterThanOrEqual(1);
  });

  it('description hook 不得跨幣別重複', () => {
    const hooks = ALL_CODES.map((code) => CURRENCY_PERSONAS[code].hook);
    expect(new Set(hooks).size).toBe(hooks.length);
  });
});

// ─── 5. phrase budget（#566 SF-1） ───────────────────────────────────────────

describe('phrase budget：模板句收斂', () => {
  const currencyCopy = () => ALL_CODES.map(collectCurrencyCopy).join('\n');

  // #566 SF-1：中性化過程產生的新同句式複製，重寫後不得回流。
  it.each(['實際價差每日變動', '各銀行牌價每日不同', '建議比較 2-3 家', '多方比較'])(
    '幣別頁不得再出現模板句「%s」',
    (phrase) => {
      expect(countOccurrences(currencyCopy(), phrase)).toBe(0);
    },
  );

  it('「約每 5 分鐘檢查更新」全站可見文案 ≤ 5 處', () => {
    expect(countOccurrences(fullVisibleCopy(), '約每 5 分鐘檢查更新')).toBeLessThanOrEqual(5);
  });

  it('「真正要付多少台幣」config 可見文案 ≤ 3 處', () => {
    expect(countOccurrences(fullVisibleCopy(), '真正要付多少台幣')).toBeLessThanOrEqual(3);
  });
});

// ─── 6. About FAQ 去機房語言與 answer 級自指涉掃描（#566 SF-2 / SF-3） ────────

describe('About FAQ 使用者導向（#566 SF-2 / SF-3）', () => {
  it('SF-2：匯差更新 FAQ 應為使用者視角問句、無搜尋引擎導向字眼', () => {
    const questions = ABOUT_PAGE_FAQ.map((f) => f.question);
    expect(questions).toContain('匯差數字多久更新一次？');
    for (const question of questions) {
      expect(question).not.toMatch(/搜尋引擎|爬蟲|SEO/);
    }
  });

  it('SF-3：ABOUT_PAGE_FAQ 全部 answer 不得含自指涉機房語言', () => {
    for (const faq of ABOUT_PAGE_FAQ) {
      expect(faq.answer).not.toMatch(
        /GPTBot|ClaudeBot|PerplexityBot|JSON-LD|schema\.org|SSG|預渲染|爬蟲|robots\.txt|Pull Request|TypeScript/i,
      );
    }
  });
});

// ─── 7. 金額頁 v2 ────────────────────────────────────────────────────────────

describe('amount page v2', () => {
  it('formatZhAmount 萬進位規則', () => {
    expect(formatZhAmount(50000)).toBe('5 萬');
    expect(formatZhAmount(30000)).toBe('3 萬');
    expect(formatZhAmount(100000)).toBe('10 萬');
    expect(formatZhAmount(5000000)).toBe('500 萬');
    expect(formatZhAmount(1000)).toBe('1,000');
    expect(formatZhAmount(3000)).toBe('3,000');
  });

  it('to-twd title 含中文金額別名雙寫法，且不含匯率數字（小數）', () => {
    const copy = buildPairAmountSeo(50000, 'KRW', '韓元', 'to-twd');
    expect(copy.title).toContain('5 萬韓元（50,000 KRW）換台幣是多少');
    expect(copy.title).not.toMatch(/\d+\.\d+/);
  });

  it('to-twd description 首句直接給雙向答案（現金買入＋現金賣出）', () => {
    const copy = buildPairAmountSeo(50000, 'KRW', '韓元', 'to-twd');
    const ex = SEO_RATE_EXAMPLES['KRW']!;
    const sellCost = Math.round(50000 * ex.cashSell);
    expect(copy.description).toContain('現金買入');
    expect(copy.description).toContain('現金賣出');
    expect(copy.description).toContain(sellCost.toLocaleString('zh-TW'));
  });

  it('twd-to-foreign description 首句直接給換算答案', () => {
    const copy = buildPairAmountSeo(30000, 'JPY', '日圓', 'twd-to-foreign');
    const ex = SEO_RATE_EXAMPLES['JPY']!;
    const foreign = Math.round(30000 / ex.cashSell);
    expect(copy.description).toContain(foreign.toLocaleString('zh-TW'));
    expect(copy.description).toContain('現金賣出');
  });

  it('正向階梯表列數與 INDEXABLE_FORWARD_AMOUNTS 一致且為純計算', () => {
    for (const code of ALL_CODES) {
      const rows = buildForwardAmountLadder(code);
      const amounts = INDEXABLE_FORWARD_AMOUNTS[code.toLowerCase()] ?? [];
      expect(rows.length, `${code} 階梯表列數`).toBe(amounts.length);
      const ex = SEO_RATE_EXAMPLES[code]!;
      for (const row of rows) {
        expect(row.twdAtCashSell).toBe(Math.round(row.amount * ex.cashSell));
      }
    }
  });

  it('反向階梯表列數與 INDEXABLE_REVERSE_TWD_AMOUNTS 一致且為純計算', () => {
    for (const code of ALL_CODES) {
      const rows = buildReverseAmountLadder(code);
      const amounts = INDEXABLE_REVERSE_TWD_AMOUNTS[code.toLowerCase()] ?? [];
      expect(rows.length, `${code} 反向階梯表列數`).toBe(amounts.length);
      const ex = SEO_RATE_EXAMPLES[code]!;
      for (const row of rows) {
        expect(row.foreignAtCashSell).toBe(Math.round(row.twdAmount / ex.cashSell));
      }
    }
  });

  it('Answer Block 資料含雙向匯率（cashSell 與 cashBuy 估算）', () => {
    for (const code of ALL_CODES) {
      const data = getAmountAnswerData(code);
      expect(data, `${code} 缺少 answer data`).not.toBeNull();
      expect(data!.cashSell).toBeGreaterThan(0);
      if (data!.cashBuyEstimate !== null) {
        // 現金買入必然低於現金賣出（銀行價差）。
        expect(data!.cashBuyEstimate).toBeLessThan(data!.cashSell);
      }
    }
  });
});
