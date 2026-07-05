/**
 * haotool 官網 v2 深度 QA 腳本（issue #547/#552 驗收，PRD §7/§8、brief §5）。
 * 直接以 `node apps/haotool/tests/qa-deep-audit.mjs` 執行，需先啟動 vite preview（見 REPORT.md 步驟）。
 * 唯讀腳本：僅輸出到 screenshots/qa/，不修改任何 src 檔案。
 */
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const SCREENSHOT_DIR = path.join(REPO_ROOT, 'screenshots/qa');
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const BASE_URL = process.env.QA_BASE_URL ?? 'http://localhost:4175';

// 工具清單 SSOT：src/config/tools.ts；以 runnerImport 載入 TS，消除手寫鏡像
// （對齊 scripts/generate-sitemap.js 做法；tools.ts 內含無副檔名相對 import，
// Node type stripping 無法直接載入）。
const { module: toolsModule } = await runnerImport(
  path.resolve(__dirname, '../src/config/tools.ts'),
  { configFile: false, logLevel: 'error' },
);
const { TOOLS, getToolUrl } = toolsModule;

const SIZES = [
  { w: 375, h: 667, name: '375' },
  { w: 390, h: 844, name: '390' },
  { w: 414, h: 896, name: '414' },
  { w: 430, h: 932, name: '430' },
  { w: 768, h: 1024, name: '768' },
  { w: 1440, h: 900, name: '1440' },
];

const PAGES = [
  { path: '/', slug: 'home' },
  { path: '/tools/', slug: 'tools' },
  { path: '/about/', slug: 'about' },
  { path: '/contact/', slug: 'contact' },
  { path: '/404/', slug: '404' },
];

const report = {
  screenshots: [],
  interactions: [],
  touchTargets: [],
  keyboard: [],
  reducedMotion: [],
  lighthouse: null,
};

function record(list, name, pass, detail) {
  list.push({ name, pass, detail });
  console.log(`${pass ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

async function withPage(browser, opts, fn) {
  const context = await browser.newContext(opts);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
  try {
    return await fn(page, consoleErrors);
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Phase 1：六尺寸 × 五頁 全頁截圖 + console/水平捲動/H1 斷言
// ---------------------------------------------------------------------------
async function runScreenshotAudit(browser) {
  for (const size of SIZES) {
    for (const p of PAGES) {
      await withPage(
        browser,
        { viewport: { width: size.w, height: size.h } },
        async (page, consoleErrors) => {
          await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(400);
          const metrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            h1Count: document.querySelectorAll('h1').length,
            hasContactLink: !!document.querySelector('a[href="/contact/"], a[href$="/contact/"]'),
          }));
          const filename = `${p.slug}-${size.name}.png`;
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: true });
          const noHScroll = metrics.scrollWidth <= metrics.clientWidth;
          const pass = consoleErrors.length === 0 && noHScroll && metrics.h1Count === 1;
          report.screenshots.push({
            size: size.name,
            page: p.slug,
            consoleErrorCount: consoleErrors.length,
            consoleErrorMsgs: consoleErrors,
            noHorizontalScroll: noHScroll,
            scrollWidth: metrics.scrollWidth,
            clientWidth: metrics.clientWidth,
            h1Count: metrics.h1Count,
            hasContactLink: metrics.hasContactLink,
            pass,
            filename,
          });
          console.log(
            `${pass ? '✅' : '❌'} [${size.name}px] ${p.slug} — console=${consoleErrors.length} hScroll=${!noHScroll} h1=${metrics.h1Count}`,
          );
        },
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 2：Header / MobileMenu 互動（390×844）+ 桌面 nav（1440×900）
// ---------------------------------------------------------------------------
async function runHeaderInteractions(browser) {
  await withPage(browser, { viewport: { width: 390, height: 844 } }, async (page) => {
    await page.goto(`${BASE_URL}/tools/`, { waitUntil: 'networkidle' });

    // logo 回首頁
    await page.locator('header a[href="/"]').click();
    await page.waitForTimeout(500);
    record(
      report.interactions,
      'Header logo → 首頁',
      new URL(page.url()).pathname === '/',
      `url=${page.url()}`,
    );

    // 漢堡開啟
    const hamburger = page.getByRole('button', { name: '開啟選單' });
    const hamburgerBox = await hamburger.boundingBox();
    report.touchTargets.push({
      name: '漢堡選單按鈕',
      width: hamburgerBox?.width,
      height: hamburgerBox?.height,
      pass: (hamburgerBox?.width ?? 0) >= 44 && (hamburgerBox?.height ?? 0) >= 44,
    });
    await hamburger.click();
    await page.waitForTimeout(300);
    const openState = await page.evaluate(() => ({
      dataOpen: document.getElementById('mobile-menu')?.getAttribute('data-open'),
      bodyOverflow: document.body.style.overflow,
    }));
    record(
      report.interactions,
      '漢堡選單開啟（data-open + body scroll lock）',
      openState.dataOpen === 'true' && openState.bodyOverflow === 'hidden',
      JSON.stringify(openState),
    );

    // 選單內 3 個 nav 連結 + GitHub 外連
    const navHrefs = await page.$$eval('#mobile-menu nav a', (as) =>
      as.map((a) => a.getAttribute('href')),
    );
    record(
      report.interactions,
      '行動選單 3 個 nav 連結存在',
      navHrefs.includes('/tools/') &&
        navHrefs.includes('/about/') &&
        navHrefs.includes('/contact/'),
      JSON.stringify(navHrefs),
    );
    const githubLink = page.locator('#mobile-menu a[href*="github.com"]');
    const githubAttrs = await githubLink.evaluate((a) => ({
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
      href: a.getAttribute('href'),
    }));
    record(
      report.interactions,
      '行動選單 GitHub 外連（target=_blank rel=noopener noreferrer）',
      githubAttrs.target === '_blank' && (githubAttrs.rel ?? '').includes('noopener'),
      JSON.stringify(githubAttrs),
    );

    // Esc 關閉
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closedState = await page.evaluate(() => ({
      dataOpen: document.getElementById('mobile-menu')?.getAttribute('data-open'),
      bodyOverflow: document.body.style.overflow,
    }));
    record(
      report.interactions,
      'Esc 關閉選單（data-open=false + body scroll 解鎖）',
      closedState.dataOpen === 'false' && closedState.bodyOverflow === '',
      JSON.stringify(closedState),
    );
    // 註：MobileMenu 為全螢幕不透明選單（bg-surface 覆蓋整個視口），無獨立半透明遮罩層，
    // 故不存在「點擊遮罩關閉」互動；以關閉鈕（X）驗證等效收合能力。
    await hamburger.click();
    await page.waitForTimeout(300);
    const closeBtn = page.getByRole('button', { name: '關閉選單' });
    const closeBtnBox = await closeBtn.boundingBox();
    report.touchTargets.push({
      name: '選單關閉鈕（X）',
      width: closeBtnBox?.width,
      height: closeBtnBox?.height,
      pass: (closeBtnBox?.width ?? 0) >= 44 && (closeBtnBox?.height ?? 0) >= 44,
    });
    await closeBtn.click();
    await page.waitForTimeout(300);
    const closedViaX = await page.evaluate(() =>
      document.getElementById('mobile-menu')?.getAttribute('data-open'),
    );
    record(report.interactions, 'X 鈕關閉選單', closedViaX === 'false', `data-open=${closedViaX}`);

    // 逐一點擊 3 個 nav 連結驗證導頁（每次重開選單）
    for (const item of [
      { href: '/tools/', label: '工具' },
      { href: '/about/', label: '關於' },
      { href: '/contact/', label: '聯繫' },
    ]) {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await hamburger.click();
      await page.waitForTimeout(300);
      await page.locator(`#mobile-menu nav a[href="${item.href}"]`).click();
      await page.waitForTimeout(300);
      const pathname = new URL(page.url()).pathname;
      record(
        report.interactions,
        `行動選單導頁 → ${item.label}`,
        pathname === item.href,
        `url=${page.url()}`,
      );
    }
  });

  // 桌面版（1440×900）nav + GitHub icon
  await withPage(browser, { viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const navHrefs = await page.$$eval('header nav[aria-label="主導覽"] a', (as) =>
      as.map((a) => a.getAttribute('href')),
    );
    record(
      report.interactions,
      '桌面 Header 3 個 nav 連結存在',
      navHrefs.includes('/tools/') &&
        navHrefs.includes('/about/') &&
        navHrefs.includes('/contact/'),
      JSON.stringify(navHrefs),
    );
    const githubIcon = page.locator('header a[aria-label="GitHub"]');
    const githubAttrs = await githubIcon.evaluate((a) => ({
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
      href: a.getAttribute('href'),
    }));
    record(
      report.interactions,
      '桌面 Header GitHub 外連屬性正確',
      githubAttrs.target === '_blank' && (githubAttrs.rel ?? '').includes('noopener'),
      JSON.stringify(githubAttrs),
    );
    // 點擊各 nav 連結驗證導頁
    for (const item of [
      { href: '/tools/', label: '工具' },
      { href: '/about/', label: '關於' },
      { href: '/contact/', label: '聯繫' },
    ]) {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await page.locator(`header nav[aria-label="主導覽"] a[href="${item.href}"]`).click();
      await page.waitForTimeout(200);
      const pathname = new URL(page.url()).pathname;
      record(
        report.interactions,
        `桌面 Header 導頁 → ${item.label}`,
        pathname === item.href,
        `url=${page.url()}`,
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Phase 3：Home 頁互動
// ---------------------------------------------------------------------------
async function runHomeInteractions(browser) {
  await withPage(browser, { viewport: { width: 390, height: 844 } }, async (page) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    // Hero 雙 CTA
    const heroCtaAnchor = await page.locator('a[href="#tools"]').getAttribute('href');
    record(
      report.interactions,
      'Hero CTA「看看我做的工具」為 #tools 錨點',
      heroCtaAnchor === '#tools',
    );
    await page.locator('a[href="#tools"]').click();
    await page.waitForTimeout(400);
    const toolsInView = await page.evaluate(() => {
      const el = document.getElementById('tools');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top >= -50 && rect.top <= 200;
    });
    record(report.interactions, 'Hero CTA 錨點滾動至 #tools 區塊', toolsInView);

    const heroCtaContactHref = await page
      .locator('a[href="/contact/"]')
      .first()
      .getAttribute('href');
    record(
      report.interactions,
      'Hero CTA「和我聊專案」導向 /contact/',
      heroCtaContactHref === '/contact/',
    );

    // 5 張工具卡 href 正確
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const cardHrefs = await page.$$eval('#tools a[href^="https://app.haotool.org"]', (as) =>
      as.map((a) => a.getAttribute('href')),
    );
    const expectedHrefs = TOOLS.map(getToolUrl);
    const allMatch = expectedHrefs.every((href) => cardHrefs.includes(href));
    record(
      report.interactions,
      '5 張工具卡 href 對照 tools.ts 全部正確',
      allMatch && cardHrefs.length === 5,
      `expected=${JSON.stringify(expectedHrefs)} actual=${JSON.stringify(cardHrefs)}`,
    );

    // 統計 count-up：滾動至信任列，等待動畫，確認終值正確
    await page.locator('#stats-heading').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const statValues = await page.$$eval('.text-stat', (els) =>
      els.map((el) => el.textContent?.trim()),
    );
    const expectedStats = [`${TOOLS.length}`, '100%', '0', '90+'];
    record(
      report.interactions,
      '統計 count-up 觸發並抵達終值',
      JSON.stringify(statValues) === JSON.stringify(expectedStats),
      `actual=${JSON.stringify(statValues)} expected=${JSON.stringify(expectedStats)}`,
    );

    // 工藝證明證據錨點
    await page.locator('#craft-heading').scrollIntoViewIfNeeded();
    const evidenceHrefs = await page.$$eval(
      '#craft-heading + ul a, section:has(#craft-heading) a',
      (as) => as.map((a) => a.getAttribute('href')).filter(Boolean),
    );
    record(
      report.interactions,
      '工藝證明三張卡皆有證據錨點（≥1 可點擊）',
      evidenceHrefs.length >= 3,
      JSON.stringify(evidenceHrefs),
    );

    // 聯繫 banner 兩連結
    await page.locator('#contact-heading').scrollIntoViewIfNeeded();
    const bannerPrimaryHref = await page
      .locator('#contact-heading ~ p + a, section:has(#contact-heading) a[href="/contact/"]')
      .first()
      .getAttribute('href');
    record(
      report.interactions,
      '聯繫 banner 主 CTA 連向 /contact/',
      bannerPrimaryHref === '/contact/',
    );

    const faqGhostLink = page.locator('a[href="/about/#faq"]');
    const faqHref = await faqGhostLink.getAttribute('href');
    record(
      report.interactions,
      '聯繫 banner「先看常見問題」連向 /about/#faq',
      faqHref === '/about/#faq',
    );

    // 點擊後驗證落地不被 header 遮擋
    await faqGhostLink.click();
    await page.waitForTimeout(700);
    const faqLandDiag = await page.evaluate(() => {
      const faqHeading = document.getElementById('faq-heading');
      const header = document.querySelector('header');
      if (!faqHeading || !header) return null;
      const faqRect = faqHeading.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      return { faqTop: faqRect.top, headerBottom: headerRect.bottom, scrollY: window.scrollY };
    });
    const faqNotObscured =
      !!faqLandDiag &&
      faqLandDiag.faqTop >= faqLandDiag.headerBottom - 4 &&
      faqLandDiag.faqTop <= 400;
    if (!faqNotObscured) {
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'bug-home-to-about-faq-no-scroll.png'),
        fullPage: false,
      });
    }
    record(
      report.interactions,
      '/about/#faq 錨點著陸不被 sticky header 遮擋（且確實捲動至該區塊）',
      faqNotObscured,
      `url=${page.url()} diag=${JSON.stringify(faqLandDiag)}`,
    );
  });
}

// ---------------------------------------------------------------------------
// Phase 4：Tools 頁分類 tab
// ---------------------------------------------------------------------------
async function runToolsInteractions(browser) {
  await withPage(browser, { viewport: { width: 390, height: 844 } }, async (page) => {
    await page.goto(`${BASE_URL}/tools/`, { waitUntil: 'networkidle' });

    const tabs = page.locator('[role="group"][aria-label="分類篩選"] button');
    const tabCount = await tabs.count();
    record(
      report.interactions,
      'Tools 頁存在 4 個分類 tab（全部＋3 分類）',
      tabCount === 4,
      `count=${tabCount}`,
    );

    const firstTabBox = await tabs.first().boundingBox();
    report.touchTargets.push({
      name: 'Tools 分類 tab（含 pill-hit 擴增熱區）',
      width: firstTabBox?.width,
      height: firstTabBox?.height,
      effectiveHeight: (firstTabBox?.height ?? 0) + 4,
      pass: (firstTabBox?.width ?? 0) >= 44 && (firstTabBox?.height ?? 0) + 4 >= 44,
      note: 'CSS .pill-hit::after { inset: -2px 0 } 上下各擴增 2px，實際點擊熱區 = 視覺高度 + 4px',
    });

    const categoryCounts = {};
    for (const t of TOOLS) categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;

    for (let i = 0; i < tabCount; i += 1) {
      const tab = tabs.nth(i);
      const label = await tab.textContent();
      await tab.click();
      await page.waitForTimeout(250);
      const pressed = await tab.getAttribute('aria-pressed');
      const visibleCount = await page.$$eval(
        '#main-content ul li:not([aria-hidden="true"]) a[href^="https://app.haotool.org"]',
        (as) => as.length,
      );
      const expected =
        label?.trim() === '全部' ? TOOLS.length : (categoryCounts[`${label?.trim()}類`] ?? 0);
      record(
        report.interactions,
        `Tools tab「${label?.trim()}」aria-pressed + 過濾正確`,
        pressed === 'true' && visibleCount === expected,
        `pressed=${pressed} visible=${visibleCount} expected=${expected}`,
      );
    }

    // chips 常駐（.rounded-chip.bg-surface-sunken 精準對應 ToolCard techChips，避免與分類 pill 撞名）
    await tabs.first().click();
    await page.waitForTimeout(250);
    const chipsCount = await page.locator('.rounded-chip.bg-surface-sunken').count();
    const chipsVisible =
      chipsCount > 0 && (await page.locator('.rounded-chip.bg-surface-sunken').first().isVisible());
    record(
      report.interactions,
      'Tools 頁工具卡 chips 常駐顯示',
      chipsVisible,
      `count=${chipsCount}`,
    );
  });
}

// ---------------------------------------------------------------------------
// Phase 5：About 頁 FAQ Accordion + 錨點
// ---------------------------------------------------------------------------
async function runAboutInteractions(browser) {
  await withPage(browser, { viewport: { width: 390, height: 844 } }, async (page) => {
    await page.goto(`${BASE_URL}/about/`, { waitUntil: 'networkidle' });
    await page.locator('#faq-heading').scrollIntoViewIfNeeded();

    const triggers = page.locator('#faq button[aria-expanded]');
    const count = await triggers.count();
    record(report.interactions, 'About FAQ 存在 5 題', count === 5, `count=${count}`);

    // 注意：Accordion 預設展開第 1 題（useState(0)），故逐題測試須先讀取初始狀態再判斷切換方向。
    for (let i = 0; i < count; i += 1) {
      const trigger = triggers.nth(i);
      const before = await trigger.getAttribute('aria-expanded');
      await trigger.click();
      await page.waitForTimeout(300);
      let state = await trigger.getAttribute('aria-expanded');
      record(
        report.interactions,
        `FAQ 第 ${i + 1} 題點擊可切換狀態（${before} → ${state}）`,
        state !== before,
      );
      if (state !== 'true') {
        await trigger.click();
        await page.waitForTimeout(300);
        state = await trigger.getAttribute('aria-expanded');
      }
      record(
        report.interactions,
        `FAQ 第 ${i + 1} 題可展開（aria-expanded=true）`,
        state === 'true',
      );
      // 驗證「一次僅展開一題」：其餘 trigger 皆應為 false
      const others = await triggers.evaluateAll(
        (els, idx) =>
          els
            .filter((_, j) => j !== idx)
            .every((el) => el.getAttribute('aria-expanded') === 'false'),
        i,
      );
      record(report.interactions, `FAQ 第 ${i + 1} 題展開時其餘題目收合`, others);
      await trigger.click(); // 收合
      await page.waitForTimeout(300);
      const collapsed = await trigger.getAttribute('aria-expanded');
      record(
        report.interactions,
        `FAQ 第 ${i + 1} 題可收合（aria-expanded=false）`,
        collapsed === 'false',
      );
    }

    const firstTriggerBox = await triggers.first().boundingBox();
    report.touchTargets.push({
      name: 'FAQ Accordion 觸發列',
      width: firstTriggerBox?.width,
      height: firstTriggerBox?.height,
      pass: (firstTriggerBox?.height ?? 0) >= 44,
    });

    // #faq 與 #privacy 錨點直達
    for (const anchor of ['#faq', '#privacy']) {
      await page.goto(`${BASE_URL}/about/${anchor}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const landed = await page.evaluate((hash) => {
        const el = document.querySelector(hash);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top >= -100 && rect.top <= 300;
      }, anchor);
      record(report.interactions, `/about/${anchor} 錨點直達`, landed);
    }
  });
}

// ---------------------------------------------------------------------------
// Phase 6：Contact 頁 Email 複製 / mailto / 外連 rel / 委託區
// ---------------------------------------------------------------------------
async function runContactInteractions(browser) {
  await withPage(
    browser,
    {
      viewport: { width: 390, height: 844 },
      permissions: ['clipboard-read', 'clipboard-write'],
    },
    async (page) => {
      await page.goto(`${BASE_URL}/contact/`, { waitUntil: 'networkidle' });

      // Email 複製
      const copyBtn = page.getByRole('button', { name: '複製 Email' });
      const copyBtnBox = await copyBtn.boundingBox();
      report.touchTargets.push({
        name: 'Email 複製按鈕',
        width: copyBtnBox?.width,
        height: copyBtnBox?.height,
        pass: (copyBtnBox?.width ?? 0) >= 44 && (copyBtnBox?.height ?? 0) >= 44,
      });
      await copyBtn.click();
      await page.waitForTimeout(200);
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      record(
        report.interactions,
        'Email 複製寫入剪貼簿內容正確',
        clipboardText === 'haotool.org@gmail.com',
        `clipboard=${clipboardText}`,
      );
      const toastVisible = await page.locator('[role="status"] >> text=已複製 Email').isVisible();
      record(report.interactions, 'Email 複製後 Toast 出現', toastVisible);
      await page.waitForTimeout(2500);
      const toastGone = await page
        .locator('[role="status"] >> text=已複製 Email')
        .isVisible()
        .catch(() => false);
      record(report.interactions, 'Toast 2.4s 後自動消失', !toastGone);

      // mailto 連結（hydration 後才存在，SSG HTML 無 href）
      const mailtoRequests = [];
      page.on('request', (req) => {
        if (req.url().startsWith('mailto:')) mailtoRequests.push(req.url());
      });
      const mailtoBtn = page.getByRole('button', { name: '或直接開啟郵件程式 →' });
      const mailtoExists = (await mailtoBtn.count()) === 1;
      record(report.interactions, 'MailtoLink hydration 後存在（button 元素）', mailtoExists);
      await mailtoBtn.click();
      await page.waitForTimeout(300);
      const expectedMailto = `mailto:haotool.org@gmail.com?subject=${encodeURIComponent('專案合作洽詢')}`;
      record(
        report.interactions,
        'mailto 連結帶正確預填主旨',
        mailtoRequests.includes(expectedMailto),
        `captured=${JSON.stringify(mailtoRequests)} expected=${expectedMailto}`,
      );

      // GitHub / Threads rel=noopener
      for (const [label, hrefPart] of [
        ['GitHub', 'github.com'],
        ['Threads', 'threads.net'],
      ]) {
        const link = page.locator(`a[href*="${hrefPart}"]`).first();
        const attrs = await link.evaluate((a) => ({
          target: a.getAttribute('target'),
          rel: a.getAttribute('rel'),
        }));
        record(
          report.interactions,
          `Contact ${label} 卡 rel=noopener noreferrer`,
          attrs.target === '_blank' && (attrs.rel ?? '').includes('noopener'),
          JSON.stringify(attrs),
        );
      }

      // 委託區三步
      const scopeChips = await page.locator('ul[aria-label="承接範圍"] li').count();
      record(
        report.interactions,
        '委託區承接範圍 4 個 chips',
        scopeChips === 4,
        `count=${scopeChips}`,
      );
      const hireSteps = await page.locator('ol li').count();
      record(report.interactions, '委託區合作流程三步存在', hireSteps === 3, `count=${hireSteps}`);
    },
  );
}

// ---------------------------------------------------------------------------
// Phase 7：404 頁
// ---------------------------------------------------------------------------
async function runNotFoundInteractions(browser) {
  await withPage(browser, { viewport: { width: 390, height: 844 } }, async (page) => {
    await page.goto(`${BASE_URL}/404/`, { waitUntil: 'networkidle' });

    const toolLinks = await page.$$eval('nav[aria-label="工具導流"] a', (as) =>
      as.map((a) => a.getAttribute('href')),
    );
    const expectedHrefs = TOOLS.map(getToolUrl);
    record(
      report.interactions,
      '404 頁 5 個工具連結 href 正確',
      expectedHrefs.every((h) => toolLinks.includes(h)) && toolLinks.length === 5,
      `actual=${JSON.stringify(toolLinks)}`,
    );

    const homeBtn = page.getByRole('link', { name: '回首頁' });
    await homeBtn.click();
    await page.waitForTimeout(500);
    record(
      report.interactions,
      '404 頁「回首頁」按鈕導向 /',
      new URL(page.url()).pathname === '/',
      `url=${page.url()}`,
    );
  });
}

// ---------------------------------------------------------------------------
// Phase 7.5：補充驗證 SPA 內部導頁＋錨點是否會捲動（Footer「隱私政策」→ /about/#privacy）
// 與 Home「先看常見問題」同屬 in-app hash 導頁模式，用於確認 bug 影響範圍。
// ---------------------------------------------------------------------------
async function runFooterHashNavigationAudit(browser) {
  await withPage(browser, { viewport: { width: 390, height: 844 } }, async (page) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.locator('footer a[href="/about/#privacy"]').click();
    await page.waitForTimeout(700);
    const diag = await page.evaluate(() => {
      const el = document.getElementById('privacy-heading');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { top: rect.top, scrollY: window.scrollY };
    });
    const landed = !!diag && diag.top >= 0 && diag.top <= 400;
    record(
      report.interactions,
      'Footer「隱私政策」/about/#privacy SPA 導頁後有捲動至該區塊',
      landed,
      `url=${page.url()} diag=${JSON.stringify(diag)}`,
    );
  });
}

// ---------------------------------------------------------------------------
// Phase 8：鍵盤導覽（Tab 順序 / focus ring / Enter 觸發工具卡）
// ---------------------------------------------------------------------------
async function runKeyboardAudit(browser) {
  await withPage(browser, { viewport: { width: 390, height: 844 } }, async (page) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => ({
      text: document.activeElement?.textContent?.trim(),
      tag: document.activeElement?.tagName,
    }));
    record(
      report.keyboard,
      'Tab 順序第一個焦點為 Skip Link「跳至主內容」',
      first.text === '跳至主內容',
      JSON.stringify(first),
    );

    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    record(
      report.keyboard,
      'Skip Link focus-visible 有可見 outline',
      outline?.outlineStyle !== 'none' && outline?.outlineWidth !== '0px',
      JSON.stringify(outline),
    );

    // Enter 觸發工具卡：攔截外站請求避免真的離站，僅驗證觸發正確 URL
    await page.route('https://app.haotool.org/**', (route) => route.abort());
    const requestedUrls = [];
    page.on('request', (req) => {
      // hostname 嚴格比對，避免子字串比對被任意 host 繞過（CodeQL js/incomplete-url-substring-sanitization）。
      if (new URL(req.url()).hostname === 'app.haotool.org') requestedUrls.push(req.url());
    });
    const ratewiseCard = page.locator('a[href="https://app.haotool.org/ratewise/"]').first();
    await ratewiseCard.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    record(
      report.keyboard,
      'Enter 鍵觸發工具卡導覽（HaoRate）',
      requestedUrls.some((u) => u.includes('ratewise')),
      JSON.stringify(requestedUrls),
    );
  });
}

// ---------------------------------------------------------------------------
// Phase 9：prefers-reduced-motion（入場動畫停用 — 無 transform 位移）
// ---------------------------------------------------------------------------
async function runReducedMotionAudit(browser) {
  await withPage(
    browser,
    { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' },
    async (page) => {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await page.locator('#stats-heading').scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      const transforms = await page.$$eval('#stats-heading, #stats-heading ~ ul', (els) =>
        els.map((el) => window.getComputedStyle(el).transform),
      );
      const noTranslate = transforms.every((t) => {
        if (t === 'none') return true;
        // matrix(a, b, c, d, tx, ty) — reduced-motion 時 tx/ty 應為 0（僅 opacity 動畫）。
        const match = /matrix\(([^)]+)\)/.exec(t);
        if (!match) return true;
        const parts = match[1].split(',').map((n) => parseFloat(n.trim()));
        const ty = parts[5] ?? 0;
        return Math.abs(ty) < 0.5;
      });
      record(
        report.reducedMotion,
        'prefers-reduced-motion 下 Reveal 區塊無 translateY 位移',
        noTranslate,
        JSON.stringify(transforms),
      );

      const opacity = await page
        .locator('#stats-heading')
        .evaluate((el) => window.getComputedStyle(el).opacity);
      record(
        report.reducedMotion,
        'prefers-reduced-motion 下內容仍可見（opacity=1）',
        parseFloat(opacity) === 1,
        `opacity=${opacity}`,
      );
    },
  );
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const browser = await chromium.launch();
  try {
    if (!process.env.QA_SKIP_SCREENSHOTS) {
      console.log('\n=== Phase 1: 六尺寸 × 五頁 截圖與斷言 ===');
      await runScreenshotAudit(browser);
    }

    console.log('\n=== Phase 2: Header / MobileMenu 互動 ===');
    await runHeaderInteractions(browser);

    console.log('\n=== Phase 3: Home 頁互動 ===');
    await runHomeInteractions(browser);

    console.log('\n=== Phase 4: Tools 頁分類 tab ===');
    await runToolsInteractions(browser);

    console.log('\n=== Phase 5: About 頁 FAQ / 錨點 ===');
    await runAboutInteractions(browser);

    console.log('\n=== Phase 6: Contact 頁 ===');
    await runContactInteractions(browser);

    console.log('\n=== Phase 7: 404 頁 ===');
    await runNotFoundInteractions(browser);

    console.log('\n=== Phase 7.5: Footer 內部錨點導頁驗證 ===');
    await runFooterHashNavigationAudit(browser);

    console.log('\n=== Phase 8: 鍵盤導覽 ===');
    await runKeyboardAudit(browser);

    console.log('\n=== Phase 9: prefers-reduced-motion ===');
    await runReducedMotionAudit(browser);
  } finally {
    await browser.close();
  }

  writeFileSync(path.join(SCREENSHOT_DIR, 'qa-results.json'), JSON.stringify(report, null, 2));
  console.log('\n✅ 結果已寫入 screenshots/qa/qa-results.json');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
