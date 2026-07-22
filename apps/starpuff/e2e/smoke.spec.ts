import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __sp: {
      scene: () => string;
      stage: () => number;
      bossHp: () => number;
      playerHp: () => number;
      win: () => void;
      lose: () => void;
      fillQuota: () => void;
      skipToBoss: () => void;
      spawn: (kind: string, x?: number, y?: number) => void;
      ammo: () => { ammo: number; flavor: string };
      starburst: () => { phase: string };
      probe: () => { x: number; scrollX: number };
      quota: () => { killCount: number; killQuota: number };
      gotoLevel?: (levelId: number) => void;
      save?: () => {
        highestClearedLevel: number;
        levels: Record<string, { cleared: boolean; bestTimeMs: number; eggsFound: string[] }>;
      };
    };
    // v4 stage 系統觀測點（stage.ts 掛載，dev/test 限定）。
    __spStage: {
      playerY: () => number;
      bricksAlive: () => number;
    };
    __minY: number;
  }
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function clickCanvas(page: Page, ratioX: number, ratioY: number): Promise<void> {
  const box = await page.locator('#app canvas').boundingBox();
  if (!box) throw new Error('canvas 不存在');
  await page.mouse.click(box.x + box.width * ratioX, box.y + box.height * ratioY);
}

async function startGame(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  // 開始按鈕位於畫布 66% 高度（TitleScene 佈局）。
  await clickCanvas(page, 0.5, 0.66);
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
}

test('載入 Title：canvas 顯示且零 console error', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('#app canvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Title');
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});

test('點開始進入 GameScene：遊戲運行且 HUD 狀態就緒', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // HUD 由 PLAYER_DAMAGED/AMMO_CHANGED 事件驅動；初始狀態以 debug hook 驗證。
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  // 橫式手柄：左搖桿區 + 右側 A/B 兩圓鍵 + SP 情境鍵（§109，預設隱藏；全數無文字節點）。
  await expect(page.locator('#joy-zone')).toBeVisible();
  const buttons = page.locator('[data-btn]');
  await expect(buttons).toHaveCount(3);
  for (let i = 0; i < 3; i += 1) await expect(buttons.nth(i)).toHaveText('');
  await expect(page.locator('[data-btn="sp"]')).not.toHaveClass(/is-sp-on/);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('強制勝利進 Result，勝利後回世界地圖可重入關卡', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.win());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 })
    .toBe('Result');
  // 勝利結算雙鈕（§100 D3）：主 CTA 下一關、世界地圖降次選——本案走地圖 hub（§39）。
  await page.locator('[data-menu="map"]').dispatchEvent('pointerdown', {
    pointerId: 4,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 }).toBe('Map');
  // forceWin 不寫存檔：地圖僅第 1 關開放，自節點重入。
  await page.locator('[data-menu="node-1"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 }).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});

test('第一關補滿配額出星星門，走入後進世界地圖並解鎖第二關', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(1);
  // 注入擊殺配額加速：星星門於世界右端生成，按住右行走向門。
  // 走門全程約 12s + 揭霧轉場；全套連跑時機器負載會再拉長，上限放寬至 45s。
  await page.evaluate(() => window.__sp.fillQuota());
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 45000 }).toBe('Map');
  await page.keyboard.up('ArrowRight');
  // 通關寫檔（§38）＋揭霧解鎖：自地圖節點進入第二關。
  expect(await page.evaluate(() => window.__sp.save!().levels[1]?.cleared)).toBe(true);
  await page.locator('[data-menu="node-2"]').dispatchEvent('pointerdown', {
    pointerId: 5,
    isPrimary: true,
  });
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 }).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(2);
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

test('魔王戰敗北進 Result 敗北畫面，再戰直接回魔王關', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.skipToBoss());
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(4);
  // 前室 retrofit（§86）：走過廊道入 arena 才觸發魔王入場。
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 })
    .toBeGreaterThan(0);
  await page.keyboard.up('ArrowRight');
  // 魔王關死亡＝敗北進結算（Stage 1-3 死亡仍為重試當前關）。
  await page.evaluate(() => window.__sp.lose());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 })
    .toBe('Result');
  // 再戰魔王按鈕位於畫布 68% 高度（ResultScene 佈局）；敗北重試直接回第 4 關。
  await clickCanvas(page, 0.5, 0.68);
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 }).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(4);
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

test('吞 puffy 賦星：彈匣轉珊瑚屬性，發射命中後屬性保留', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // 先按住吸入，再於吸入錐前方受控生成 puffy（高空下飄會落入錐內被拉近吞下）。
  await page.keyboard.down('X');
  await page.waitForTimeout(250);
  await page.evaluate(() => window.__sp.spawn('puffy', 190, 320));
  await expect
    .poll(() => page.evaluate(() => window.__sp.ammo()), { timeout: 8000 })
    .toEqual({ ammo: 1, flavor: 'puffy', mix: null });
  await page.keyboard.up('X');
  // 於彈道上生成標準靶（jelly 落地靜止），點按發射爆裂星命中（AoE 小爆走 burstSmall 管線）。
  await page.evaluate(() => window.__sp.spawn('jelly', 300, 350));
  await page.waitForTimeout(400);
  // 點按發射：需跨至少一個遊戲幀（Phaser 逐幀輪詢 isDown），80ms 仍低於吸入閾值。
  await page.keyboard.down('X');
  await page.waitForTimeout(80);
  await page.keyboard.up('X');
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo), { timeout: 4000 }).toBe(0);
  // 空彈匣維持前值屬性（§20）；命中演出期間零 console error。
  expect(await page.evaluate(() => window.__sp.ammo().flavor)).toBe('puffy');
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

test('跳關直達第四關魔王，強制勝利結算總用時', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.skipToBoss());
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(4);
  // 前室 retrofit（§86）：入 arena 後魔王入場演出完成 bossHp 就緒。
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 30000 })
    .toBeGreaterThan(0);
  await page.keyboard.up('ArrowRight');
  await page.evaluate(() => window.__sp.win());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 })
    .toBe('Result');
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

// 舊語意（§23）：滿三槽長按 B 0.8s 觸發星暴 → 新語意（§109）：滿五槽自動結晶成
// 蓄能星（彈匣清空），按 SP（鍵盤 C）點按引爆——B 長按不再觸發星暴（#812 誤放歸零）。
test('星暴 2.0：吞滿五槽自動結晶，SP 點按引爆清場（§109）', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // 長按吸入期間依序餵怪吞滿五槽；jelly/zappy 交錯避開 §46 配方與同系連吞升級。
  await page.keyboard.down('X');
  await page.waitForTimeout(250);
  const feed = ['jelly', 'zappy', 'jelly', 'zappy'] as const;
  for (let i = 0; i < feed.length; i += 1) {
    await page.evaluate((kind) => window.__sp.spawn(kind, 188, 340), feed[i] as string);
    await expect
      .poll(() => page.evaluate(() => window.__sp.ammo().ammo), { timeout: 8000 })
      .toBe(i + 1);
  }
  // 第五槽入匣瞬間自動結晶：彈匣清空、蓄能星生成（不觸發星暴、場上不清場）。
  await page.evaluate(() => window.__sp.spawn('jelly', 188, 340));
  await expect
    .poll(() => page.evaluate(() => window.__sp.starburst().phase), { timeout: 8000 })
    .toBe('charged');
  expect(await page.evaluate(() => window.__sp.ammo().ammo)).toBe(0);
  await page.keyboard.up('X');
  // SP（鍵盤 C）點按 → 0.3s 蓄爆 → 引爆清場；蓄能星消失。
  await page.keyboard.press('C', { delay: 120 });
  await expect
    .poll(() => page.evaluate(() => window.__sp.starburst().phase), { timeout: 8000 })
    .toBe('none');
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

test('S2 彈簧墊超級跳：走上彈簧的騰空峰值遠高於一般跳可達（§29）', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // 進第二關（§39 hub 流）並於頁內原子補配額：重載後立即開門停止生成，
  // 杜絕負載下 evaluate 往返間隔超過生成間隔（1800ms）造成敵潮干擾走查。
  await page.evaluate(async () => {
    window.__sp.gotoLevel!(2);
    while (window.__sp.stage() !== 2) {
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.__sp.fillQuota();
  });
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(2);
  // 取樣騰空高度（y 越小越高）：一般跳峰值約 278、擊退浮空約 331，彈簧 -640 峰值約 148；
  // 門檻 240 僅彈簧可達，對兩側皆有充足裕度。
  await page.evaluate(() => {
    window.__minY = 999;
    const timer = setInterval(() => {
      if (window.__sp.scene() !== 'Game') return;
      window.__minY = Math.min(window.__minY, window.__spStage.playerY());
    }, 40);
    setTimeout(() => clearInterval(timer), 15000);
  });
  // 場景已重啟，重按方向鍵註冊新 Key；x=1150 地面彈簧 walk-over 觸發，走過 1400 涵蓋整段彈跳。
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(() => page.evaluate(() => window.__sp.probe().x), { timeout: 15000 })
    .toBeGreaterThan(1400);
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__minY)).toBeLessThan(240);
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test('彩蛋 reach-x：開局反向走到世界最左緣獲 +1 HP（§24）', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await page.keyboard.down('ArrowLeft');
  // 起點 x=100 → 最左緣 maxX 60；HP 上限升至 6。
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp()), { timeout: 8000 }).toBe(6);
  await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});
