/**
 * PoC 取證腳本（issue #752 羅盤頁佈局 v2）。
 * 以 CLI Playwright 走取證矩陣（視口 × 主題 × 態），輸出截圖與量化零遮蔽指標：
 * - wedgeInHubPct：楔形帶取樣點落入 Hub 圓比例（目標 0）
 * - cardinal[].inHubPct：方位字格點落入 Hub 圓比例（目標 0）
 * - cardinal[].clippedPx：方位字溢出 stage 邊界像素（目標 0）
 * - anchorPillOverlapPct / pillDoesNotOverlapDeck：平放 pill 與錨點/deck 的關係（目標 0 / true）
 * 用法：node scripts/poc-r4a.mjs <outDir>（需 preview server 於 :4176）
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:4176/park-keeper/';
const OUT = process.argv[2] ?? 'screenshots/poc-r4a-r1';
mkdirSync(OUT, { recursive: true });

const RECORD_POS = { latitude: 25.034, longitude: 121.5644 };
// 車位正南 ~55m：目標方位=北 0°，heading 0 即對準。
const AWAY_POS = { latitude: 25.0335, longitude: 121.5644 };

const THEME_BUTTONS = { racing: 'Nitro', cute: 'Kawaii', minimalist: 'Zen', literary: 'Classic' };

/** heading = (360 - alpha) % 360；beta 為俯仰（≥75° 觸發非平放）。 */
async function dispatchOrientation(page, { alpha, beta = 10 }) {
  await page.evaluate(
    ([a, b]) => {
      for (let i = 0; i < 14; i++) {
        window.dispatchEvent(
          new DeviceOrientationEvent('deviceorientationabsolute', {
            alpha: a,
            beta: b,
            gamma: 0,
            absolute: true,
          }),
        );
      }
    },
    [alpha, beta],
  );
}

async function measure(page) {
  return page.evaluate(() => {
    const q = (sel) => document.querySelector(sel);
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        w: r.width,
        h: r.height,
      };
    };
    const hub = q('[data-testid="compass-hub"]');
    const arc = q('[data-testid="compass-arc"]');
    const capsule = q('[data-testid="compass-capsule"]');
    const deck = q('[data-testid="compass-deck"]');
    const stage = arc?.parentElement ?? capsule?.parentElement ?? null;
    const out = {
      mode: arc ? 'arc' : capsule ? 'capsule' : 'none',
      deck: rect(deck),
      stage: rect(stage),
      hub: rect(hub),
    };

    let hubCircle = null;
    if (hub) {
      const hr = hub.getBoundingClientRect();
      hubCircle = { x: hr.left + hr.width / 2, y: hr.top + hr.height / 2, r: hr.width / 2 };
    }
    const inHub = (x, y) =>
      !!hubCircle && Math.hypot(x - hubCircle.x, y - hubCircle.y) < hubCircle.r - 0.5;

    // 楔形帶：SVG path 全長取樣 200 點經 screen CTM 轉螢幕座標。
    out.wedgeInHubPct = null;
    if (arc) {
      const svgs = arc.querySelectorAll('svg');
      const wedgeSvg = svgs[1] ?? null;
      const path = wedgeSvg?.querySelector('path') ?? null;
      const ctm = path?.getScreenCTM?.();
      if (path && ctm) {
        const len = path.getTotalLength();
        const N = 200;
        let inside = 0;
        for (let i = 0; i < N; i++) {
          const pt = path.getPointAtLength((len * i) / N);
          const sx = ctm.a * pt.x + ctm.c * pt.y + ctm.e;
          const sy = ctm.b * pt.x + ctm.d * pt.y + ctm.f;
          if (inHub(sx, sy)) inside++;
        }
        out.wedgeInHubPct = (inside / N) * 100;
      }
      // 車位錨點（楔形 svg 中的 circle）。
      const anchor = wedgeSvg?.querySelector('circle') ?? null;
      out.anchor = rect(anchor);
    }

    // 方位字：5×5 格點 vs Hub 圓；並量 stage 邊界裁切。
    out.cardinal = [];
    if (arc && stage) {
      const st = stage.getBoundingClientRect();
      for (const tEl of arc.querySelectorAll('svg text')) {
        const tr = tEl.getBoundingClientRect();
        let inside = 0;
        let total = 0;
        for (let gx = 0; gx <= 4; gx++) {
          for (let gy = 0; gy <= 4; gy++) {
            total++;
            if (inHub(tr.left + (tr.width * gx) / 4, tr.top + (tr.height * gy) / 4)) inside++;
          }
        }
        const clippedPx =
          Math.max(0, st.top - tr.top) +
          Math.max(0, tr.bottom - st.bottom) +
          Math.max(0, st.left - tr.left) +
          Math.max(0, tr.right - st.right);
        // 半圓弧設計：低於 Hub 中心的方位字屬視窗外（by design），不計入可見裁切。
        const centerY = tr.top + tr.height / 2;
        const windowedOut = !!hubCircle && centerY > hubCircle.y;
        out.cardinal.push({
          label: tEl.textContent,
          inHubPct: (inside / total) * 100,
          clippedPx: Number(clippedPx.toFixed(1)),
          windowedOut,
          visibleClippedPx: windowedOut ? 0 : Number(clippedPx.toFixed(1)),
        });
      }
    }

    // 平放 pill（地圖區底緣）：不得越過 deck 上緣、不得與錨點相交。
    const pillEl = [...document.querySelectorAll('div')].find(
      (el) => el.textContent === '請平放手機' && el.className.includes('rounded-full'),
    );
    out.pill = rect(pillEl ?? null);
    out.pillDoesNotOverlapDeck = null;
    out.anchorPillOverlapPct = null;
    if (out.pill && out.deck) out.pillDoesNotOverlapDeck = out.pill.bottom <= out.deck.top + 0.5;
    if (out.pill && out.anchor) {
      const ix = Math.max(
        0,
        Math.min(out.pill.right, out.anchor.right) - Math.max(out.pill.left, out.anchor.left),
      );
      const iy = Math.max(
        0,
        Math.min(out.pill.bottom, out.anchor.bottom) - Math.max(out.pill.top, out.anchor.top),
      );
      const anchorArea = out.anchor.w * out.anchor.h;
      out.anchorPillOverlapPct = anchorArea > 0 ? ((ix * iy) / anchorArea) * 100 : 0;
    }

    // 膠囊高度（降級 SSOT=56）。
    out.capsuleH = capsule ? (rect(capsule.querySelector(':scope > div'))?.h ?? null) : null;
    return out;
  });
}

async function runScenario(browser, scenario) {
  const { id, viewport, theme, state } = scenario;
  const context = await browser.newContext({
    viewport,
    geolocation: RECORD_POS,
    permissions: ['geolocation'],
    deviceScaleFactor: 2,
    isMobile: viewport.width < 500,
    hasTouch: true,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(BASE);
  // 建立記錄（FAB → B3 auto-save）。
  await page.getByRole('button', { name: '新增停車紀錄' }).click();
  await page.getByRole('button', { name: 'B3', exact: true }).click();
  await page.getByTestId('pickup-hero-card').waitFor();

  // 主題切換（settings → 回首頁）。
  if (theme && theme !== 'minimalist') {
    await page.goto(`${BASE}settings/`);
    await page.getByRole('button', { name: THEME_BUTTONS[theme] }).click();
    await page.goto(BASE);
    await page.getByTestId('pickup-hero-card').waitFor();
  }

  // 非抵達態：先把使用者移離車位再開導航。
  if (state !== 'arrived') await context.setGeolocation(AWAY_POS);

  await page.getByTestId('pickup-hero-card').click();
  await page.getByTestId('compass-deck').waitFor();

  // 態注入。
  if (state === 'aligned') await dispatchOrientation(page, { alpha: 0 });
  else if (state === 'normal') await dispatchOrientation(page, { alpha: 270 });
  else if (state === 'notflat') await dispatchOrientation(page, { alpha: 270, beta: 80 });
  else if (state === 'arrived') await dispatchOrientation(page, { alpha: 0 });

  // 等進場 scale 與 heading spring 收斂。
  await page.waitForTimeout(1400);

  const metrics = await measure(page);
  metrics.consoleErrors = consoleErrors;
  await page.screenshot({ path: `${OUT}/${id}.png` });
  await context.close();
  return { id, viewport, theme, state, ...metrics };
}

const SCENARIOS = [
  // 四主題 × 對準（390×844）
  {
    id: '390x844-racing-aligned',
    viewport: { width: 390, height: 844 },
    theme: 'racing',
    state: 'aligned',
  },
  {
    id: '390x844-cute-aligned',
    viewport: { width: 390, height: 844 },
    theme: 'cute',
    state: 'aligned',
  },
  {
    id: '390x844-minimalist-aligned',
    viewport: { width: 390, height: 844 },
    theme: 'minimalist',
    state: 'aligned',
  },
  {
    id: '390x844-literary-aligned',
    viewport: { width: 390, height: 844 },
    theme: 'literary',
    state: 'aligned',
  },
  // 四主題 × notflat（390×844；pill 在地圖區底緣）
  {
    id: '390x844-racing-notflat',
    viewport: { width: 390, height: 844 },
    theme: 'racing',
    state: 'notflat',
  },
  {
    id: '390x844-cute-notflat',
    viewport: { width: 390, height: 844 },
    theme: 'cute',
    state: 'notflat',
  },
  {
    id: '390x844-minimalist-notflat',
    viewport: { width: 390, height: 844 },
    theme: 'minimalist',
    state: 'notflat',
  },
  {
    id: '390x844-literary-notflat',
    viewport: { width: 390, height: 844 },
    theme: 'literary',
    state: 'notflat',
  },
  // 抵達態
  {
    id: '390x844-minimalist-arrived',
    viewport: { width: 390, height: 844 },
    theme: 'minimalist',
    state: 'arrived',
  },
  // 375×667（SE/8）
  {
    id: '375x667-minimalist-normal',
    viewport: { width: 375, height: 667 },
    theme: 'minimalist',
    state: 'normal',
  },
  {
    id: '375x667-racing-notflat',
    viewport: { width: 375, height: 667 },
    theme: 'racing',
    state: 'notflat',
  },
  // 有效視高 553（Safari 工具列）→ 膠囊
  {
    id: '375x553-minimalist-normal',
    viewport: { width: 375, height: 553 },
    theme: 'minimalist',
    state: 'normal',
  },
  {
    id: '375x553-racing-aligned',
    viewport: { width: 375, height: 553 },
    theme: 'racing',
    state: 'aligned',
  },
  // 橫向 → 膠囊
  {
    id: '844x390-minimalist-normal',
    viewport: { width: 844, height: 390 },
    theme: 'minimalist',
    state: 'normal',
  },
  // 大屏 sanity
  {
    id: '430x932-literary-normal',
    viewport: { width: 430, height: 932 },
    theme: 'literary',
    state: 'normal',
  },
];

const browser = await chromium.launch();
const results = [];
for (const s of SCENARIOS) {
  try {
    const r = await runScenario(browser, s);
    results.push(r);
    const worst = {
      wedge: r.wedgeInHubPct,
      cardinalMaxInHub: Math.max(0, ...(r.cardinal ?? []).map((c) => c.inHubPct)),
      cardinalMaxVisibleClip: Math.max(0, ...(r.cardinal ?? []).map((c) => c.visibleClippedPx)),
      capsuleH: r.capsuleH,
      errors: r.consoleErrors.length,
    };
    console.log(`OK ${s.id} mode=${r.mode}`, JSON.stringify(worst));
  } catch (err) {
    results.push({ id: s.id, error: String(err) });
    console.log(`FAIL ${s.id}: ${String(err).slice(0, 200)}`);
  }
}
await browser.close();
writeFileSync(`${OUT}/metrics.json`, JSON.stringify(results, null, 2));
console.log(`\nWrote ${OUT}/metrics.json`);
