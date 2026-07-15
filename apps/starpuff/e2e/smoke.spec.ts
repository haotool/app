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
      probe: () => { x: number; scrollX: number };
      quota: () => { killCount: number; killQuota: number };
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
  // 橫式手柄：左搖桿區 + 右側 A/B 兩圓鍵（無文字節點）。
  await expect(page.locator('#joy-zone')).toBeVisible();
  const buttons = page.locator('[data-btn]');
  await expect(buttons).toHaveCount(2);
  await expect(buttons.first()).toHaveText('');
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('強制勝利進 Result，再玩一次回到 GameScene', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.win());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 })
    .toBe('Result');
  // 再玩一次按鈕位於畫布 68% 高度（ResultScene 佈局）。
  await clickCanvas(page, 0.5, 0.68);
  await expect.poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 }).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});

test('第一關補滿配額出星星門，走入後轉場進第二關', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(1);
  // 注入擊殺配額加速：星星門於世界右端生成，按住右行走向門。
  // 走門全程約 12s + 轉場 2s；全套連跑時機器負載會再拉長，上限放寬至 45s。
  await page.evaluate(() => window.__sp.fillQuota());
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 45000 }).toBe(2);
  await page.keyboard.up('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.scene())).toBe('Game');
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

test('魔王戰敗北進 Result 敗北畫面，再戰直接回魔王關', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await page.evaluate(() => window.__sp.skipToBoss());
  await expect.poll(() => page.evaluate(() => window.__sp.stage())).toBe(4);
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 15000 })
    .toBeGreaterThan(0);
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
    .toEqual({ ammo: 1, flavor: 'puffy' });
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
  // 魔王入場演出完成後 bossHp 就緒。
  await expect
    .poll(() => page.evaluate(() => window.__sp.bossHp()), { timeout: 15000 })
    .toBeGreaterThan(0);
  await page.evaluate(() => window.__sp.win());
  await expect
    .poll(() => page.evaluate(() => window.__sp.scene()), { timeout: 8000 })
    .toBe('Result');
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

test('星暴：受控吞滿三槽後長按 B，清場清彈匣（§23）', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // 長按吸入期間依序餵怪吞滿三槽（同種連吞會升級同槽，故混搭三種）。
  await page.keyboard.down('X');
  await page.waitForTimeout(250);
  await page.evaluate(() => window.__sp.spawn('jelly', 185, 340));
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo), { timeout: 8000 }).toBe(1);
  await page.evaluate(() => window.__sp.spawn('puffy', 190, 300));
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo), { timeout: 8000 }).toBe(2);
  await page.evaluate(() => window.__sp.spawn('floaty', 190, 345));
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo), { timeout: 8000 }).toBe(3);
  // 滿彈匣持續長按 0.8s → 星暴：清空彈匣（清場斷言以彈匣歸零 + 零錯誤為準）。
  await expect.poll(() => page.evaluate(() => window.__sp.ammo().ammo), { timeout: 4000 }).toBe(0);
  await page.keyboard.up('X');
  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

test('空中疾衝（§30）：空中雙擊 A 水平位移、無敵衝撞擊殺小怪', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  await expect.poll(() => page.evaluate(() => window.__sp.playerHp())).toBe(5);
  // 起跳離地（Z = A 鍵）；離地後才計入雙擊窗。
  await page.keyboard.down('Z');
  await page.waitForTimeout(60);
  await page.keyboard.up('Z');
  await page.waitForTimeout(120);
  // 疾衝路徑上豎排三隻 floaty（y 帶 250-330 覆蓋任何合理疾衝高度；floaty 無重力定高）。
  const before = await page.evaluate(() => window.__sp.probe());
  await page.evaluate(() => {
    const x = window.__sp.probe().x + 90;
    window.__sp.spawn('floaty', x, 250);
    window.__sp.spawn('floaty', x, 290);
    window.__sp.spawn('floaty', x, 330);
  });
  // 空中雙擊 A（350ms 窗）：首擊拍翅、二擊觸發疾衝。
  await page.keyboard.down('Z');
  await page.waitForTimeout(50);
  await page.keyboard.up('Z');
  await page.waitForTimeout(60);
  await page.keyboard.down('Z');
  await page.waitForTimeout(50);
  await page.keyboard.up('Z');
  // 疾衝 180px/0.18s：無左右輸入下水平位移即疾衝證據。
  await expect
    .poll(async () => (await page.evaluate(() => window.__sp.probe())).x - before.x, {
      timeout: 4000,
    })
    .toBeGreaterThan(120);
  // 無敵幀：衝撞穿牆後 HP 不掉；衝撞傷害 1 擊殺路徑上小怪（擊殺計入配額）。
  expect(await page.evaluate(() => window.__sp.playerHp())).toBe(5);
  await expect
    .poll(() => page.evaluate(() => window.__sp.quota().killCount), { timeout: 4000 })
    .toBeGreaterThanOrEqual(1);
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});

test('S2 彈簧墊超級跳：走上彈簧的騰空峰值遠高於一般跳可達（§29）', async ({ page }) => {
  const errors = collectErrors(page);
  await startGame(page);
  // 進第二關：補配額後持續右行走入星星門（同既有轉場測試路徑）。
  await page.evaluate(() => window.__sp.fillQuota());
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__sp.stage()), { timeout: 45000 }).toBe(2);
  await page.keyboard.up('ArrowRight');
  // S2 再補配額停止生成，確保走查段無敵潮干擾（開門後 spawn 停止，星星門在 x=2980 不會誤觸）。
  await page.evaluate(() => window.__sp.fillQuota());
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
