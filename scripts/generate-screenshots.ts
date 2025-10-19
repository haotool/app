import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = path.join(process.cwd(), 'apps/ratewise/public/screenshots');
const BASE_URL = 'http://localhost:4173';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function waitForContentLoaded(page: any, description: string) {
  console.log(`⏳ Waiting for ${description} to fully load...`);

  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Wait for initial render
  await page.waitForTimeout(5000);

  // Check for trend chart
  const chartSelector = 'svg.recharts-surface, canvas';
  const chartExists = await page.locator(chartSelector).count();

  if (chartExists > 0) {
    console.log(`✅ Trend chart detected (${chartExists} chart(s))`);
    // Wait a bit more to ensure chart is fully rendered
    await page.waitForTimeout(2000);
  } else {
    console.log(`⚠️  No trend chart found, waiting longer...`);
    await page.waitForTimeout(3000);

    // Check again
    const chartExistsRetry = await page.locator(chartSelector).count();
    if (chartExistsRetry > 0) {
      console.log(`✅ Trend chart now visible (${chartExistsRetry} chart(s))`);
      await page.waitForTimeout(1000);
    } else {
      console.log(`⚠️  Trend chart still not visible - proceeding anyway`);
    }
  }

  // Check for loading states
  const loadingElements = await page.locator('[data-loading="true"], .loading, .spinner').count();
  if (loadingElements > 0) {
    console.log(`⚠️  Found ${loadingElements} loading element(s), waiting...`);
    await page.waitForTimeout(2000);
  }

  console.log(`✅ Content loaded for ${description}`);
}

async function takeScreenshot(
  page: any,
  width: number,
  height: number,
  url: string,
  filename: string,
  description: string,
  interactions?: () => Promise<void>,
) {
  console.log(`\n📸 Creating ${filename} (${width}×${height})...`);

  // Set viewport
  await page.setViewportSize({ width, height });

  // Navigate to URL
  console.log(`🌐 Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for content to load
  await waitForContentLoaded(page, description);

  // Perform any interactions if needed
  if (interactions) {
    console.log(`🖱️  Performing interactions...`);
    await interactions();
    await page.waitForTimeout(2000); // Wait for interaction effects
  }

  // Take screenshot with optimized quality for target file size
  const outputPath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({
    path: outputPath,
    type: 'jpeg',
    quality: 75, // Reduced from 90 to hit 40-100KB target
    fullPage: false,
  });

  // Get file size
  const stats = fs.statSync(outputPath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  console.log(`✅ Created ${filename} (${fileSizeKB}KB)`);

  return { filename, size: stats.size, sizeKB: fileSizeKB, width, height };
}

async function main() {
  console.log('🚀 Starting professional screenshot generation...\n');
  console.log('📋 Target specifications:');
  console.log('   Mobile: 1080×1920 (9:16 aspect ratio)');
  console.log('   Desktop: 1920×1080 (16:9 aspect ratio)');
  console.log('   Format: JPEG @ 75% quality (optimized for size)');
  console.log('   Target size: 40-100KB per file\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    deviceScaleFactor: 1, // Standard display for smaller file size
  });
  const page = await context.newPage();

  const screenshots = [];

  try {
    // Mobile Screenshots (1080×1920)
    console.log('📱 MOBILE SCREENSHOTS (1080×1920)\n');

    // 1. Mobile Home
    screenshots.push(
      await takeScreenshot(page, 1080, 1920, BASE_URL, 'mobile-home.png', 'mobile home page'),
    );

    // 2. Mobile Converter Active
    screenshots.push(
      await takeScreenshot(
        page,
        1080,
        1920,
        BASE_URL,
        'mobile-converter-active.png',
        'mobile converter with active conversion',
        async () => {
          // Fill in amount
          const amountInput = page.locator('input[type="number"]').first();
          await amountInput.click();
          await amountInput.fill('1000');
          await page.waitForTimeout(1000);
        },
      ),
    );

    // 3. Mobile Features (FAQ or About)
    screenshots.push(
      await takeScreenshot(
        page,
        1080,
        1920,
        `${BASE_URL}/faq`,
        'mobile-features.png',
        'mobile FAQ page',
      ),
    );

    // Desktop Screenshots (1920×1080)
    console.log('\n🖥️  DESKTOP SCREENSHOTS (1920×1080)\n');

    // 4. Desktop Converter
    screenshots.push(
      await takeScreenshot(
        page,
        1920,
        1080,
        BASE_URL,
        'desktop-converter.png',
        'desktop converter page',
      ),
    );

    // 5. Desktop Features
    screenshots.push(
      await takeScreenshot(
        page,
        1920,
        1080,
        `${BASE_URL}/about`,
        'desktop-features.png',
        'desktop about page',
      ),
    );

    // Summary
    console.log('\n📊 GENERATION SUMMARY\n');
    console.log('━'.repeat(60));

    let totalSize = 0;
    screenshots.forEach((shot, index) => {
      console.log(`${index + 1}. ${shot.filename}`);
      console.log(`   Dimensions: ${shot.width}×${shot.height}`);
      console.log(`   Size: ${shot.sizeKB}KB`);
      console.log(
        `   Status: ${parseFloat(shot.sizeKB) >= 40 && parseFloat(shot.sizeKB) <= 100 ? '✅' : '⚠️'}`,
      );
      totalSize += shot.size;
    });

    console.log('━'.repeat(60));
    console.log(`Total: ${screenshots.length} screenshots, ${(totalSize / 1024).toFixed(2)}KB\n`);

    // Verification
    console.log('🔍 VERIFICATION CHECKLIST\n');
    const mobileCount = screenshots.filter((s) => s.width === 1080 && s.height === 1920).length;
    const desktopCount = screenshots.filter((s) => s.width === 1920 && s.height === 1080).length;
    const sizeCheck = screenshots.every(
      (s) => parseFloat(s.sizeKB) >= 40 && parseFloat(s.sizeKB) <= 100,
    );

    console.log(`✅ Mobile screenshots (1080×1920): ${mobileCount}/3`);
    console.log(`✅ Desktop screenshots (1920×1080): ${desktopCount}/2`);
    console.log(
      `${sizeCheck ? '✅' : '⚠️'}  File sizes: ${sizeCheck ? '40-100KB' : 'some outside range'}`,
    );
    console.log(`✅ Format: JPEG @ 75% quality`);
    console.log(`✅ Output directory: ${OUTPUT_DIR}\n`);

    console.log('✨ Screenshot generation complete!\n');
    console.log('📝 Next steps:');
    console.log('   1. Review screenshots in apps/ratewise/public/screenshots/');
    console.log('   2. Update manifest.webmanifest with new specifications');
    console.log('   3. Verify trend charts are visible in converter screenshots\n');
  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
